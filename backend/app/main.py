"""
FastAPI Backend for GB Wind Day-Ahead Forecast Evaluation Pilot.
"""

import os
import re
from datetime import datetime, date, timezone
from typing import Optional, Literal
from fastapi import FastAPI, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from .analysis import (
    DataLoader,
    parse_date_str,
    align_and_evaluate,
    calculate_metrics,
    compute_daily_breakdown,
    compute_hourly_breakdown,
    compute_lead_time_curve,
    get_delivery_days_for_decision_window
)

app = FastAPI(
    title="GB Wind Day-Ahead Forecast Evaluation Pilot API",
    description="Quantitative forecast evaluation for UK energy utility day-ahead trading desk using Elexon BMRS data.",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global DataLoader instance
loader: Optional[DataLoader] = None

def get_loader() -> DataLoader:
    global loader
    if loader is None:
        try:
            loader = DataLoader()
        except FileNotFoundError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Elexon data cache not found. Please run scripts/fetch_data.py to populate cache: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to load data: {str(e)}"
            )
    return loader


@app.get("/api/health")
def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "GB Wind Day-Ahead Evaluator"
    }


@app.get("/api/meta")
def get_metadata():
    """Returns dataset provenance, detected resolutions, and observed publish times."""
    dl = get_loader()
    meta = dl.metadata.copy() if dl.metadata else {}
    meta["data_sources"] = {
        "actuals": "Elexon BMRS API v1 /datasets/FUELHH/stream (fuelType=WIND)",
        "forecasts": "Elexon BMRS API v1 /datasets/WINDFOR/stream"
    }
    meta["gate_closures_info"] = {
        "EPEX_GB": "09:20 London time (default)",
        "N2EX": "09:50 London time",
        "Sensitivity_later_cutoff": "11:00 London time"
    }
    meta["error_convention"] = "error = forecast - actual (Positive: over-forecast/shortfall; Negative: under-forecast/surplus)"
    return meta


@app.get("/api/analysis")
def get_analysis(
    decision_from: Optional[str] = None,
    decision_to: Optional[str] = None,
    delivery_from: Optional[str] = None,
    delivery_to: Optional[str] = None,
    mode: str = "gate",
    cutoff: str = "09:20",
    horizon_hours: float = 24.0,
    selected_delivery_day: Optional[str] = None
):
    """
    Main quantitative analysis endpoint.
    Filters forecasts strictly by cutoff (no lookahead leakage), joins on exact startTime,
    and returns comprehensive metrics, breakdowns, and time series.
    """
    dl = get_loader()

    # Validate mode
    if mode not in ("gate", "horizon"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid mode '{mode}'. Must be 'gate' or 'horizon'."
        )

    # Validate cutoff format
    if not re.match(r"^(?:[01]\d|2[0-3]):[0-5]\d$", cutoff):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid cutoff format '{cutoff}'. Expected HH:MM (00:00 to 23:59)."
        )

    if horizon_hours < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"horizon_hours must be non-negative, got {horizon_hours}."
        )

    # Defaults: Jan 2026 decision window (D-1 from 2026-01-01 to 2026-01-31, so deliveries 2026-01-02 to 2026-02-01)
    d_from: Optional[date] = None
    d_to: Optional[date] = None
    del_from: Optional[date] = None
    del_to: Optional[date] = None

    try:
        if delivery_from and delivery_to:
            del_from = parse_date_str(delivery_from)
            del_to = parse_date_str(delivery_to)
            if del_from > del_to:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="delivery_from cannot be after delivery_to."
                )
        else:
            dec_from_str = decision_from or "2026-01-01"
            dec_to_str = decision_to or "2026-01-31"
            d_from = parse_date_str(dec_from_str)
            d_to = parse_date_str(dec_to_str)
            if d_from > d_to:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="decision_from cannot be after decision_to."
                )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid date format: {str(e)}"
        )

    # Perform evaluation
    df_eval = align_and_evaluate(
        actuals_df=dl.actuals,
        forecasts_df=dl.forecasts,
        mode=mode,
        cutoff=cutoff,
        horizon_hours=horizon_hours,
        decision_from=d_from,
        decision_to=d_to,
        delivery_from=del_from,
        delivery_to=del_to
    )

    if df_eval.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No matching data found for the selected date range and cutoff criteria."
        )

    # Summary metrics
    summary = calculate_metrics(df_eval)

    # Daily breakdown
    daily_metrics = compute_daily_breakdown(df_eval)

    # Hourly breakdown
    hourly_metrics = compute_hourly_breakdown(df_eval)

    # Available delivery days
    delivery_days = sorted(list(set(df_eval["delivery_date"].astype(str).unique())))

    # Selected delivery day time series
    target_day_str = selected_delivery_day
    if not target_day_str or target_day_str not in delivery_days:
        # Default to first delivery day in window (e.g. 2026-01-02)
        target_day_str = delivery_days[0]

    day_group = df_eval[df_eval["delivery_date"].astype(str) == target_day_str]
    selected_day_series = []
    for _, row in day_group.iterrows():
        selected_day_series.append({
            "startTime": row["startTime"].isoformat(),
            "publishTime": row["publishTime"].isoformat(),
            "actual": round(float(row["generation_act"]), 2),
            "forecast": round(float(row["generation_fc"]), 2),
            "error": round(float(row["error"]), 2),
            "lead_time_hours": round(float(row["lead_time_hours"]), 2),
            "hour": int(row["hour_of_day"])
        })

    day_summary = calculate_metrics(day_group)

    return {
        "status": "success",
        "parameters": {
            "mode": mode,
            "cutoff": cutoff,
            "horizon_hours": horizon_hours,
            "decision_from": str(d_from) if d_from else None,
            "decision_to": str(d_to) if d_to else None,
            "delivery_from": str(del_from) if del_from else None,
            "delivery_to": str(del_to) if del_to else None,
            "selected_delivery_day": target_day_str
        },
        "summary": summary,
        "daily_metrics": daily_metrics,
        "hourly_metrics": hourly_metrics,
        "delivery_days": delivery_days,
        "selected_day_data": {
            "date": target_day_str,
            "summary": day_summary,
            "series": selected_day_series
        }
    }


@app.get("/api/horizon")
def get_horizon_curve(
    decision_from: Optional[str] = "2026-01-01",
    decision_to: Optional[str] = "2026-01-31",
    delivery_from: Optional[str] = None,
    delivery_to: Optional[str] = None,
    max_horizon: int = 48
):
    """
    Computes accuracy degradation across forecast lead times h = 1..max_horizon hours.
    Shows the value lost by committing a day ahead vs intraday.
    """
    if max_horizon < 1 or max_horizon > 72:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"max_horizon must be between 1 and 72, got {max_horizon}."
        )

    dl = get_loader()

    d_from: Optional[date] = None
    d_to: Optional[date] = None
    del_from: Optional[date] = None
    del_to: Optional[date] = None

    try:
        if delivery_from and delivery_to:
            del_from = parse_date_str(delivery_from)
            del_to = parse_date_str(delivery_to)
        else:
            d_from = parse_date_str(decision_from) if decision_from else date(2026, 1, 1)
            d_to = parse_date_str(decision_to) if decision_to else date(2026, 1, 31)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid date format: {str(e)}"
        )

    curve = compute_lead_time_curve(
        actuals_df=dl.actuals,
        forecasts_df=dl.forecasts,
        decision_from=d_from,
        decision_to=d_to,
        delivery_from=del_from,
        delivery_to=del_to,
        max_horizon=max_horizon
    )

    return {
        "status": "success",
        "max_horizon": max_horizon,
        "curve": curve
    }
