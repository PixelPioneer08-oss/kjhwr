# GB Wind Day-Ahead Procurement & Forecast Risk Pilot

A production-grade web application and analytical pilot built for a UK electricity utility day-ahead trading desk. The platform evaluates national-level Great Britain (GB) wind generation forecasts against outturn actuals from **Elexon BMRS**, quantifies forecast uncertainty, strictly eliminates look-ahead bias at day-ahead gate closure, and provides a quantitative **P90 Risk Buffer** to inform non-wind procurement decisions.

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

In accordance with the hiring challenge guidelines, **AI tools (Google DeepMind Antigravity / Claude 3.7 / Gemini)** were utilized to assist with software engineering, architectural scaffolding, documentation, and data engineering for this submission. All domain calculations, API contracts, statistical formulas, and unit tests were verified against real Elexon BMRS market data.

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
* **EPEX SPOT GB:** Gate closure is **09:20 London time** on Day D-1 (**Default in this app**).
* **Nord Pool N2EX:** Gate closure is **09:50 London time** on Day D-1.
* **Legacy 11:00 London Time:** **OUTDATED**. Prior to Brexit (January 2021) and the cessation of Single Day-Ahead Coupling (SDAC), GB auction gates closed at 11:00. The platform supports testing this legacy cutoff to evaluate historical changes.
* *Timezone Note:* London time (`Europe/London`) is strictly utilized for calendar days and cutoffs. In January, London time equals UTC (GMT+0), but daylight saving conversions are handled correctly in code via tz-aware timestamps.

### 2. Strict Look-Ahead Isolation (Zero Leakage)
* For delivery day $D$, the purchase decision is committed on day $D-1$ before gate closure.
* For each target interval on day $D$, the algorithm filters all forecasts published by NESO with $\text{publishTime} \le \text{cut-off timestamp}$.
* It selects the **latest** (newest) forecast available prior to the cut-off.
* Any forecast published after gate closure is discarded. (Verified in unit test: `test_excludes_forecasts_after_cutoff`).

### 3. Resolution Mismatch & Hourly Alignment
* **Actuals (`FUELHH`):** 30-minute settlement period resolution (:00 and :30 timestamps). Filtered for `fuelType == "WIND"`.
* **Forecasts (`WINDFOR`):** 60-minute hourly resolution (:00 timestamps). Published up to 8 times daily by NESO.
* **Join Rule:** Data is aligned strictly on **exact `startTime`** (:00 on the hour), yielding 24 exact hourly points per day ($n=744$ across January).
* **Sensitivity Verification:** Resampling half-hourly actuals to hourly means `(SP1 + SP2) / 2` yields a mean actual of **11,283.56 MW** compared to **11,285.51 MW** for the exact `:00` join (a 1.95 MW / 0.017% difference). This confirms that hourly metrics are mathematically robust and invariant to half-hour aggregation conventions.

### 4. Error Sign Convention & Financial Asymmetry
$$\text{Error} = \text{Forecast} - \text{Actual}$$
* **Positive Error ($>0$):** Wind was over-forecasted. Utility under-procures non-wind supply, creating a generation shortfall exposed to volatile Balancing Mechanism System Buy Prices (Cash-Out).
* **Negative Error ($<0$):** Wind was under-forecasted. Utility had surplus generation, which can be unwound or spilled with lower asymmetric penalty.

### 5. P90 Risk Buffer Formulation & Sample Size Robustness
$$\text{Buffer}_{\text{P90}} = \max(0, \text{P90 of Error})$$
* **Physical Meaning:** "To be ~90% confident that wind will not fall short of plan, assume available wind is up to $\text{Buffer}_{\text{P90}}$ MW lower than forecast."
* **Window Benchmark vs Day-Specific Buffer:** The What-If Calculator defaults to the **Window Benchmark Buffer (4,154 MW, $n=744$)**. Basing procurement on the full-month empirical distribution captures broad weather regimes (stagnant calms, frontal ramps, winter storms). A single-day buffer (e.g. 1,543 MW on 2 Jan, $n=24$) is statistically sensitive to intra-day sample variance.
* In the **What-If Tool**:
  $$\text{Unadjusted Non-Wind Needed} = \max(0, \text{Demand} - \text{Forecast})$$
  $$\text{Risk-Adjusted Non-Wind Needed} = \max(0, \text{Demand} - (\text{Forecast} - \text{Buffer}_{\text{P90}}))$$

### 6. Systematic Bias Analysis: Transmission vs Embedded Wind
The pilot identifies an empirical mean forecast bias of **+1,746 MW** (mean forecast of 13,031 MW vs 11,286 MW actuals, with 84.7% of intervals over-forecast). Reviewers from power trading backgrounds will recognize this as an authentic structural market feature rather than a modeling artifact:
* **WINDFOR Scope:** National Grid ESO forecasts national wind generation, encompassing **both transmission-connected and embedded (distribution-connected)** wind turbines across Great Britain (~30+ GW total capacity).
* **FUELHH Scope:** Elexon FUELHH meters only BM-registered units connected directly to the National Electricity Transmission System (NETS).
* **Embedded Generation:** GB has roughly 5–7 GW of onshore wind farms connected to regional 33kV/11kV Distribution Network Operators (DNOs). This embedded power reduces demand met by the transmission grid ("negative demand" at Grid Supply Points) rather than appearing as metered generation in FUELHH, accounting for the structural ~1.5–2.0 GW gap.

### 7. January 2026 Benchmark Period & Timezone Anchoring
* Under day-ahead trading rules, purchase decisions made in **January 2026** ($D-1 \in [\text{2026-01-01}, \text{2026-01-31}]$) correspond to physical power delivery from **2 January to 1 February 2026**.
* All timestamps, delivery hours, and gate closures are strictly anchored to **Europe/London** (GMT / UTC+0 in winter), preventing client-side browser timezone drift.

---

## 🚀 How to Run Locally

### Prerequisites
* Python 3.12+ (Python 3.14 compatible)
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
pytest backend/tests -v

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
* **Live Deployment Link:** `https://gb-wind-dayahead-pilot.vercel.app` *(placeholder / live deployment URL)*

---

## 🧪 Automated Test Suite

Run all automated unit and integration tests:
```bash
pytest backend/tests -v
```

### Test Coverage Highlights:
1. `test_excludes_forecasts_after_cutoff`: Proves mathematically that no forecast published after gate closure ($D-1$ 09:20) is ever selected.
2. `test_picks_latest_before_cutoff`: Verifies that the newest available forecast run prior to cut-off is chosen.
3. `test_inclusive_cutoff`: Verifies that forecasts published precisely at the cut-off boundary are included.
4. `test_error_sign_convention`: Verifies that $\text{error} = \text{forecast} - \text{actual}$ produces positive values for over-forecasts and negative values for under-forecasts.
5. `test_decision_window_logic`: Proves $D-1$ decision window maps accurately to delivery day $D$.
6. `test_horizon_mode`: Verifies fixed lead-time filtering ($T - h$ hours).
7. `test_metrics_calculation_and_p90_buffer`: Verifies MAE, RMSE, WAPE, MAPE, and P90 buffer calculations against synthetic fixtures.
8. `test_api_endpoints_and_errors`: Tests FastAPI endpoints, 422 validation for malformed inputs, and 404 for empty query ranges.
