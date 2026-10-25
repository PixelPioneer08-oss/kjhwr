import React, { useState } from 'react';
import { Calculator, ShieldCheck, Flame, Zap, Info, Percent, Layers } from 'lucide-react';
import { SummaryMetrics, SelectedDayData } from '../types';

interface WhatIfToolProps {
  summary: SummaryMetrics;
  dayData: SelectedDayData;
}

export type BufferMethod = 'fixed' | 'proportional' | 'regime';

export const WhatIfTool: React.FC<WhatIfToolProps> = ({ summary, dayData }) => {
  const [demandMW, setDemandMW] = useState<number>(25000);
  const [useDaySpecific, setUseDaySpecific] = useState<boolean>(false);
  const [bufferMethod, setBufferMethod] = useState<BufferMethod>('fixed');

  const windForecastMW = useDaySpecific ? dayData.summary.mean_forecast : summary.mean_forecast;

  // Compute buffer based on selected methodology
  let p90BufferMW = 0;
  if (bufferMethod === 'fixed') {
    p90BufferMW = useDaySpecific ? dayData.summary.buffer_p90 : summary.buffer_p90;
  } else if (bufferMethod === 'proportional') {
    // 30.31% empirical P90 relative error across Jan 2026
    p90BufferMW = Math.round(windForecastMW * 0.3031);
  } else if (bufferMethod === 'regime') {
    // Wind generation regimes derived from Jan 2026 empirical error percentiles:
    // Low (<8 GW): 1,887 MW | Med (8–16 GW): 3,606 MW | High (>16 GW): 4,788 MW
    if (windForecastMW < 8000) {
      p90BufferMW = 1887;
    } else if (windForecastMW <= 16000) {
      p90BufferMW = 3606;
    } else {
      p90BufferMW = 4788;
    }
  }

  // Systematic bias vs Stochastic spread decomposition
  const p50Systematic = Math.round(summary.error_percentiles.p50); // 1,582 MW
  const stochasticSpread = Math.max(0, Math.round(summary.buffer_p90 - p50Systematic)); // 2,572 MW

  const unadjustedProcure = Math.max(0, demandMW - windForecastMW);
  const riskAdjustedWind = Math.max(0, windForecastMW - p90BufferMW);
  const riskAdjustedProcure = Math.max(0, demandMW - riskAdjustedWind);
  const additionalBuffer = riskAdjustedProcure - unadjustedProcure;

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid rgba(6,182,212,0.25)',
      borderRadius: 'var(--radius-lg)',
      padding: 20,
      backgroundImage: 'linear-gradient(180deg, rgba(6,182,212,0.04) 0%, transparent 60%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        paddingBottom: 14,
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--cyan-dim)', border: '1px solid rgba(6,182,212,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Calculator size={18} color="var(--cyan)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>
                What-If Day-Ahead Procurement Calculator
              </h3>
              <span style={{
                padding: '2px 8px', borderRadius: 4,
                background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)',
                color: '#93c5fd', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                Interactive Simulator
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>
              Calculate risk-adjusted non-wind procurement required to protect consumer demand against wind forecast shortfall
            </p>
          </div>
        </div>

        {/* Toggle: Day vs Window */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{
            display: 'flex', padding: 4, gap: 2,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 8, fontSize: 11,
          }}>
            <button
              onClick={() => setUseDaySpecific(false)}
              style={{
                padding: '4px 10px', borderRadius: 6, cursor: 'pointer', border: 'none',
                background: !useDaySpecific ? 'rgba(6,182,212,0.2)' : 'transparent',
                color: !useDaySpecific ? '#67e8f9' : 'var(--text-muted)',
                fontWeight: !useDaySpecific ? 600 : 400,
                transition: 'all 0.15s',
                fontFamily: 'var(--font)',
              }}
            >
              Window Benchmark (N={summary.n})
            </button>
            <button
              onClick={() => setUseDaySpecific(true)}
              style={{
                padding: '4px 10px', borderRadius: 6, cursor: 'pointer', border: 'none',
                background: useDaySpecific ? 'rgba(6,182,212,0.2)' : 'transparent',
                color: useDaySpecific ? '#67e8f9' : 'var(--text-muted)',
                fontWeight: useDaySpecific ? 600 : 400,
                transition: 'all 0.15s',
                fontFamily: 'var(--font)',
              }}
            >
              Day {dayData.date.replace('2026-', '')} (N=24)
            </button>
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            {!useDaySpecific ? '✓ Using statistically robust 744-hour benchmark' : '⚠ Using single-day indicative sample (24 points)'}
          </span>
        </div>
      </div>

      {/* Buffer Methodology Selector */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px', borderRadius: 10,
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        gap: 12, fontSize: 11,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
          <Layers size={14} color="var(--cyan)" />
          <span style={{ fontWeight: 600, color: '#fff' }}>Buffer Scaling Model:</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setBufferMethod('fixed')}
            style={{
              padding: '4px 10px', borderRadius: 6, cursor: 'pointer', border: '1px solid',
              borderColor: bufferMethod === 'fixed' ? 'var(--cyan)' : 'var(--border)',
              background: bufferMethod === 'fixed' ? 'rgba(6,182,212,0.15)' : 'transparent',
              color: bufferMethod === 'fixed' ? '#67e8f9' : 'var(--text-muted)',
              fontWeight: bufferMethod === 'fixed' ? 600 : 400,
            }}
          >
            Fixed Flat P90 ({Math.round(p90BufferMW).toLocaleString()} MW)
          </button>
          <button
            onClick={() => setBufferMethod('proportional')}
            style={{
              padding: '4px 10px', borderRadius: 6, cursor: 'pointer', border: '1px solid',
              borderColor: bufferMethod === 'proportional' ? 'var(--cyan)' : 'var(--border)',
              background: bufferMethod === 'proportional' ? 'rgba(6,182,212,0.15)' : 'transparent',
              color: bufferMethod === 'proportional' ? '#67e8f9' : 'var(--text-muted)',
              fontWeight: bufferMethod === 'proportional' ? 600 : 400,
            }}
          >
            Proportional (30.3% of Wind Fc)
          </button>
          <button
            onClick={() => setBufferMethod('regime')}
            style={{
              padding: '4px 10px', borderRadius: 6, cursor: 'pointer', border: '1px solid',
              borderColor: bufferMethod === 'regime' ? 'var(--cyan)' : 'var(--border)',
              background: bufferMethod === 'regime' ? 'rgba(6,182,212,0.15)' : 'transparent',
              color: bufferMethod === 'regime' ? '#67e8f9' : 'var(--text-muted)',
              fontWeight: bufferMethod === 'regime' ? 600 : 400,
            }}
          >
            Wind-Level Bucketed Regime
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="whatif-container-grid">
        {/* Left: Demand Slider */}
        <div className="whatif-left-panel">
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Client Consumer Demand (MW)
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="range"
              min="10000"
              max="45000"
              step="500"
              value={demandMW}
              onChange={(e) => setDemandMW(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--cyan)', height: 4, cursor: 'pointer' }}
            />
            <span style={{
              fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: '#fff',
              padding: '5px 10px', borderRadius: 8,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              minWidth: 92, textAlign: 'center',
            }}>
              {demandMW.toLocaleString()}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
            <span>Min: 10,000</span>
            <span>Typical GB: ~28,000</span>
            <span>Max: 45,000</span>
          </div>

          {/* Context values */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)' }}>
              <span>Expected Wind:</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--cyan)' }}>
                {Math.round(windForecastMW).toLocaleString()} MW
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)' }}>
              <span>Applied P90 Buffer:</span>
              <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--amber)' }}>
                {Math.round(p90BufferMW).toLocaleString()} MW
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
              <span>Buffer Mode:</span>
              <span style={{ fontFamily: 'var(--mono)' }}>
                {bufferMethod === 'fixed' ? 'Flat Absolute MW' : bufferMethod === 'proportional' ? '30.3% Dynamic' : 'Regime-Based'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Result Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="whatif-results-grid">
            {/* Unadjusted */}
            <div style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '14px 16px',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={13} color="var(--text-muted)" />
                Unadjusted Procurement
              </span>
              <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', color: '#fff', margin: 0 }}>
                {Math.round(unadjustedProcure).toLocaleString()}{' '}
                <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-secondary)' }}>MW</span>
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                <code style={{ color: '#67e8f9', fontFamily: 'var(--mono)' }}>Demand – Wind Forecast</code>. Assumes 100% of forecast delivered. Leaves utility exposed to unhedged imbalance risk if wind underperforms.
              </p>
            </div>

            {/* Risk-Adjusted */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.1), var(--bg-elevated))',
              border: '1px solid rgba(6,182,212,0.4)',
              borderRadius: 12, padding: '14px 16px',
              boxShadow: '0 4px 16px rgba(6,182,212,0.1)',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--cyan)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                  <ShieldCheck size={14} color="var(--cyan)" />
                  Risk-Adjusted (P90)
                </span>
                <span style={{
                  padding: '2px 6px', borderRadius: 4,
                  background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.4)',
                  fontSize: 10, color: '#67e8f9', fontFamily: 'var(--mono)',
                }}>90% Cover</span>
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', color: '#67e8f9', margin: 0 }}>
                {Math.round(riskAdjustedProcure).toLocaleString()}{' '}
                <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-secondary)' }}>MW</span>
              </p>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                <code style={{ color: '#67e8f9', fontFamily: 'var(--mono)' }}>Demand – (Forecast – P90)</code>. Hedged so wind + non-wind covers demand in ~90% of intervals.
              </p>
            </div>
          </div>

          {/* Reserve Alert */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '12px 14px', borderRadius: 10,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)',
          }}>
            <Flame size={18} color="var(--amber)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 11 }}>
              <span style={{ fontWeight: 600, color: '#fcd34d' }}>
                Recommended Non-Wind Reserve Commitment: +{Math.round(additionalBuffer).toLocaleString()} MW
              </span>
              <p style={{ color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5 }}>
                Procuring this extra {Math.round(additionalBuffer).toLocaleString()} MW of thermal / flexible supply in the day-ahead auction reduces exposure to volatile cash-out settlement during wind deficit periods.
              </p>
            </div>
          </div>

          {/* Statistical Decomposition Card: Bias vs Spread */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            padding: '12px 14px', borderRadius: 10,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            fontSize: 11,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
              <span style={{ fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Info size={13} color="var(--cyan)" />
                P90 Buffer Decomposition: Systematic Bias vs. Stochastic Spread
              </span>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)' }}>Window N=744</span>
            </div>
            <div className="whatif-decomp-grid">
              <div style={{ padding: '6px 8px', background: 'rgba(59,130,246,0.08)', borderRadius: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>1. Systematic Bias (P50)</span>
                <p style={{ margin: '2px 0 0 0', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--blue)' }}>
                  +{p50Systematic.toLocaleString()} MW
                </p>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Calibratable model bias</span>
              </div>
              <div style={{ padding: '6px 8px', background: 'rgba(16,185,129,0.08)', borderRadius: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>2. Weather Spread (P90−P50)</span>
                <p style={{ margin: '2px 0 0 0', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--emerald)' }}>
                  +{stochasticSpread.toLocaleString()} MW
                </p>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Irreducible weather variance</span>
              </div>
              <div style={{ padding: '6px 8px', background: 'rgba(245,158,11,0.08)', borderRadius: 6 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Total P90 Risk Buffer</span>
                <p style={{ margin: '2px 0 0 0', fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--amber)' }}>
                  {Math.round(summary.buffer_p90).toLocaleString()} MW
                </p>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>90% empirical cover</span>
              </div>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
              <strong style={{ color: '#fff' }}>Commercial takeaway:</strong> Of the 4,154 MW buffer, <strong>1,582 MW (P50)</strong> represents systematic over-prediction (which a desk can correct via post-processing calibration), while the remaining <strong>2,572 MW</strong> represents real weather uncertainty.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
