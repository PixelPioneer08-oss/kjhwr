"""
Fetch actual GB wind generation (FUELHH) and wind generation forecasts (WINDFOR)
from Elexon BMRS API and save to cached CSV files in data/.

API endpoints:
- Actuals: GET https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH/stream
- Forecasts: GET https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR/stream
"""

import os
import sys
import time
import json
import logging
from datetime import datetime, timedelta, timezone
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("fetch_data")

BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

def fetch_json_stream(endpoint: str, params: dict, max_retries: int = 5, backoff_base: float = 1.5):
    """Fetch JSON stream with retries and exponential backoff."""
    query = "&".join(f"{k}={v}" for k, v in params.items())
    url = f"{BASE_URL}/datasets/{endpoint}/stream?{query}"
    req = Request(url, headers={"User-Agent": "GB-Wind-DayAhead-Pilot/1.0", "Accept": "application/json"})
    
    for attempt in range(1, max_retries + 1):
        try:
            with urlopen(req, timeout=30) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode("utf-8"))
                    return data
                logger.warning(f"Unexpected status {response.status} for {url}")
        except (URLError, HTTPError, TimeoutError, Exception) as e:
            wait = backoff_base ** attempt
            logger.warning(f"Attempt {attempt}/{max_retries} failed for {url}: {e}. Retrying in {wait:.1f}s...")
            time.sleep(wait)
            
    logger.error(f"Failed to fetch {url} after {max_retries} attempts.")
    return []

def fetch_fuelhh_wind(start_dt: datetime, end_dt: datetime) -> pd.DataFrame:
    """
    Fetch actual FUELHH wind data in 1-day chunks.
    Filters fuelType == 'WIND' client-side and extracts startTime, publishTime, generation.
    """
    logger.info(f"Fetching FUELHH wind actuals from {start_dt.date()} to {end_dt.date()}...")
    all_rows = []
    curr = start_dt
    
    while curr < end_dt:
        nxt = min(curr + timedelta(days=1), end_dt)
        params = {
            "publishDateTimeFrom": curr.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "publishDateTimeTo": nxt.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        data = fetch_json_stream("FUELHH", params)
        wind_count = 0
        for item in data:
            if item.get("fuelType") == "WIND":
                all_rows.append({
                    "startTime": item.get("startTime"),
                    "publishTime": item.get("publishTime"),
                    "generation": float(item.get("generation", 0.0))
                })
                wind_count += 1
        logger.info(f"  FUELHH chunk {curr.date()} -> {nxt.date()}: {len(data)} total rows, {wind_count} WIND rows")
        curr = nxt
        time.sleep(0.2)  # respectful pacing
        
    df = pd.DataFrame(all_rows)
    if not df.empty:
        df["startTime"] = pd.to_datetime(df["startTime"])
        df["publishTime"] = pd.to_datetime(df["publishTime"])
        # Deduplicate on startTime keeping latest publishTime
        df = df.sort_values("publishTime").groupby("startTime").last().reset_index()
        df = df.sort_values("startTime").reset_index(drop=True)
    return df

def fetch_windfor(start_dt: datetime, end_dt: datetime) -> pd.DataFrame:
    """
    Fetch WINDFOR forecast data in 1-day chunks.
    Extracts startTime, publishTime, generation.
    """
    logger.info(f"Fetching WINDFOR forecasts published from {start_dt.date()} to {end_dt.date()}...")
    all_rows = []
    curr = start_dt
    
    while curr < end_dt:
        nxt = min(curr + timedelta(days=1), end_dt)
        params = {
            "publishDateTimeFrom": curr.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "publishDateTimeTo": nxt.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        data = fetch_json_stream("WINDFOR", params)
        for item in data:
            all_rows.append({
                "publishTime": item.get("publishTime"),
                "startTime": item.get("startTime"),
                "generation": float(item.get("generation", 0.0))
            })
        logger.info(f"  WINDFOR chunk {curr.date()} -> {nxt.date()}: {len(data)} rows")
        curr = nxt
        time.sleep(0.2)  # respectful pacing
        
    df = pd.DataFrame(all_rows)
    if not df.empty:
        df["publishTime"] = pd.to_datetime(df["publishTime"])
        df["startTime"] = pd.to_datetime(df["startTime"])
        # Deduplicate identical (publishTime, startTime)
        df = df.drop_duplicates(subset=["publishTime", "startTime"]).sort_values(["publishTime", "startTime"]).reset_index(drop=True)
    return df

def detect_resolutions(actuals_df: pd.DataFrame, forecasts_df: pd.DataFrame):
    """Detect resolutions and publish times from data."""
    actuals_res_min = None
    if len(actuals_df) > 1:
        diffs = actuals_df["startTime"].diff().dropna().dt.total_seconds() / 60
        actuals_res_min = int(diffs.mode()[0]) if not diffs.empty else None
        
    forecast_res_min = None
    if not forecasts_df.empty:
        # Check diffs within a single publishTime
        first_pub = forecasts_df["publishTime"].iloc[0]
        subset = forecasts_df[forecasts_df["publishTime"] == first_pub].sort_values("startTime")
        if len(subset) > 1:
            diffs = subset["startTime"].diff().dropna().dt.total_seconds() / 60
            forecast_res_min = int(diffs.mode()[0]) if not diffs.empty else None
            
    # Unique publish times of day (HH:MM UTC)
    pub_times_of_day = sorted(list(set(forecasts_df["publishTime"].dt.strftime("%H:%M").unique())))
    
    return {
        "actuals_resolution_minutes": actuals_res_min,
        "forecasts_resolution_minutes": forecast_res_min,
        "observed_publish_times_utc": pub_times_of_day,
        "total_actuals_rows": len(actuals_df),
        "total_forecasts_rows": len(forecasts_df),
        "actuals_start_time_min": str(actuals_df["startTime"].min()) if not actuals_df.empty else None,
        "actuals_start_time_max": str(actuals_df["startTime"].max()) if not actuals_df.empty else None,
        "forecasts_publish_min": str(forecasts_df["publishTime"].min()) if not forecasts_df.empty else None,
        "forecasts_publish_max": str(forecasts_df["publishTime"].max()) if not forecasts_df.empty else None,
        "forecasts_target_min": str(forecasts_df["startTime"].min()) if not forecasts_df.empty else None,
        "forecasts_target_max": str(forecasts_df["startTime"].max()) if not forecasts_df.empty else None,
        "fetched_at_utc": datetime.now(timezone.utc).isoformat(),
        "is_synthetic": False
    }

def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # Date window: Purchase decisions made in Jan 2026 (D-1 = 2026-01-01 to 2026-01-31)
    # Deliveries run 2026-01-02 to 2026-02-01.
    # To support full Jan delivery plus buffer:
    # Forecasts: 2025-12-30 to 2026-02-03
    # Actuals: 2025-12-31 to 2026-02-03
    start_dt = datetime(2025, 12, 30, 0, 0, tzinfo=timezone.utc)
    end_dt = datetime(2026, 2, 3, 0, 0, tzinfo=timezone.utc)
    
    logger.info(f"Target data directory: {DATA_DIR}")
    
    # 1. Fetch Actuals
    actuals_df = fetch_fuelhh_wind(start_dt, end_dt)
    actuals_csv = os.path.join(DATA_DIR, "actuals.csv")
    actuals_df.to_csv(actuals_csv, index=False)
    logger.info(f"Saved {len(actuals_df)} actual wind rows to {actuals_csv}")
    
    # 2. Fetch Forecasts
    forecasts_df = fetch_windfor(start_dt, end_dt)
    forecasts_csv = os.path.join(DATA_DIR, "forecasts.csv")
    forecasts_df.to_csv(forecasts_csv, index=False)
    logger.info(f"Saved {len(forecasts_df)} wind forecast rows to {forecasts_csv}")
    
    # 3. Detect and save metadata
    meta = detect_resolutions(actuals_df, forecasts_df)
    meta_path = os.path.join(DATA_DIR, "metadata.json")
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)
    logger.info(f"Metadata saved to {meta_path}:")
    logger.info(json.dumps(meta, indent=2))
    logger.info("Data fetch complete!")

if __name__ == "__main__":
    main()
