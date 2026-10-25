"""
Direct endpoint tests for FastAPI handlers, validation, and error responses.
"""

import pytest
from fastapi import HTTPException

from backend.app.main import health, get_metadata, get_analysis, get_horizon_curve


def test_health_endpoint():
    res = health()
    assert res["status"] == "ok"
    assert "timestamp" in res
    assert "GB Wind" in res["service"]


def test_metadata_endpoint():
    meta = get_metadata()
    assert "data_sources" in meta
    assert "actuals_resolution_minutes" in meta
    assert "forecasts_resolution_minutes" in meta
    assert meta["actuals_resolution_minutes"] == 30
    assert meta["forecasts_resolution_minutes"] == 60
    assert "EPEX_GB" in meta["gate_closures_info"]


def test_analysis_endpoint_valid_range():
    res = get_analysis(
        decision_from="2026-01-01",
        decision_to="2026-01-03",
        mode="gate",
        cutoff="09:20"
    )
    assert res["status"] == "success"
    assert "summary" in res
    summary = res["summary"]
    assert summary["n"] > 0
    assert summary["mae"] > 0
    assert "buffer_p90" in summary
    assert "daily_metrics" in res
    assert len(res["daily_metrics"]) == 3
    assert "selected_day_data" in res
    assert len(res["selected_day_data"]["series"]) == 24


def test_analysis_endpoint_horizon_mode():
    res = get_analysis(
        delivery_from="2026-01-02",
        delivery_to="2026-01-03",
        mode="horizon",
        horizon_hours=12.0
    )
    assert res["status"] == "success"
    assert res["summary"]["n"] > 0
    assert res["parameters"]["mode"] == "horizon"
    assert res["parameters"]["horizon_hours"] == 12.0


def test_analysis_invalid_cutoff():
    with pytest.raises(HTTPException) as exc:
        get_analysis(cutoff="25:99")
    assert exc.value.status_code == 422


def test_analysis_negative_horizon():
    with pytest.raises(HTTPException) as exc:
        get_analysis(mode="horizon", horizon_hours=-5.0)
    assert exc.value.status_code == 422


def test_analysis_inverted_dates():
    with pytest.raises(HTTPException) as exc:
        get_analysis(decision_from="2026-01-10", decision_to="2026-01-05")
    assert exc.value.status_code == 422


def test_analysis_out_of_range():
    with pytest.raises(HTTPException) as exc:
        get_analysis(decision_from="2035-01-01", decision_to="2035-01-05")
    assert exc.value.status_code == 404


def test_horizon_curve_endpoint():
    res = get_horizon_curve(
        decision_from="2026-01-01",
        decision_to="2026-01-03",
        max_horizon=6
    )
    assert res["status"] == "success"
    assert len(res["curve"]) == 6
    assert res["curve"][0]["horizon_hours"] == 1
    assert res["curve"][0]["mae"] > 0
