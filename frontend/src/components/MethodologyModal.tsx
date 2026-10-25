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
            <p>In the GB wholesale electricity market, day-ahead power is traded on two competing exchanges:</p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li><strong style={{ color: '#fff' }}>EPEX SPOT GB:</strong> Auction gate closes at <strong style={{ color: 'var(--cyan)' }}>09:20 London time</strong> on Day D-1. <em>(Default cut-off)</em></li>
              <li><strong style={{ color: '#fff' }}>Nord Pool N2EX:</strong> Auction gate closes at <strong style={{ color: 'var(--cyan)' }}>09:50 London time</strong> on Day D-1.</li>
              <li><strong style={{ color: 'var(--amber)' }}>Legacy 11:00 London time:</strong> <span style={{ textDecoration: 'underline' }}>OUTDATED</span>. Used pre-Jan 2021. Supported here for historical comparison only.</li>
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
              2. Error Sign Convention &amp; Financial Asymmetry
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
                  Utility assumed wind would generate more than it did. Results in <strong>under-buying</strong> non-wind supply → generation deficit → exposed to volatile imbalance settlement (System Buy Price / Cash-Out).
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
                  Surplus wind generation. Utility over-procured non-wind. Unwinding a surplus via system sell or spill carries lower financial penalties than facing an unexpected shortfall.
                </p>
              </div>
            </div>
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
              4. Resolution Handling: 30-Min Actuals vs 60-Min Forecasts
            </h3>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li><strong style={{ color: '#fff' }}>Actuals (FUELHH):</strong> 30-minute settlement period resolution (:00 and :30 timestamps). Filtered for <code style={{ fontFamily: 'var(--mono)', color: 'var(--cyan)' }}>fuelType = "WIND"</code>.</li>
              <li><strong style={{ color: '#fff' }}>Forecasts (WINDFOR):</strong> 60-minute hourly resolution (:00 timestamps). Published up to 8 times daily by NESO.</li>
              <li><strong style={{ color: '#fff' }}>Join Rule:</strong> Joined strictly on <strong style={{ color: 'var(--cyan)' }}>exact startTime</strong> (:00 on the hour). No interpolation or synthetic points invented. This yields 24 exact hourly matches per day (744 across January).</li>
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
              6. Systematic Forecast Bias: Transmission Metering vs Embedded Wind
            </h3>
            <p>
              The pilot observes a mean forecast bias of <strong style={{ color: 'var(--amber)' }}>+1,746 MW</strong> (forecasts average 13,031 MW vs 11,286 MW actuals, with 84.7% of hours over-forecast). Power market analysis reveals this is an authentic structural data characteristic:
            </p>
            <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <li>
                <strong style={{ color: '#fff' }}>WINDFOR Coverage:</strong> National Grid ESO (NESO) produces national wind forecasts covering <em>both</em> transmission-connected offshore/onshore wind farms and distribution-connected (embedded) wind generation across Great Britain (~30+ GW total capacity).
              </li>
              <li>
                <strong style={{ color: '#fff' }}>FUELHH Coverage:</strong> The Elexon FUELHH stream meters power injected by Balancing Mechanism (BM) Units directly into the National Electricity Transmission System (NETS).
              </li>
              <li>
                <strong style={{ color: '#fff' }}>The Embedded Wind Gap:</strong> Embedded wind farms (~5–7 GW capacity in GB) connect directly to regional 33kV/11kV Distribution Network Operators (DNOs). At transmission level, embedded generation manifests as "negative demand" at Grid Supply Points rather than metered FUELHH generation, creating the structural ~1.5–2 GW delta.
              </li>
              <li>
                <strong style={{ color: '#fff' }}>Half-Hour Averaging Verification:</strong> Resampling 30-minute actuals by taking the hourly mean <code>(SP1 + SP2) / 2</code> yields <strong>11,283.56 MW</strong> (vs 11,285.51 MW for exact :00 join), proving the systematic bias is a physical scope difference rather than an alignment artifact.
              </li>
            </ul>
          </div>

          {/* Section 7: Sample Size & Buffer Robustness */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <ShieldAlert size={15} color="var(--emerald)" />
              7. Statistical Robustness: Window Benchmark vs Single-Day Buffer
            </h3>
            <p>
              The What-If Calculator defaults to the <strong style={{ color: 'var(--cyan)' }}>Window Benchmark Buffer (4,154 MW, N=744)</strong>. A full-month sample captures the true empirical error distribution across diverse weather regimes (high-pressure calms, Atlantic storms, ramp rates).
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              While a single-day buffer (N=24 points, e.g. 1,543 MW on 2 Jan) can be toggled for day-specific inspection, 24 points are statistically noisy and vulnerable to intra-day variance. Trading desks are advised to base baseline risk reserves on the full-window empirical P90.
            </p>
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
