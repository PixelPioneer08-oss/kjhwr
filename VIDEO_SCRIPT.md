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
> *"Good morning. Today I am presenting our Day-Ahead Wind Forecast Evaluation and Risk Buffer platform, tailored specifically for your GB wholesale power trading desk.*
>
> *Every day at Day D-1, your desk faces a high-stakes commercial decision: you must decide how much non-wind wholesale electricity—such as CCGT thermal power or interconnector imports—to procure in the day-ahead auction before the EPEX SPOT 09:20 gate closure.*
>
> *Because wind is weather-dependent, your procurement depends entirely on NESO's WINDFOR forecasts. But wind forecast errors are financially asymmetric:*
> * If wind is **under-forecasted**, you have surplus power. That surplus can be easily sold back or spilled at low cost.
> * But if wind is **over-forecasted**, you under-buy non-wind power day-ahead. During delivery, you face a physical power deficit and are exposed to the **System Buy Price (Cash-Out)** in the Balancing Mechanism—often spiking to hundreds of pounds per MWh.
>
> *Our platform solves this problem: it isolates the exact forecast available at your gate closure, quantifies the forecast error, and calculates a quantitative **P90 Risk Buffer** to protect your balance sheet."*

### [1:15 – 2:30] Dashboard Walkthrough & Live Example (Delivery Day Jan 2, 2026)
*(Action: Open browser at `http://localhost:3000` or the live Vercel link. Point to the controls bar and KPI cards).*

> *"Looking at the dashboard, all data is verified real historical data from Elexon BMRS for January 2026.*
>
> *Here on the control bar, our default cut-off is **09:20 London time**, matching the EPEX SPOT GB auction gate closure. You can also toggle to N2EX at 09:50, or inspect the outdated pre-Brexit 11:00 gate.*
>
> *Looking across January 2026, across 744 evaluated hourly points:*
> * Our Mean Absolute Error (MAE) is approximately **1,945 MW**, with a WAPE of **15%**.
> * Crucially, our Mean Error (Bias) is positive: wind was over-forecasted in **62%** of intervals, resulting in over **1.2 million MWh** of cumulative generation shortfall.*
>
> *Now let's examine a specific day: **January 2, 2026**."*
*(Action: Point to the Delivery Day Profile chart).*
>
> *"Here you see the hourly generation profile. The cyan line is actual wind generation, the dashed purple line is the day-ahead forecast, and the amber bars show the shortfall.*
> *At 09:20 on Jan 1, the latest forecast available was the **07:30 UTC** run. The 09:30 run was published 10 minutes after gate closure and was strictly excluded.*
> *Notice that across the morning ramp from 00:00 to 08:00, wind actuals were ~3,000 MW lower than predicted. Without a buffer, your desk would have suffered an immediate 3 GW deficit in the balancing mechanism."*

### [2:30 – 3:45] The P90 Risk Buffer & What-If Simulation
*(Action: Scroll down to the What-If Procurement Tool).*

> *"To protect against this deficit, our engine computes the **P90 Risk Buffer**: `max(0, P90 of Error)`.*
> *For January, this buffer is **3,650 MW**.*
> *What does this mean practically? If your desk discounts the headline wind forecast by 3,650 MW, you can be **90% confident** that actual wind generation will meet or exceed your procurement plan.*
>
> *Let's see this in our interactive **What-If Tool**.*
> *Suppose your consumer demand is **25,000 MW**.*
> *An unadjusted desk buys `Demand - Forecast` = **15,000 MW** of non-wind power. When wind falls short, they get hit with huge cashout penalties.*
> *Our risk-adjusted desk buys `Demand - (Forecast - Buffer)` = **18,650 MW**.*
> *Procuring this additional **3,650 MW** of thermal or flexible reserve in the competitive day-ahead auction eliminates your exposure to peak balancing mechanism penalties."*

### [3:45 – 4:55] Lead-Time Curve & Business Value Summary
*(Action: Click on the 'Lead-Time Curve' tab).*

> *"Finally, let's look at the **Lead-Time Curve** from 1 to 48 hours ahead.*
> *This chart answers a key commercial question: **What is the cost of deciding a day ahead?***
> *At an intraday horizon of 4 hours ahead, forecast MAE is only ~800 MW. By committing at the Day-Ahead gate closure (28 hours ahead), error increases by over **60%**.*
> *This quantifies the exact option value of holding back a portion of your flexible assets for intraday trading.*
>
> *In summary: this product gives your trading desk clear forecast visibility, zero look-ahead bias, and an actionable, mathematical risk buffer that saves hundreds of thousands of pounds in cashout penalties."*

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
*(Action: Open terminal and run `pytest backend/tests -v`).*

> *"Quality assurance is enforced through an automated Pytest suite in `backend/tests/`.*
> *Let's run it live right now."*
*(Point to the 16 passing tests).*
>
> *Notice our key tests:*
> * `test_excludes_forecasts_after_cutoff`: Injects synthetic forecasts before, at, and after 09:20; asserts that post-cutoff rows are strictly excluded.
> * `test_picks_latest_before_cutoff`: Proves that among eligible versions (05:30, 07:30), the newest is chosen.
> * `test_inclusive_cutoff`: Proves that a forecast timestamped exactly at 09:20:00 is accepted.
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
