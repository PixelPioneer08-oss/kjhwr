"""
Unit tests for cut-off logic, forecast selection, and error sign conventions.
"""

from datetime import datetime, date, timezone, timedelta
import pandas as pd
import pytest

from backend.app.analysis import (
    align_and_evaluate,
    calculate_metrics,
    get_delivery_days_for_decision_window,
    TZ_LONDON
)


def create_synthetic_data():
    """Helper to create minimal clean actuals and forecasts DataFrames."""
    target_dt = pd.Timestamp("2026-01-02 12:00:00+00:00")
    
    actuals = pd.DataFrame([
        {"startTime": target_dt, "generation": 10000.0}
    ])
    
    forecasts = pd.DataFrame([
        # Published D-1 at 05:30 UTC
        {"startTime": target_dt, "publishTime": pd.Timestamp("2026-01-01 05:30:00+00:00"), "generation": 11000.0},
        # Published D-1 at 07:30 UTC
        {"startTime": target_dt, "publishTime": pd.Timestamp("2026-01-01 07:30:00+00:00"), "generation": 12000.0},
        # Published D-1 at 09:20 UTC (exact cut-off)
        {"startTime": target_dt, "publishTime": pd.Timestamp("2026-01-01 09:20:00+00:00"), "generation": 12500.0},
        # Published D-1 at 09:30 UTC (after EPEX cut-off)
        {"startTime": target_dt, "publishTime": pd.Timestamp("2026-01-01 09:30:00+00:00"), "generation": 13000.0},
        # Published Day D at 02:30 UTC (intraday, way after cut-off)
        {"startTime": target_dt, "publishTime": pd.Timestamp("2026-01-02 02:30:00+00:00"), "generation": 10500.0},
    ])
    return actuals, forecasts


def test_excludes_forecasts_after_cutoff():
    """Prove that no forecast published after the cut-off is ever used."""
    actuals, forecasts = create_synthetic_data()
    
    # EPEX cut-off is 09:20. The 09:30 and 02:30 forecasts MUST be excluded.
    result = align_and_evaluate(
        actuals_df=actuals,
        forecasts_df=forecasts,
        mode="gate",
        cutoff="09:20",
        decision_from=date(2026, 1, 1),
        decision_to=date(2026, 1, 1)
    )
    
    assert len(result) == 1
    selected = result.iloc[0]
    
    # Must not exceed cut-off timestamp 2026-01-01 09:20:00 UTC
    assert selected["publishTime"] <= pd.Timestamp("2026-01-01 09:20:00+00:00")
    # Verify neither 09:30 nor intraday forecast was picked
    assert selected["generation_fc"] != 13000.0
    assert selected["generation_fc"] != 10500.0


def test_picks_latest_before_cutoff():
    """Verify it picks the newest available forecast prior to cut-off."""
    actuals, forecasts = create_synthetic_data()
    
    # Cutoff at 08:00 (before the 09:20 forecast)
    result = align_and_evaluate(
        actuals_df=actuals,
        forecasts_df=forecasts,
        mode="gate",
        cutoff="08:00",
        decision_from=date(2026, 1, 1),
        decision_to=date(2026, 1, 1)
    )
    
    assert len(result) == 1
    selected = result.iloc[0]
    # Between 05:30 (11000) and 07:30 (12000), latest is 07:30
    assert selected["publishTime"] == pd.Timestamp("2026-01-01 07:30:00+00:00")
    assert selected["generation_fc"] == 12000.0


def test_inclusive_cutoff():
    """Verify inclusive cut-off: forecast published exactly at cut-off is accepted."""
    actuals, forecasts = create_synthetic_data()
    
    # Cut-off 09:20: forecast published at 09:20:00 must be eligible
    result = align_and_evaluate(
        actuals_df=actuals,
        forecasts_df=forecasts,
        mode="gate",
        cutoff="09:20",
        decision_from=date(2026, 1, 1),
        decision_to=date(2026, 1, 1)
    )
    
    assert len(result) == 1
    selected = result.iloc[0]
    assert selected["publishTime"] == pd.Timestamp("2026-01-01 09:20:00+00:00")
    assert selected["generation_fc"] == 12500.0


def test_error_sign_convention():
    """
    Verify error sign convention: error = forecast - actual.
    Positive = over-forecast (shortfall).
    Negative = under-forecast (surplus).
    """
    target_dt1 = pd.Timestamp("2026-01-02 10:00:00+00:00")
    target_dt2 = pd.Timestamp("2026-01-02 11:00:00+00:00")
    
    actuals = pd.DataFrame([
        {"startTime": target_dt1, "generation": 10000.0},  # Forecast 14000 -> Error +4000 (over-forecast)
        {"startTime": target_dt2, "generation": 15000.0},  # Forecast 12000 -> Error -3000 (under-forecast)
    ])
    
    forecasts = pd.DataFrame([
        {"startTime": target_dt1, "publishTime": pd.Timestamp("2026-01-01 07:30:00+00:00"), "generation": 14000.0},
        {"startTime": target_dt2, "publishTime": pd.Timestamp("2026-01-01 07:30:00+00:00"), "generation": 12000.0},
    ])
    
    result = align_and_evaluate(
        actuals_df=actuals,
        forecasts_df=forecasts,
        mode="gate",
        cutoff="09:20",
        decision_from=date(2026, 1, 1),
        decision_to=date(2026, 1, 1)
    )
    
    row1 = result[result["startTime"] == target_dt1].iloc[0]
    row2 = result[result["startTime"] == target_dt2].iloc[0]
    
    assert row1["error"] == 4000.0  # Positive error
    assert row2["error"] == -3000.0 # Negative error


def test_decision_window_logic():
    """Verify decision day D-1 maps to delivery day D."""
    deliv_days = get_delivery_days_for_decision_window(date(2026, 1, 1), date(2026, 1, 3))
    assert deliv_days == [date(2026, 1, 2), date(2026, 1, 3), date(2026, 1, 4)]


def test_horizon_mode():
    """Verify fixed lead-time mode (publishTime <= startTime - horizon)."""
    target_dt = pd.Timestamp("2026-01-02 12:00:00+00:00")
    
    actuals = pd.DataFrame([{"startTime": target_dt, "generation": 8000.0}])
    forecasts = pd.DataFrame([
        # 5 hours before target (07:00)
        {"startTime": target_dt, "publishTime": pd.Timestamp("2026-01-02 07:00:00+00:00"), "generation": 8200.0},
        # 4 hours before target (08:00)
        {"startTime": target_dt, "publishTime": pd.Timestamp("2026-01-02 08:00:00+00:00"), "generation": 8100.0},
        # 3 hours before target (09:00 - too late for 4h horizon)
        {"startTime": target_dt, "publishTime": pd.Timestamp("2026-01-02 09:00:00+00:00"), "generation": 8050.0},
    ])
    
    result = align_and_evaluate(
        actuals_df=actuals,
        forecasts_df=forecasts,
        mode="horizon",
        horizon_hours=4.0,
        delivery_from=date(2026, 1, 2),
        delivery_to=date(2026, 1, 2)
    )
    
    assert len(result) == 1
    selected = result.iloc[0]
    # Latest published at or before 12:00 - 4h = 08:00 is 08:00
    assert selected["publishTime"] == pd.Timestamp("2026-01-02 08:00:00+00:00")
    assert selected["generation_fc"] == 8100.0


def test_metrics_calculation_and_p90_buffer():
    """Verify quantitative metrics, WAPE, MAPE, and P90 risk buffer."""
    df = pd.DataFrame({
        "error": [100.0, 200.0, -50.0, 400.0],
        "generation_act": [1000.0, 2000.0, 500.0, 1500.0],
        "generation_fc": [1100.0, 2200.0, 450.0, 1900.0],
        "lead_time_hours": [24.0, 24.0, 24.0, 24.0]
    })
    
    m = calculate_metrics(df, interval_hours=1.0)
    
    # MAE = (|100| + |200| + |-50| + |400|) / 4 = 750 / 4 = 187.5
    assert m["mae"] == 187.5
    # Bias = (100 + 200 - 50 + 400) / 4 = 650 / 4 = 162.5
    assert m["bias"] == 162.5
    # WAPE = sum(|e|) / sum(actual) * 100 = 750 / 5000 * 100 = 15.0%
    assert m["wape"] == 15.0
    # Over-forecast share: 3 out of 4 > 0 = 75%
    assert m["share_overforecast"] == 75.0
    # Over-forecast MWh: (100 + 200 + 0 + 400) * 1.0 = 700.0 MWh
    assert m["total_overforecast_mwh"] == 700.0
    # buffer_p90 is max(0, P90)
    assert m["buffer_p90"] > 0


def test_missing_forecast_interval_handled_cleanly():
    """Verify that missing forecast intervals do not cause exceptions or invented values."""
    target_dt1 = pd.Timestamp("2026-01-02 12:00:00+00:00")
    target_dt2 = pd.Timestamp("2026-01-02 13:00:00+00:00")
    
    # Actuals exist for both 12:00 and 13:00
    actuals = pd.DataFrame([
        {"startTime": target_dt1, "generation": 10000.0},
        {"startTime": target_dt2, "generation": 11000.0},
    ])
    
    # Forecast only exists for 12:00; 13:00 is missing
    forecasts = pd.DataFrame([
        {"startTime": target_dt1, "publishTime": pd.Timestamp("2026-01-01 07:30:00+00:00"), "generation": 10500.0},
    ])
    
    result = align_and_evaluate(
        actuals_df=actuals,
        forecasts_df=forecasts,
        mode="gate",
        cutoff="09:20",
        decision_from=date(2026, 1, 1),
        decision_to=date(2026, 1, 1)
    )
    
    # Strictly matched intervals: exactly 1 interval evaluated, no synthetic interpolation
    assert len(result) == 1
    assert result.iloc[0]["startTime"] == target_dt1
    assert result.iloc[0]["generation_act"] == 10000.0
    assert result.iloc[0]["generation_fc"] == 10500.0


def test_timezone_conversion_london_to_utc():
    """Verify that Europe/London civil cutoffs map accurately to UTC."""
    # In January, Europe/London is UTC (GMT)
    target_dt = pd.Timestamp("2026-01-02 15:00:00+00:00")
    actuals = pd.DataFrame([{"startTime": target_dt, "generation": 12000.0}])
    
    # Two forecasts: one at 09:15 UTC, one at 09:25 UTC
    forecasts = pd.DataFrame([
        {"startTime": target_dt, "publishTime": pd.Timestamp("2026-01-01 09:15:00+00:00"), "generation": 12200.0},
        {"startTime": target_dt, "publishTime": pd.Timestamp("2026-01-01 09:25:00+00:00"), "generation": 12800.0},
    ])
    
    result = align_and_evaluate(
        actuals_df=actuals,
        forecasts_df=forecasts,
        mode="gate",
        cutoff="09:20",
        decision_from=date(2026, 1, 1),
        decision_to=date(2026, 1, 1)
    )
    
    assert len(result) == 1
    assert result.iloc[0]["publishTime"] == pd.Timestamp("2026-01-01 09:15:00+00:00")
    assert result.iloc[0]["generation_fc"] == 12200.0

