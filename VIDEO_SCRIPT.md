# Video Presentation & Walkthrough Guide (Max 10 Minutes)

This script provides word-for-word talking points, screen actions, and visual cues to record the required 10-minute unlisted YouTube video submission.

---

## ⏱️ Video Breakdown

* **Part 1 (0:00 – 4:55): Client Pitch & Commercial Value** *(To the Trading Desk Lead)*
* **Part 2 (4:55 – 9:50): Technical Architecture & Code Review** *(To the Tech Lead)*

---

## 🎬 Part 1: Client Pitch (Max 5 Minutes)
**Audience:** Commercial Trading Desk / Head of Power Procurement  
**Goal:** Impress the client with how this tool de-risks day-ahead power purchasing.

### [0:00 – 1:15] The Commercial Problem & Context
> *"Good morning. Today I am presenting our Day-Ahead Wind Forecast Evaluation and Risk Buffer platform, tailored specifically for your GB wholesale power trading desk.
>
> *Every day at Day D-1, your desk faces a critical commercial decision: you must decide how much non-wind wholesale electricity—such as CCGT thermal power or interconnector imports—to procure in the day-ahead auction before gate closure (such as EPEX SPOT at 09:20 London time).
>
> *Because wind is weather-dependent, your procurement decisions rely on National Grid ESO's WINDFOR forecasts. When wind is over-forecasted, you under-buy non-wind power day-ahead and face physical delivery shortfalls in the Balancing Mechanism.
>
> *It's important to clarify upfront: this platform analyzes physical volume risk in megawatts and megawatt-hours. Because imbalance settlement prices are outside the scope of our dataset, the risk buffer is designed to inform volume procurement and manage volume exposure—it is not an automated guarantee of financial savings.
>
> *Our engine isolates the exact forecast available at decision time, quantifies forecast uncertainty, and calculates an empirical P90 Risk Buffer to inform your day-ahead position."*

### [1:15 – 2:30] Dashboard Walkthrough & Live Example (Delivery Day Jan 2, 2026)
*(Action: Open browser at `https://kjhwr-peach.vercel.app`. Point to the controls bar and KPI cards).*

> *"Looking at the dashboard, all data is verified real historical data from Elexon BMRS for January 2026.
>
> *On the control bar, our default cut-off is **09:20 London time**, matching the EPEX SPOT GB auction order book closure. You can also select Nord Pool N2EX at 09:50, or evaluate an 11:00 Later Cut-off Sensitivity.
>
> *Looking across January 2026, over 744 evaluated hourly delivery intervals:
> * Our Mean Absolute Error (MAE) is **2,022 MW**, with a WAPE of **17.9%**.
> * Crucially, our Mean Error (Bias) is positive (+1,746 MW): wind was over-forecasted in **84.7%** of intervals, representing **1.40 million MWh** of gross generation shortfall.
>
> *Now let's examine a specific day: **January 2, 2026**."*
*(Action: Point to the Delivery Day Profile chart and the new Forecast Lineage Banner).*
>
> *"Notice the dedicated **Forecast Availability & Lineage Banner** right above the chart: it unmistakably states the Delivery Day (2 Jan), the Decision Gate (D-1 09:20 London), the selected historical forecast run (07:30 UTC Run), the lead time range (16.5h–39.5h, mean 28.0h), and verifies 24/24 valid intervals with zero missing observations. This ensures the trading desk never confuses the reconstructed historical operational forecast with today's real-time forecast.
>
> *Notice that every single hour on this day was over-forecasted—actual wind generation was ~15,000 MW against an 18,500 MW forecast, producing an MAE equal to its bias of 3,070 MW.
> *Across the entire month of January, the forecast displays a **+1,746 MW systematic over-prediction**.
> *Why does this gap exist? We investigated whether this was a data processing artifact. By resampling 30-minute actuals via an hourly mean `(SP1+SP2)/2`, we get 11,283.6 MW—within 0.017% of our exact :00 join (11,285.5 MW). This rules out aggregation as the cause.
> *Instead, our leading hypothesis relates to physical scope: Elexon BMRS documentation indicates FUELHH appears to cover transmission-connected Balancing Mechanism units, whereas WINDFOR models national wind generation, which likely includes embedded distribution wind. We treat this as a plausible candidate hypothesis requiring further verification with private network data, and it's a great discussion topic on data scope."*

### [2:30 – 3:45] The P90 Risk Buffer, Bias Decomposition & Wind Regimes
*(Action: Scroll down to the What-If Procurement Tool).*

> *"To protect against volume shortfalls, our engine computes the **P90 Risk Buffer**: `max(0, P90 of Error)`.
> *For the January benchmark, this whole-window buffer is **4,154 MW** across the 744 hourly intervals.
>
> *We must be precise about what this number means: it is an **empirical in-sample benchmark** calculated over January 2026. It does not automatically guarantee 90% coverage for future months, because future weather regimes and seasonal shifts will alter the empirical tail.
>
> *To test temporal sensitivity, we evaluated two time-series partitions:
> *First, a genuine **Forward Chronological Holdout**: calibrating on earlier data (Jan 1–15, 4,225 MW) and evaluating forward out-of-sample on later data (Jan 16–31), achieving **91.7% out-of-sample coverage**, which exceeds our 90% target.
> *Second, a **Retrospective Regime Sensitivity Check**: taking a buffer fitted on late January (3,981 MW) and seeing how it would have handled early January storms, yielding **87.2% coverage**.
> *While the 91.7% forward holdout is encouraging, one half-month holdout is too small to guarantee future coverage. In live trading, a continuous rolling-origin calibration across 30–90 days of trailing data would be implemented.
>
> *Crucially, we separate the **systematic bias from the spread**:
> *Our P50 median error is **1,582 MW** (~38% of the buffer). That is the predictable bias that a desk could de-bias in advance via calibration. The remaining **2,572 MW** (P90 − P50) represents stochastic meteorological spread.
>
> *Furthermore, a flat MW buffer ignores the expected level of wind. That is why our tool provides **Proportional Scaling (30.3% of forecast)** and **Wind Regimes** (<8 GW: 1,887 MW buffer; >16 GW: 4,788 MW buffer). Crucially, these regimes are bucketed strictly on the **forecast level** known at decision time, preventing any look-ahead leakage.
>
> *In the What-If calculator, if customer demand is **25,000 MW** and wind forecast is 13,000 MW, an unadjusted desk buys 12,000 MW of non-wind power. If wind under-delivers, they face an unhedged volume shortfall. By incorporating the P90 buffer, the desk procures a prudent reserve volume to de-risk delivery."*

### [3:45 – 4:55] Lead-Time Curve, Scope Boundaries & Business Value Summary
*(Action: Click on the 'Lead-Time Curve' tab, then scroll down to the Scope Boundaries card).*

> *"Next, let's look at the **Lead-Time Curve** from 1 to 48 hours ahead.
> *This chart answers a key commercial question: **What is the operational cost of deciding day-ahead?**
> *At an intraday horizon of 4 hours ahead, forecast MAE is only ~800 MW. At the Day-Ahead gate closure (mean lead time of 28.0 hours), error increases substantially to ~2,022 MW.
> *This quantifies the option value of retaining flexible procurement capacity for intraday balancing.
>
> *Finally, we are explicit about the boundaries of our data:
> *1. We do not claim financial cash savings, as cash-out prices are out of scope.
> *2. Imbalance settlement costs in the Balancing Mechanism are not modeled.
> *3. This is not an optimal multi-market economic dispatch optimizer.
> *4. The buffer is not a statutory grid code reserve mandate.
> *5. The analysis is strictly scoped to Elexon national wind data.
>
> *In summary: this platform provides rigorous forecast filtering, transparent empirical risk buffers, and clear volume hedging insights for the day-ahead trading desk."*

---

## 🛠️ Part 2: Technical Architecture & Code Review (Max 5 Minutes)
**Audience:** Tech Lead & Software Engineering Evaluation Team  
**Goal:** Demonstrate clean software architecture, rigorous methodology, testing, and production deployment.

### [4:55 – 6:15] Architecture & Repository Layout
*(Action: Open VS Code showing project files and `docker-compose.yml`).*

> *"Welcome to Part 2. I'm now walking through the software architecture, engineering decisions, and implementation.*
>
> *The system is organized into a clean decoupled monorepo:*
> 1. **Data Ingestion (`scripts/fetch_data.py`):** Directly fetches from Elexon BMRS API v1 (`FUELHH` actuals stream and `WINDFOR` forecast stream). It implements client-side filtering for `fuelType == 'WIND'`, chunking in 1-day windows, exponential backoff, and deduplication. Data is cached to `/data` so that requests never hammer the Elexon API.
> 2. **Backend Engine (`backend/app/{analysis.py, main.py}`):** Python 3.12 / 3.14 with FastAPI, Pandas, and NumPy. Exposes `/api/health`, `/api/meta`, `/api/analysis`, and `/api/horizon`.
> 3. **Frontend (`frontend/`):** React 18, Vite, TypeScript, and Recharts, styled with a high-contrast Bloomberg-inspired design system.
> 4. **Infrastructure & Deployments:** Containerized with Docker and `docker-compose.yml`, with automated reverse-proxying via Nginx, and configured for serverless deployment on Vercel via `api/index.py` and `vercel.json`."*

### [6:15 – 7:30] Look-Ahead Isolation Logic & Resolution Handling
*(Action: Open `backend/app/analysis.py` in the editor).*

> *"Let's look at the two most critical domain requirements:*
>
> **1. Look-Ahead Cut-Off Logic:**
> *For delivery day $D$, the purchase decision is made on $D-1$ at gate closure (default 09:20 London time).*
> *In `align_and_evaluate()`, we localize the cutoff in `Europe/London` and convert to UTC.*
> *For every target delivery interval, we filter forecasts where `publishTime <= cutoff_utc`. We then group by `startTime` and take the row with the maximum `publishTime`.*
> *This guarantees that no forecast published at 09:30 or during intraday delivery is ever leaked into day-ahead metrics.*
>
> **2. Resolution Mismatch Handling:**
> *Actuals from Elexon `FUELHH` are **30-minute** resolution.*
> *Forecasts from `WINDFOR` are **60-minute** resolution.*
> *Rather than assuming resolutions, our `DataLoader` detects the mode resolution directly from timestamp diffs.*
> *We join strictly on exact `startTime` (:00 on the hour). We deliberately do not interpolate or fabricate half-hourly forecasts, and we report the exact sample size ($n$) of matched points."*

### [7:30 – 8:40] Automated Test Suite Execution
*(Action: Open terminal and run `python -m pytest backend/tests -v`).*

> *"Quality assurance is enforced through an automated Pytest suite in `backend/tests/`.*
> *Let's run it live right now."*
*(Point to the 20 passing tests).*
>
> *Notice our key tests:*
> * `test_excludes_forecasts_after_cutoff`: Injects synthetic forecasts before, at, and after 09:20; asserts that post-cutoff rows are strictly excluded.
> * `test_picks_latest_before_cutoff`: Verifies that among eligible versions (05:30, 07:30), the newest is chosen.
> * `test_inclusive_cutoff`: Verifies that a forecast timestamped exactly at 09:20:00 is accepted.
> * `test_missing_forecast_interval_handled_cleanly`: Verifies that missing intervals do not trigger exceptions or synthetic data creation.
> * `test_timezone_conversion_london_to_utc`: Confirms Europe/London civil cutoffs map cleanly to UTC timestamps.
> * `test_forward_holdout_and_retrospective_sensitivity_validation`: Verifies the 91.7% forward holdout and 87.2% retrospective check programmatically.
> * `test_full_january_744_hourly_completeness`: Mathematically confirms all 744 hourly settlement intervals are matched across January with zero missing intervals.
> * `test_error_sign_convention`: Verifies that `Forecast - Actual` produces positive values for over-forecasts.
> * `test_decision_window_logic` & `test_horizon_mode`: Verifies D-1 mapping and fixed lead times.
> * `test_api_endpoints_and_errors`: Verifies input validation, 422 for malformed cutoffs, and 404 for missing ranges."*

### [8:40 – 9:50] Deployment & Limitations
*(Action: Show `docker-compose.yml` and `frontend/nginx.conf`).*

> *"For deployment, we provide two pathways:*
> 1. **Docker Compose:** Launches `backend` (uvicorn) and `frontend` (Nginx reverse proxy) with a single command: `docker-compose up --build`. The Nginx configuration proxies `/api` to the backend container.
> 2. **Vercel Serverless:** Deploys via `api/index.py` with committed CSV data files, ensuring sub-50ms cold starts without calling external APIs.
>
> **Limitations & Future Extensions:**
> * *National vs Zonal:* Elexon WINDFOR is national-level; future iterations could incorporate regional DNO constraints and Scottish interconnector bottlenecks.
> * *Curtailment:* In high wind events, NESO bids wind off through the Balancing Mechanism (curtailment). Separating curtailment bids from unconstrained forecast error would further sharpen accuracy.
>
> *Thank you for your time. The repository and deployment are fully open-source and ready for review."*
