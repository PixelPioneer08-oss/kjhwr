import React from 'react';
import { X, ShieldAlert, Clock, Scale, Layers, HelpCircle } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        animation: 'fadeSlideIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          maxWidth: 720, width: '100%',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
          padding: '28px 32px',
          display: 'flex', flexDirection: 'column', gap: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingBottom: 16, borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--cyan-dim)', border: '1px solid rgba(6,182,212,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <HelpCircle size={20} color="var(--cyan)" />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
                Methodology, Domain Logic &amp; Market Assumptions
              </h2>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                Technical reference for UK Day-Ahead Electricity Trading &amp; Balancing Mechanism
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: 6, borderRadius: 8, cursor: 'pointer', border: 'none',
              background: 'transparent', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-elevated)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>

          {/* Section 1: Gate Closure */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Clock size={15} color="var(--cyan)" />
              1. Day-Ahead Gate Closure Timings (London Time)
            </h3>
            <p>In the GB wholesale electricity market, day-ahead power is transacted in competitive auctions with specific gate closures:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li><strong style={{ color: '#fff' }}>EPEX SPOT GB Day-Ahead:</strong> Auction order book closes at <strong style={{ color: 'var(--cyan)' }}>09:20 London time</strong> on Day D-1 (<a href="https://www.epexspot.com/en/market-data?market_area=GB&trading_hub=GB&underlying_market=DayAhead" target="_blank" rel="noreferrer" style={{ color: 'var(--cyan)' }}>EPEX SPOT GB specifications</a>). <em>(Default cut-off in this pilot)</em></li>
              <li><strong style={{ color: '#fff' }}>Nord Pool N2EX Day-Ahead:</strong> Auction order book closes at <strong style={{ color: 'var(--cyan)' }}>09:50 London time</strong> on Day D-1 (<a href="https://www.nordpoolgroup.com/en/trading/Day-ahead-trading/Auction-markets/" target="_blank" rel="noreferrer" style={{ color: 'var(--cyan)' }}>Nord Pool N2EX rules</a>).</li>
              <li><strong style={{ color: 'var(--amber)' }}>11:00 Later Cut-off Sensitivity:</strong> Provided as a configurable sensitivity benchmark to evaluate forecast error improvements if decision gates are delayed.</li>
            </ul>
            <div style={{
              padding: '10px 14px', borderRadius: 8,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 11,
            }}>
              <strong style={{ color: '#fff', display: 'block', marginBottom: 3 }}>Strict Look-Ahead Isolation:</strong>
              For delivery day D, the cut-off is evaluated on D-1 at gate closure. Any forecast published after this timestamp is strictly excluded. Only the newest forecast published at or before the cut-off is used.
            </div>
          </div>

          {/* Section 2: Error Sign */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Scale size={15} color="var(--blue)" />
              2. Error Sign Convention &amp; Asymmetry Note
            </h3>
            <p>The error sign convention is defined as:</p>
            <div style={{
              padding: '10px 14px', borderRadius: 8, textAlign: 'center',
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: '#fff',
            }}>
              Error = Forecast − Actual
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{
                padding: '12px 14px', borderRadius: 10,
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)',
              }}>
                <span style={{ fontWeight: 600, color: '#fcd34d', display: 'block', marginBottom: 4 }}>
                  Positive Error (&gt; 0) = Wind Over-Forecast
                </span>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Utility assumed wind would generate more than delivered. Results in under-procuring non-wind power → physical deficit → exposed to imbalance settlement volume.
                </p>
              </div>
              <div style={{
                padding: '12px 14px', borderRadius: 10,
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.35)',
              }}>
                <span style={{ fontWeight: 600, color: '#6ee7b7', display: 'block', marginBottom: 4 }}>
                  Negative Error (&lt; 0) = Wind Under-Forecast
                </span>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Surplus wind generation. Utility over-procured non-wind power → physical long position.
                </p>
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
              *Note on market asymmetry: While GB cash-out prices are typically asymmetric (system buy price during short periods is historically higher than system sell price during surplus), financial settlement price modeling is explicitly out of scope as no price data is ingested.
            </p>
          </div>

          {/* Section 3: P90 Buffer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <ShieldAlert size={15} color="var(--amber)" />
              3. P90 Risk Buffer Formulation
            </h3>
            <p>The risk buffer is computed as:</p>
            <div style={{
              padding: '10px 14px', borderRadius: 8, textAlign: 'center',
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: '#fff',
            }}>
              Buffer_P90 = max(0, P90 of Error)
            </div>
            <p>
              <strong style={{ color: '#fff' }}>Commercial Interpretation:</strong> "To be ~90% confident that wind generation will not fall short of the procurement plan, the trading desk must assume available wind is up to{' '}
              <code style={{ color: 'var(--amber)', fontFamily: 'var(--mono)' }}>Buffer_P90 MW</code> lower than the headline forecast."
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Likewise, <code style={{ color: 'var(--amber)', fontFamily: 'var(--mono)' }}>Buffer_P95 = max(0, P95 of Error)</code> provides a 95% confidence hedge against severe tail events.
            </p>
          </div>

          {/* Section 4: Resolution */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Layers size={15} color="var(--cyan)" />
              4. Resolution Handling &amp; Publish Runs
            </h3>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li><strong style={{ color: '#fff' }}>Actuals (FUELHH):</strong> 30-minute settlement period resolution (:00 and :30 timestamps). Filtered for <code style={{ fontFamily: 'var(--mono)', color: 'var(--cyan)' }}>fuelType = "WIND"</code>.</li>
              <li><strong style={{ color: '#fff' }}>Forecasts (WINDFOR):</strong> 60-minute hourly resolution (:00 timestamps). Exactly <strong>9 discrete publish runs per day</strong> are detected in the dataset (02:30, 04:30, 07:30, 09:30, 11:30, 12:25, 15:30, 18:30, 22:30 UTC).</li>
              <li><strong style={{ color: '#fff' }}>Join Rule:</strong> Joined on exact startTime (:00 on the hour), yielding 24 exact hourly points per day (744 across January).</li>
              <li><strong style={{ color: '#fff' }}>Half-Hour Averaging Check:</strong> Resampling 30-minute actuals via hourly mean <code>(SP1 + SP2) / 2</code> yields 11,283.56 MW (vs 11,285.51 MW for exact :00 join), proving that the evaluation is invariant (&lt;0.02% sensitivity) to half-hour aggregation conventions.</li>
            </ul>
          </div>

          {/* Section 5: Date Window */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Clock size={15} color="var(--cyan)" />
              5. Decision Day D-1 vs Delivery Day D Window &amp; Timezones
            </h3>
            <p>
              Under day-ahead market rules, power delivered on day <strong style={{ color: '#fff' }}>D</strong> must be transacted on day <strong style={{ color: '#fff' }}>D-1</strong>.
            </p>
            <p>
              When purchase decisions span <strong style={{ color: '#fff' }}>1–31 January 2026</strong> (decision days D-1), physical electricity delivery occurs from <strong style={{ color: '#fff' }}>2 January to 1 February 2026</strong> (744 hourly settlement intervals). All delivery hours and gate closures are strictly anchored to <strong style={{ color: 'var(--cyan)' }}>Europe/London</strong> (GMT, UTC+0 in January).
            </p>
          </div>

          {/* Section 6: Systematic Bias & Embedded Wind */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Layers size={15} color="var(--amber)" />
              6. Systematic Forecast Bias &amp; Scope Considerations
            </h3>
            <p>
              The day-ahead forecast systematically over-predicted in January 2026, with an average bias of <strong style={{ color: 'var(--amber)' }}>+1,746 MW</strong> and 84.7% of hourly intervals over-forecast. Several factors explain this finding:
            </p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>
                <strong style={{ color: '#fff' }}>Ruled out aggregation as the cause:</strong> Resampling 30-minute actuals via hourly mean <code>(SP1+SP2)/2</code> yields 11,283.6 MW (within 0.017% of the exact :00 join of 11,285.5 MW), confirming that 30-minute to 60-minute aggregation convention does not cause the observed bias.
              </li>
              <li>
                <strong style={{ color: '#fff' }}>Likely Scope Distinction (Unverified with public BMRS data alone):</strong> Elexon BMRS documentation for <a href="https://data.elexon.co.uk/bmrs/api/v1/datasets/FUELHH" target="_blank" rel="noreferrer" style={{ color: 'var(--cyan)' }}>FUELHH</a> indicates that it appears to cover metered generation from Balancing Mechanism Units connected directly to the National Electricity Transmission System (NETS). Conversely, National Grid ESO national wind forecasts (<a href="https://data.elexon.co.uk/bmrs/api/v1/datasets/WINDFOR" target="_blank" rel="noreferrer" style={{ color: 'var(--cyan)' }}>WINDFOR</a>) model national-level wind output, which likely includes distributed / embedded wind generation connected to regional distribution networks (DNOs). Because embedded generation is not directly metered in FUELHH (acting as negative demand at Grid Supply Points), national forecasts would structurally exceed transmission-metered actuals. This is a likely candidate explanation based on GB market architecture, though unverified within the scope of this dataset.
              </li>
            </ul>
          </div>

          {/* Section 7: Sample Size & Buffer Robustness */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <ShieldAlert size={15} color="var(--emerald)" />
              7. Statistical Robustness &amp; In-Sample Limitation Caveat
            </h3>
            <p>
              The What-If Calculator defaults to the <strong style={{ color: 'var(--cyan)' }}>Window Benchmark Buffer (4,154 MW, N=744)</strong>. A full-month sample captures the empirical error distribution across diverse weather regimes.
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              <strong style={{ color: '#fff' }}>In-Sample Caveat:</strong> The risk buffers evaluated here are computed in-sample across January 2026. In a live trading production pipeline, the risk buffer would be calibrated on trailing historical windows (e.g. rolling 30–90 days) and tested out-of-sample against forward delivery days.
            </p>
          </div>

          {/* Section 8: Separating Bias from Spread */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Scale size={15} color="var(--blue)" />
              8. Separating Systematic Bias from Meteorological Spread
            </h3>
            <p>
              The full-window <strong>P90 Buffer (4,154 MW)</strong> separates into two distinct components:
            </p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>
                <strong style={{ color: 'var(--blue)' }}>Systematic Bias Component (P50 = 1,582 MW, ~38%):</strong> The predictable, median over-forecast across the month. The trading desk could eliminate this portion in advance via post-processing calibration or de-biasing filters.
              </li>
              <li>
                <strong style={{ color: 'var(--emerald)' }}>Stochastic Weather Spread (P90 − P50 = 2,572 MW, ~62%):</strong> The true residual meteorological uncertainty resulting from unpredictable frontal timing, barometric shifts, and spatial dispersion.
              </li>
            </ul>
          </div>

          {/* Section 9: Lead-Time Dynamics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Clock size={15} color="var(--cyan)" />
              9. Lead-Time Dynamics &amp; 28.0 Hour Mean Lead Time
            </h3>
            <p>
              Under EPEX SPOT gate closure (09:20 London time on D-1), delivery hours on Day D range from 00:00 (14.7 hours ahead) to 23:00 (37.7 hours ahead).
            </p>
            <p>
              As noted in Section 4, NESO publishes WINDFOR forecasts at discrete times across the day (9 runs observed); the <strong>07:30 UTC run</strong> is the latest available before the 09:20 gate closure. This results in an empirical <strong style={{ color: 'var(--cyan)' }}>mean lead time of 28.0 hours</strong> across all evaluated intervals in January.
            </p>
          </div>

          {/* Section 10: Flat Buffer Limitations vs Dynamic Wind Regimes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Layers size={15} color="var(--amber)" />
              10. Known Limitation: Flat MW Buffer vs. Dynamic Wind-Level Regimes
            </h3>
            <p>
              A flat MW buffer ignores the level of wind. In physical reality, forecast error variance scales with the expected level of wind. Crucially, bucketing is evaluated strictly on <strong>forecast generation level</strong> (P_forecast) known at decision time (rather than outturn actuals), ensuring zero look-ahead bias:
            </p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li><strong style={{ color: '#fff' }}>Low Wind Forecast (&lt;8 GW):</strong> Empirical P90 Error = <strong>1,887 MW</strong> (flat 4,154 MW buffer would be overly conservative and expensive).</li>
              <li><strong style={{ color: '#fff' }}>Medium Wind Forecast (8–16 GW):</strong> Empirical P90 Error = <strong>3,606 MW</strong>.</li>
              <li><strong style={{ color: '#fff' }}>High Wind Forecast (&gt;16 GW):</strong> Empirical P90 Error = <strong>4,788 MW</strong> (flat 4,154 MW buffer would be insufficient to cover tail risk).</li>
              <li><strong style={{ color: '#fff' }}>Proportional Relative Error:</strong> Across January, empirical P90 relative error is <strong>30.3% of the forecast</strong>. The What-If Tool includes a dynamic toggle for both Proportional and Bucketed Regime modes to address this limitation.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          paddingTop: 16, borderTop: '1px solid var(--border)',
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ fontSize: 12, padding: '7px 20px' }}
          >
            Close &amp; Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
