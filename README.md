# GB Wind Day-Ahead Procurement & Forecast Risk Pilot

A full-stack analytical web application and pilot built for a UK electricity utility day-ahead trading desk. The platform evaluates national-level Great Britain (GB) wind generation forecasts against outturn actuals from **Elexon BMRS**, quantifies forecast uncertainty, filters forecasts by publish timestamp relative to day-ahead gate closure, and provides a quantitative **P90 Risk Buffer** to inform non-wind procurement decisions.

---

## ⚡ Executive Summary & Scenario

* **The Client:** Day-ahead trading desk at a major UK energy utility.
* **The Commercial Problem:** The desk must decide on day **D-1** how much non-wind wholesale electricity (e.g. CCGT thermal, interconnectors, storage) to procure in day-ahead auctions (EPEX SPOT GB / Nord Pool N2EX) to satisfy consumer demand after accounting for weather-dependent wind generation.
* **The Asymmetric Risk:** 
  * **Over-forecasting wind (Forecast > Actual):** The utility under-procures non-wind power day-ahead. During delivery, it faces a physical generation shortfall exposed to volatile **System Buy Prices (Cash-Out imbalance settlement)** in the Elexon Balancing Mechanism.
  * **Under-forecasting wind (Forecast < Actual):** The utility over-procures non-wind power. Unwinding a surplus via system sell or spill carries lower financial exposure than facing a deficit.
* **The Solution:** This pilot calculates the **P90 Risk Buffer** (`max(0, P90 of Error)`), allowing the desk to haircut the day-ahead wind forecast so that physical wind generation meets or exceeds plan with ~90% confidence.

---

## 🤖 Explicit Statement on AI Tools Used

In accordance with the hiring challenge guidelines, **AI tools (Google DeepMind Antigravity / Claude 3.7 / Gemini)** were utilized to assist with software engineering, architectural scaffolding, documentation, and data engineering for this submission. Domain calculations, API contracts, statistical formulas, and unit tests were evaluated against real Elexon BMRS market data.

---

## 📁 Repository Structure

```text
├── api/
│   └── index.py               # Vercel serverless entrypoint for FastAPI
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── analysis.py        # Core analytical engine, cut-off filters, KPI metrics, horizon curves
│   │   └── main.py            # FastAPI application, route handlers, error handling, CORS
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_cutoff.py     # Unit tests: look-ahead leakage, cutoff rules, sign convention, P90
│   │   └── test_api.py        # Integration tests: HTTP responses, parameter validation, 422/404 handling
│   └── Dockerfile             # Production multi-stage container for backend service (Python 3.12)
├── data/
│   ├── actuals.csv            # Cached Elexon FUELHH actual wind generation (Jan 2026, 30m resolution)
│   ├── forecasts.csv          # Cached Elexon WINDFOR wind forecasts (Jan 2026, 60m resolution)
│   └── metadata.json          # Detected resolutions, observed publish times, provenance records
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx           # Navigation bar with Elexon data badge & modal trigger
│   │   │   ├── Controls.tsx         # Date range selector, EPEX/N2EX gate presets, horizon slider
│   │   │   ├── KpiGrid.tsx          # 10 key performance metric cards (MAE, Bias, P90 Buffer, etc.)
│   │   │   ├── DeliveryDayChart.tsx # Hourly forecast vs actual profile + lookahead audit table
│   │   │   ├── LeadTimeCurve.tsx    # 1h–48h forecast degradation curve vs gate closure timing
│   │   │   ├── DiurnalChart.tsx     # Diurnal 00:00–23:00 hourly error profile (morning & evening peaks)
│   │   │   ├── DailyTrendChart.tsx  # Daily accuracy and energy shortfall volume across the month
│   │   │   ├── WhatIfTool.tsx       # Interactive client demand & risk-adjusted procurement simulator
│   │   │   └── MethodologyModal.tsx # Comprehensive domain methodology reference modal
│   │   ├── App.tsx                  # Main dashboard layout and state coordination
│   │   ├── api.ts                   # Typed API client fetching from FastAPI
│   │   ├── types.ts                 # TypeScript interfaces for all data structures
│   │   ├── index.css                # Custom Bloomberg-style trading theme CSS
│   │   └── main.tsx                 # React DOM mount point
│   ├── Dockerfile                   # Multi-stage Docker build: Vite build -> Nginx alpine reverse proxy
│   ├── nginx.conf                   # Nginx reverse proxy configuration routing /api to backend
│   ├── package.json                 # Frontend dependencies (React 18, Vite, Recharts, Lucide)
│   └── tsconfig.json                # TypeScript compiler configuration
├── scripts/
│   └── fetch_data.py          # Data ingestion script from Elexon BMRS API with backoff & validation
├── docker-compose.yml         # Container orchestration for local full-stack execution
├── pytest.ini                 # Pytest configuration
├── requirements.txt           # Python backend dependencies (FastAPI, Pandas, NumPy, Pytest, Uvicorn)
├── vercel.json                # Vercel serverless deployment specification
└── README.md                  # Comprehensive project documentation and guides
```

---

## 🏛️ Domain Facts & Methodological Assumptions

### 1. Gate Closure Timings (London Time)
In Great Britain, wholesale power exchanges operate uncoupled day-ahead auctions with specific gate closure times:
* **EPEX SPOT GB:** Auction order book closes at **09:20 London time** on Day D-1 ([EPEX SPOT GB Day-Ahead Auction](https://www.epexspot.com/en/market-data?market_area=GB&trading_hub=GB&underlying_market=DayAhead)). (**Default in this app**).
* **Nord Pool N2EX:** Auction order book closes at **09:50 London time** on Day D-1 ([Nord Pool N2EX Day-Ahead Auction](https://www.nordpoolgroup.com/en/trading/Day-ahead-trading/Auction-markets/)).
* **11:00 Later Cut-off Sensitivity:** Provided as a configurable sensitivity benchmark to evaluate forecast error improvements if decision gates are delayed.
* *Timezone Note:* London time (`Europe/London`) is strictly utilized for calendar days and cutoffs. In January, London time equals UTC (GMT+0), but daylight saving conversions are handled correctly in code via tz-aware timestamps.

### 2. Cut-off Rule & Forecast Selection
* For delivery day $D$, the purchase decision is committed on day $D-1$ before gate closure.
* For each target interval on day $D$, the algorithm filters all forecasts published by NESO with $\text{publishTime} \le \text{cut-off timestamp}$.
* It selects the **latest** (newest) forecast available prior to the cut-off.
* Any forecast published after gate closure is discarded (tested in unit test: `test_excludes_forecasts_after_cutoff`).

### 3. Resolution Mismatch & Hourly Alignment
* **Actuals (`FUELHH`):** 30-minute settlement period resolution (:00 and :30 timestamps). Filtered for `fuelType == "WIND"`.
* **Forecasts (`WINDFOR`):** 60-minute hourly resolution (:00 timestamps). Exactly **9 discrete publish runs per day** are detected in the dataset (`02:30, 04:30, 07:30, 09:30, 11:30, 12:25, 15:30, 18:30, 22:30 UTC`).
* **Join Rule:** Data is aligned strictly on **exact `startTime`** (:00 on the hour), yielding 24 exact hourly points per day ($n=744$ across January).
* **Sensitivity Verification:** Resampling half-hourly actuals to hourly means `(SP1 + SP2) / 2` yields a mean actual of **11,283.56 MW** compared to **11,285.51 MW** for the exact `:00` join (a 1.95 MW / 0.017% difference). This confirms that hourly metrics are robust and invariant to half-hour aggregation conventions.

### 4. Forecast Error vs Financial Exposure (Scope Boundary)
$$\text{Error} = \text{Forecast} - \text{Actual}$$
* **Positive Error ($>0$):** Wind was over-forecasted. The utility under-procures non-wind generation day-ahead, creating a physical delivery shortfall that must be resolved in real-time balancing.
* **Negative Error ($<0$):** Wind was under-forecasted. The utility holds surplus physical power.
* **Physical Error vs Financial Exposure:** Forecast error quantifies **physical volume mismatch (in MW and MWh)**. It does not directly quantify financial cashout cost (£/MWh) or overall balance-sheet impact. In GB wholesale electricity markets, volume imbalances settle against the Balancing Mechanism System Buy Price (SBP) or System Sell Price (SSP). Because cashout price datasets are outside the scope of this pilot, **the P90 risk buffer is designed solely to inform volume procurement hedging decisions and mitigate physical delivery shortfalls—not as an automated guarantee of financial savings**.

### 5. P90 Risk Buffer Formulation & In-Sample Representation
$$\text{Buffer}_{\text{P90}} = \max(0, \text{P90 of Error})$$
* **Physical Meaning:** "To be ~90% confident that wind will not fall short of plan, assume available wind is up to $\text{Buffer}_{\text{P90}}$ MW lower than forecast."
* **Window Benchmark vs Day-Specific Buffer:** The What-If Calculator defaults to the **Window Benchmark Buffer (4,154 MW, $n=744$)**. Basing procurement on the full-month empirical distribution captures broad weather regimes (stagnant calms, frontal ramps, winter storms). A single-day buffer (e.g. 1,543 MW on 2 Jan, $n=24$) is statistically sensitive to intra-day sample variance.
* **Empirical Nature & In-Sample Caveat:** The 4,154 MW benchmark is an **empirical metric computed strictly from the January 2026 evaluation window**. It is **not automatically a guarantee of 90% coverage in future out-of-sample months**. The future coverage rate will naturally be influenced by seasonal wind shifts, changing synoptic weather regimes, and the overall representativeness of the historical sample.
* **Out-of-Sample Historical Cross-Validation (2-Fold):** To empirically evaluate buffer performance on unseen data, January was split into two independent periods:
  * **Fold 1 (Calibrate Jan 1–15, $N=360$):** Calibrated $P_{90}\text{ Buffer} = \mathbf{4,225\text{ MW}}$. When tested out-of-sample against forward delivery days in Jan 16–31 ($N=384$), it achieved **91.7% coverage**, satisfying the 90% confidence target.
  * **Fold 2 (Calibrate Jan 16–31, $N=384$):** Calibrated $P_{90}\text{ Buffer} = \mathbf{3,981\text{ MW}}$. When tested against Jan 1–15 ($N=360$), it achieved **87.2% coverage**, reflecting the higher stormy variance at the start of the month.
  * In live trading production, the risk buffer would be calibrated continuously on rolling historical trailing windows (e.g. 30–90 days) and backtested out-of-sample against live forward delivery days.
* **Gross Shortfall Volume vs Net Bias Volume:** The headline energy shortfall is **1,401.8 GWh** (gross sum across over-forecast intervals only). The net forecast error volume across all intervals is ~1,299.0 GWh.
* In the **What-If Tool**:
  $$\text{Unadjusted Non-Wind Needed} = \max(0, \text{Demand} - \text{Forecast})$$
  $$\text{Risk-Adjusted Non-Wind Needed} = \max(0, \text{Demand} - (\text{Forecast} - \text{Buffer}_{\text{P90}}))$$

### 6. Systematic Bias Analysis & Scope Considerations
The day-ahead forecast systematically over-predicted in January 2026, with an average bias of **+1,746 MW** and 84.7% of hourly intervals over-forecast. Several factors explain this finding:
* **Ruled out aggregation as the cause:** Resampling 30-minute actuals via hourly mean `(SP1+SP2)/2` yields 11,283.6 MW (within 0.017% of the exact :00 join of 11,285.5 MW), confirming that 30-minute to 60-minute aggregation convention does not cause the observed bias.
* **Likely Scope Distinction (Unverified with public BMRS data alone):** Elexon BMRS documentation for [FUELHH](https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH) indicates that it appears to cover metered generation from Balancing Mechanism Units connected directly to the National Electricity Transmission System (NETS). Conversely, National Grid ESO national wind forecasts ([WINDFOR](https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR)) model national-level wind output, which likely includes distributed / embedded wind generation connected to regional distribution networks (DNOs). Because embedded generation is not directly metered in FUELHH (acting as negative demand at Grid Supply Points), national forecasts would structurally exceed transmission-metered actuals. This is a likely candidate explanation based on GB market architecture, though unverified within the scope of this dataset.

### 7. Separating Systematic Bias from Meteorological Spread ($P_{50}$ vs $P_{90}$)
The full-window **P90 Buffer (4,154 MW)** decomposes into two distinct mathematical components:
* **Systematic Bias Component ($P_{50} = 1,582\text{ MW}$, ~38%):** The predictable median over-forecast across the month. The trading desk can eliminate this portion in advance via post-processing calibration or de-biasing filters.
* **Stochastic Weather Spread ($P_{90} - P_{50} = 2,572\text{ MW}$, ~62%):** The true residual meteorological uncertainty resulting from unpredictable frontal timing, barometric shifts, and spatial dispersion.

### 8. Known Limitation: Flat MW Buffer vs Dynamic Wind-Level Regimes
A flat MW buffer treats all wind days identically. In reality, forecast error variance scales with the expected level of wind. Crucially, bucketing is evaluated strictly on **forecast generation level** ($P_{\text{forecast}}$) known at decision time (rather than outturn actuals), ensuring zero look-ahead bias:
* **Low Wind Forecast (<8 GW):** Empirical $P_{90}$ Error = **1,887 MW** (a flat 4,154 MW buffer is overly conservative).
* **Medium Wind Forecast (8–16 GW):** Empirical $P_{90}$ Error = **3,606 MW**.
* **High Wind Forecast (>16 GW):** Empirical $P_{90}$ Error = **4,788 MW** (a flat 4,154 MW buffer leaves tail risk unhedged).
* **Proportional Relative Scaling:** Across January, empirical $P_{90}$ relative error is **30.3% of the forecast**. The What-If Tool includes a dynamic toggle for both Proportional and Bucketed Regime modes to address this limitation.

### 9. January 2026 Benchmark Period & Lead-Time Dynamics
* **Decision vs Delivery:** Purchase decisions made in **January 2026** ($D-1 \in [\text{2026-01-01}, \text{2026-01-31}]$) correspond to physical power delivery from **2 January to 1 February 2026** ($n=744$ hourly settlement intervals).
* **Mean Lead Time of 28.0 Hours:** For delivery day $D$, gate closure occurs at 09:20 London time on $D-1$. As noted in Section 3, NESO publishes WINDFOR forecasts at discrete times across the day; the **07:30 UTC run** is the latest available before the 09:20 gate closure. This produces an empirical **mean lead time of 28.0 hours** (ranging from 16.5h for hour 00:00 to 39.5h for hour 23:00).
* All timestamps and gate closures are strictly anchored to **Europe/London** (GMT / UTC+0 in winter).

### 10. Pilot Scope Boundaries & Explicit Non-Claims
In accordance with engineering integrity and wholesale power market reality, this pilot explicitly defines its analytical boundary:
1. **No Direct Financial Savings Guarantee:** Analyzes physical volume forecast mismatch (in MW and MWh). Because cash-out price datasets (System Buy Price / System Sell Price) are out of scope, the tool does not guarantee monetary £/€ balance-sheet savings.
2. **Imbalance Settlement Cost Modeling Excluded:** Dual cash-out exposure and Balancing Mechanism cashflow settlement are not modeled.
3. **Not an Optimal Procurement Optimizer:** Evaluates volume-hedged scenarios under static demand assumptions; it does not calculate multi-market dynamic dispatch optimization.
4. **Not a Statutory Reserve Requirement:** The P90 risk buffer provides an empirical volume haircut to de-risk commercial commitments, not a statutory or grid code operating reserve mandate.
5. **National Wind Scope Only:** Strictly limited to national-level Great Britain wind generation from Elexon BMRS (`FUELHH` actuals and `WINDFOR` forecasts); it makes no claims regarding embedded solar PV, hydro, or other renewable generation.

---

## 🚀 How to Run Locally

### Prerequisites
* Python 3.12+
* Node.js v18+ and npm

### 1. Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv

# Windows Powershell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run pytest unit and integration test suite
python -m pytest backend/tests -v

# Start FastAPI dev server on port 8000
python -m uvicorn backend.app.main:app --reload --port 8000
```
Backend API will be available at `http://localhost:8000`. Swagger API documentation is available at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server on port 5173
npm run dev
```
Open `http://localhost:5173` in your browser. The Vite development proxy forwards all `/api/*` calls directly to the FastAPI backend.

### 3. Data Refresh & Provenance (Optional)
The repository includes cached Elexon market data in `data/` (`actuals.csv`, `forecasts.csv`, `metadata.json`). To re-fetch or update raw data directly from the official Elexon BMRS API:
```bash
python scripts/fetch_data.py
```
This script queries the Elexon BMRS v1 streaming endpoints (`/datasets/FUELHH/stream` and `/datasets/WINDFOR/stream`) with exponential backoff, validates UTC timestamps, deduplicates records, and refreshes `data/metadata.json`.

---

## 🐳 Running with Docker & Docker Compose

To launch the full-stack containerized product (FastAPI backend + Nginx reverse proxy frontend):

```bash
# Build and run containers
docker-compose up --build
```

* **Frontend:** `http://localhost:3000` (Nginx serving static assets and proxying `/api` requests)
* **Backend:** `http://localhost:8000`
* **Healthcheck:** `curl http://localhost:8000/api/health`

To stop:
```bash
docker-compose down
```

---

## ☁️ Deployment on Vercel

The application is architected to deploy directly to **Vercel**:
* **Frontend:** Vite production bundle served via `@vercel/static-build` from `frontend/dist`.
* **Backend:** FastAPI serverless application executed via `api/index.py` with `@vercel/python`.
* **Data:** The cached `data/` directory (`actuals.csv`, `forecasts.csv`, `metadata.json`) is committed into the repository, ensuring zero cold-start Elexon API roundtrips.
* **Live Deployment Link:** `https://kjhwr-peach.vercel.app`

---

## 🧪 Automated Test Suite

Run all automated unit and integration tests:
```bash
python -m pytest backend/tests -v
```

### Test Coverage Highlights (18 Tests):
1. `test_excludes_forecasts_after_cutoff`: Verifies that no forecast published after gate closure ($D-1$ 09:20) is ever selected.
2. `test_picks_latest_before_cutoff`: Verifies that the newest available forecast run prior to cut-off is chosen.
3. `test_inclusive_cutoff`: Verifies that forecasts published precisely at the cut-off boundary are included.
4. `test_missing_forecast_interval_handled_cleanly`: Verifies that missing forecast intervals do not cause exceptions, null errors, or fabricated synthetic points.
5. `test_timezone_conversion_london_to_utc`: Verifies that civil cutoffs specified in `Europe/London` time are converted accurately to UTC and properly filter forecasts.
6. `test_error_sign_convention`: Verifies that $\text{error} = \text{forecast} - \text{actual}$ produces positive values for over-forecasts and negative values for under-forecasts.
7. `test_decision_window_logic`: Verifies that $D-1$ decision windows map to delivery day $D$ ($D-1 + 1$ day).
8. `test_horizon_mode`: Verifies fixed lead-time filtering ($T - h$ hours).
9. `test_metrics_calculation_and_p90_buffer`: Verifies MAE, RMSE, WAPE, MAPE, and P90 buffer calculations against synthetic fixtures.
10. `test_api_endpoints_and_errors`: Tests FastAPI endpoints, 422 validation for malformed inputs, and 404 for empty query ranges.
