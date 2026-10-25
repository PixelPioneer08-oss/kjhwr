"""
GB Wind Forecast vs Actuals Analysis Module.

Domain Rules:
1. Error sign convention: error = forecast - actual.
   Positive (>0) = wind over-forecast (shortfall, client under-buys non-wind).
   Negative (<0) = wind under-forecast (surplus, client over-buys non-wind).
2. Cutoff rule (gate mode): For delivery day D, cut-off is D-1 at gate closure (default 09:20 London time).
   No forecast published after cut-off is ever used (publishTime <= cut-off).
3. Cutoff rule (horizon mode): For target startTime T, cut-off is T - horizon_hours.
4. Exact startTime join: No interpolation or invented data.
"""

import os
import json
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

# London timezone
TZ_LONDON = "Europe/London"

class DataLoader:
    def __init__(self, data_dir: Optional[str] = None):
        if not data_dir:
            # Look in ../data or ../../data or ./data
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            candidate = os.path.join(base_dir, "data")
            if os.path.exists(candidate):
                data_dir = candidate
            else:
                data_dir = "data"
        self.data_dir = data_dir
        self.actuals: Optional[pd.DataFrame] = None
        self.forecasts: Optional[pd.DataFrame] = None
        self.metadata: Optional[Dict[str, Any]] = None
        self.load()

    def load(self):
        act_path = os.path.join(self.data_dir, "actuals.csv")
        fc_path = os.path.join(self.data_dir, "forecasts.csv")
        meta_path = os.path.join(self.data_dir, "metadata.json")

        if not os.path.exists(act_path) or not os.path.exists(fc_path):
            raise FileNotFoundError(f"Data files missing in {self.data_dir}. Run scripts/fetch_data.py first.")

        df_act = pd.read_csv(act_path)
        df_act["startTime"] = pd.to_datetime(df_act["startTime"], utc=True)
        if "publishTime" in df_act.columns:
            df_act["publishTime"] = pd.to_datetime(df_act["publishTime"], utc=True)
        self.actuals = df_act

        df_fc = pd.read_csv(fc_path)
        df_fc["startTime"] = pd.to_datetime(df_fc["startTime"], utc=True)
        df_fc["publishTime"] = pd.to_datetime(df_fc["publishTime"], utc=True)
        self.forecasts = df_fc

        if os.path.exists(meta_path):
            with open(meta_path, "r") as f:
                self.metadata = json.load(f)
        else:
            self.metadata = {
                "actuals_resolution_minutes": 30,
                "forecasts_resolution_minutes": 60,
                "is_synthetic": False
            }


def parse_date_str(date_str: str) -> date:
    """Parse YYYY-MM-DD into date object."""
    return datetime.strptime(date_str, "%Y-%m-%d").date()


def get_delivery_days_for_decision_window(decision_from: date, decision_to: date) -> List[date]:
    """
    For decision days D-1 in [decision_from, decision_to],
    delivery days D are [decision_from + 1 day, decision_to + 1 day].
    """
    days = []
    curr = decision_from
    while curr <= decision_to:
        days.append(curr + timedelta(days=1))
        curr += timedelta(days=1)
    return days


def align_and_evaluate(
    actuals_df: pd.DataFrame,
    forecasts_df: pd.DataFrame,
    mode: str = "gate",
    cutoff: str = "09:20",
    horizon_hours: float = 24.0,
    decision_from: Optional[date] = None,
    decision_to: Optional[date] = None,
    delivery_from: Optional[date] = None,
    delivery_to: Optional[date] = None
) -> pd.DataFrame:
    """
    Filters forecasts according to cut-off rule and joins with actuals on exact startTime.
    
    Returns DataFrame with columns:
    [startTime, publishTime, generation_fc, generation_act, error, lead_time_hours, delivery_date, hour_of_day]
    """
    # Determine delivery date range
    if decision_from and decision_to:
        deliv_dates = set(get_delivery_days_for_decision_window(decision_from, decision_to))
    elif delivery_from and delivery_to:
        deliv_dates = set()
        curr = delivery_from
        while curr <= delivery_to:
            deliv_dates.add(curr)
            curr += timedelta(days=1)
    else:
        raise ValueError("Must provide either (decision_from, decision_to) or (delivery_from, delivery_to).")

    # Add London local date to target startTime
    # Elexon startTime is UTC. Convert to Europe/London to assign delivery day and hour.
    fc = forecasts_df.copy()
    fc["startTime_london"] = fc["startTime"].dt.tz_convert(TZ_LONDON)
    fc["delivery_date"] = fc["startTime_london"].dt.date
    
    # Filter targets to selected delivery dates
    fc = fc[fc["delivery_date"].isin(deliv_dates)]
    if fc.empty:
        return pd.DataFrame()

    if mode == "gate":
        # Parse cutoff HH:MM
        cutoff_parts = [int(p) for p in cutoff.split(":")]
        cutoff_hour, cutoff_minute = cutoff_parts[0], cutoff_parts[1]
        
        # For each target row, decision day is delivery_date - 1 day
        # Cut-off timestamp is (delivery_date - 1 day) at cutoff_hour:cutoff_minute in London time
        # Precompute cut-off UTC timestamp for each distinct delivery day
        cutoff_map = {}
        for d in deliv_dates:
            dec_day = d - timedelta(days=1)
            # Create tz-aware Timestamp in Europe/London, convert to UTC
            cutoff_london = pd.Timestamp(
                year=dec_day.year,
                month=dec_day.month,
                day=dec_day.day,
                hour=cutoff_hour,
                minute=cutoff_minute,
                tz=TZ_LONDON
            )
            cutoff_map[d] = cutoff_london.tz_convert("UTC")
            
        fc["cutoff_utc"] = fc["delivery_date"].map(cutoff_map)
        
        # Strictly apply publishTime <= cutoff_utc (inclusive cut-off, never after)
        valid_fc = fc[fc["publishTime"] <= fc["cutoff_utc"]]
    elif mode == "horizon":
        # Cut-off is startTime - horizon_hours
        valid_fc = fc[fc["publishTime"] <= (fc["startTime"] - pd.Timedelta(hours=horizon_hours))]
    else:
        raise ValueError(f"Unknown mode: {mode}. Must be 'gate' or 'horizon'.")

    if valid_fc.empty:
        return pd.DataFrame()

    # For each target startTime, pick the newest publishTime
    # Sort by publishTime ascending, then groupby startTime and take last
    latest_fc = valid_fc.sort_values("publishTime").groupby("startTime").last().reset_index()

    # Join on exact startTime with actuals (inner join: report only exact matched points)
    act = actuals_df[["startTime", "generation"]].copy()
    merged = pd.merge(latest_fc, act, on="startTime", suffixes=("_fc", "_act"))
    
    # Error sign convention: error = forecast - actual
    merged["error"] = merged["generation_fc"] - merged["generation_act"]
    merged["lead_time_hours"] = (merged["startTime"] - merged["publishTime"]).dt.total_seconds() / 3600.0
    merged["startTime_london"] = merged["startTime"].dt.tz_convert(TZ_LONDON)
    merged["delivery_date"] = merged["startTime_london"].dt.date
    merged["hour_of_day"] = merged["startTime_london"].dt.hour

    return merged.sort_values("startTime").reset_index(drop=True)


def calculate_metrics(df: pd.DataFrame, interval_hours: float = 1.0) -> Dict[str, Any]:
    """Calculate quantitative forecast evaluation metrics."""
    n = len(df)
    if n == 0:
        return {
            "n": 0,
            "mae": 0.0,
            "rmse": 0.0,
            "bias": 0.0,
            "wape": 0.0,
            "mape": 0.0,
            "share_overforecast": 0.0,
            "error_percentiles": {"p05": 0.0, "p10": 0.0, "p50": 0.0, "p90": 0.0, "p95": 0.0},
            "mean_lead_time_hours": 0.0,
            "total_overforecast_mwh": 0.0,
            "total_actual_mwh": 0.0,
            "total_forecast_mwh": 0.0,
            "buffer_p90": 0.0,
            "buffer_p95": 0.0,
            "mean_actual": 0.0,
            "mean_forecast": 0.0
        }

    errors = df["error"].to_numpy()
    actuals = df["generation_act"].to_numpy()
    forecasts = df["generation_fc"].to_numpy()
    lead_times = df["lead_time_hours"].to_numpy()

    abs_errors = np.abs(errors)
    mae = float(np.mean(abs_errors))
    rmse = float(np.sqrt(np.mean(errors ** 2)))
    bias = float(np.mean(errors))

    # WAPE = sum(|e|) / sum(actual) * 100
    sum_act = float(np.sum(actuals))
    wape = float(np.sum(abs_errors) / sum_act * 100) if sum_act > 0 else 0.0

    # MAPE computed only where actual >= 100 MW
    mask_100 = actuals >= 100.0
    if np.any(mask_100):
        mape = float(np.mean(abs_errors[mask_100] / actuals[mask_100]) * 100)
    else:
        mape = 0.0

    # Share of over-forecast intervals (error > 0)
    share_over = float(np.mean(errors > 0) * 100)

    # Percentiles
    p05 = float(np.percentile(errors, 5))
    p10 = float(np.percentile(errors, 10))
    p50 = float(np.percentile(errors, 50))
    p90 = float(np.percentile(errors, 90))
    p95 = float(np.percentile(errors, 95))

    # Risk buffer: max(0, P90) and max(0, P95)
    buffer_p90 = float(max(0.0, p90))
    buffer_p95 = float(max(0.0, p95))

    # Energy calculations
    over_errors = np.maximum(0.0, errors)
    total_over_mwh = float(np.sum(over_errors) * interval_hours)
    total_act_mwh = float(np.sum(actuals) * interval_hours)
    total_fc_mwh = float(np.sum(forecasts) * interval_hours)

    return {
        "n": int(n),
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "bias": round(bias, 2),
        "wape": round(wape, 2),
        "mape": round(mape, 2),
        "share_overforecast": round(share_over, 2),
        "error_percentiles": {
            "p05": round(p05, 2),
            "p10": round(p10, 2),
            "p50": round(p50, 2),
            "p90": round(p90, 2),
            "p95": round(p95, 2)
        },
        "mean_lead_time_hours": round(float(np.mean(lead_times)), 2),
        "total_overforecast_mwh": round(total_over_mwh, 2),
        "total_actual_mwh": round(total_act_mwh, 2),
        "total_forecast_mwh": round(total_fc_mwh, 2),
        "buffer_p90": round(buffer_p90, 2),
        "buffer_p95": round(buffer_p95, 2),
        "mean_actual": round(float(np.mean(actuals)), 2),
        "mean_forecast": round(float(np.mean(forecasts)), 2)
    }


def compute_daily_breakdown(df: pd.DataFrame, interval_hours: float = 1.0) -> List[Dict[str, Any]]:
    """Group metrics by delivery date."""
    if df.empty:
        return []
    res = []
    for d, group in df.groupby("delivery_date"):
        m = calculate_metrics(group, interval_hours)
        m["date"] = str(d)
        res.append(m)
    return sorted(res, key=lambda x: x["date"])


def compute_hourly_breakdown(df: pd.DataFrame, interval_hours: float = 1.0) -> List[Dict[str, Any]]:
    """Group metrics by hour of day (0..23)."""
    if df.empty:
        return []
    res = []
    for h in range(24):
        group = df[df["hour_of_day"] == h]
        m = calculate_metrics(group, interval_hours)
        m["hour"] = h
        res.append(m)
    return res


def compute_lead_time_curve(
    actuals_df: pd.DataFrame,
    forecasts_df: pd.DataFrame,
    decision_from: Optional[date] = None,
    decision_to: Optional[date] = None,
    delivery_from: Optional[date] = None,
    delivery_to: Optional[date] = None,
    max_horizon: int = 48
) -> List[Dict[str, Any]]:
    """
    Computes accuracy metrics for horizons h = 1..max_horizon hours.
    Each horizon h tests: latest forecast published at least h hours before target startTime.
    """
    curve = []
    for h in range(1, max_horizon + 1):
        df_h = align_and_evaluate(
            actuals_df=actuals_df,
            forecasts_df=forecasts_df,
            mode="horizon",
            horizon_hours=float(h),
            decision_from=decision_from,
            decision_to=decision_to,
            delivery_from=delivery_from,
            delivery_to=delivery_to
        )
        m = calculate_metrics(df_h)
        curve.append({
            "horizon_hours": h,
            "n": m["n"],
            "mae": m["mae"],
            "rmse": m["rmse"],
            "bias": m["bias"],
            "p90": m["error_percentiles"]["p90"],
            "buffer_p90": m["buffer_p90"]
        })
    return curve
