import React from 'react';
import { SummaryMetrics } from '../types';

interface KpiGridProps { summary: SummaryMetrics; }

export const KpiGrid: React.FC<KpiGridProps> = ({ summary }) => {
  const over = summary.bias > 0;
  const fmt = (v: number) => Math.round(v).toLocaleString();

  return (
    <div className="kpi-section">
      {/* Hero cards */}
      <div className="kpi-hero-grid">

        {/* P90 Risk Buffer */}
        <div className="kpi-card accent-amber">
          <div className="kpi-label" style={{ color: 'var(--amber)' }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            P90 Risk Buffer
          </div>
          <div className="kpi-value" style={{ color: 'var(--amber)' }}>
            {fmt(summary.buffer_p90)}<span className="unit">MW</span>
          </div>
          <div className="kpi-desc">
            Assume wind is up to this much below forecast to be ~90% confident generation meets plan. Reduces exposure to imbalance settlement.
          </div>
          <div className="kpi-split">
            <span>P95 Buffer: <strong style={{ color: 'var(--amber)', fontFamily: 'var(--mono)' }}>{fmt(summary.buffer_p95)} MW</strong></span>
            <span>P50: <strong style={{ fontFamily: 'var(--mono)' }}>{fmt(summary.error_percentiles.p50)} MW</strong></span>
          </div>
        </div>

        {/* MAE */}
        <div className="kpi-card accent-cyan">
          <div className="kpi-label" style={{ color: 'var(--cyan)' }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Mean Absolute Error
          </div>
          <div className="kpi-value" style={{ color: 'var(--cyan)' }}>
            {fmt(summary.mae)}<span className="unit">MW</span>
          </div>
          <div className="kpi-split" style={{ marginTop: 8, paddingTop: 8 }}>
            <span>RMSE: <strong style={{ fontFamily: 'var(--mono)' }}>{fmt(summary.rmse)} MW</strong></span>
            <span>WAPE: <strong style={{ fontFamily: 'var(--mono)' }}>{summary.wape}%</strong></span>
          </div>
          <div className="kpi-desc" style={{ marginTop: 8 }}>
            Average magnitude deviation across all <strong>{summary.n.toLocaleString()}</strong> evaluated hourly intervals.
          </div>
        </div>

        {/* Bias card */}
        <div className={`kpi-card ${over ? 'accent-amber' : 'accent-blue'}`}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div className="kpi-label" style={{ color: over ? 'var(--rose)' : 'var(--emerald)' }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
              </svg>
              Mean Bias (Fc − Act)
            </div>
            <span className={`badge ${over ? 'badge-rose' : 'badge-emerald'}`}>
              {over ? '▲ Over-Fc' : '▼ Under-Fc'}
            </span>
          </div>
          <div className="kpi-value" style={{ color: over ? 'var(--rose)' : 'var(--emerald)' }}>
            {over ? '+' : ''}{fmt(summary.bias)}<span className="unit">MW</span>
          </div>
          <div className="kpi-split">
            <span>Over-fc intervals: <strong style={{ color: 'var(--amber)', fontFamily: 'var(--mono)' }}>{summary.share_overforecast}%</strong></span>
          </div>
          <div className="kpi-desc" style={{ marginTop: 8 }}>
            {over ? 'Wind over-forecasted → utility under-buys non-wind → creates shortfall exposure.' : 'Wind under-forecasted → surplus generation → position long.'}
          </div>
        </div>

        {/* Over-forecast MWh */}
        <div className="kpi-card accent-rose">
          <div className="kpi-label" style={{ color: 'var(--rose)' }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Total Shortfall Volume
          </div>
          <div className="kpi-value" style={{ color: 'var(--rose)' }}>
            {(Math.round(summary.total_overforecast_mwh / 1000 * 10) / 10).toLocaleString()}<span className="unit">GWh</span>
          </div>
          <div className="kpi-split">
            <span>Actual wind: <strong style={{ fontFamily: 'var(--mono)' }}>{Math.round(summary.total_actual_mwh / 1000).toLocaleString()} GWh</strong></span>
            <span>Fc: <strong style={{ fontFamily: 'var(--mono)' }}>{Math.round(summary.total_forecast_mwh / 1000).toLocaleString()} GWh</strong></span>
          </div>
          <div className="kpi-desc" style={{ marginTop: 8 }}>
            Cumulative energy shortfall the utility had to procure from balancing reserve or thermal backup.
          </div>
        </div>
      </div>

      {/* Secondary row */}
      <div className="kpi-secondary">
        <div className="kpi-mini">
          <div className="kpi-mini-label">MAPE (≥100 MW)</div>
          <div className="kpi-mini-value">{summary.mape}<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>%</span></div>
          <div className="kpi-mini-sub">Avoids small-actual skew</div>
        </div>
        <div className="kpi-mini">
          <div className="kpi-mini-label">WAPE</div>
          <div className="kpi-mini-value">{summary.wape}<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>%</span></div>
          <div className="kpi-mini-sub">Weighted error / actual</div>
        </div>
        <div className="kpi-mini">
          <div className="kpi-mini-label">Mean Lead Time</div>
          <div className="kpi-mini-value" style={{ color: 'var(--cyan)' }}>{summary.mean_lead_time_hours}<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)' }}>h</span></div>
          <div className="kpi-mini-sub">Publish → delivery</div>
        </div>
        <div className="kpi-mini">
          <div className="kpi-mini-label">P05 / P95 Error</div>
          <div className="kpi-mini-value" style={{ fontSize: 15 }}>
            <span style={{ color: 'var(--emerald)', fontFamily: 'var(--mono)' }}>{fmt(summary.error_percentiles.p05)}</span>
            <span style={{ color: 'var(--text-muted)', margin: '0 3px' }}>/</span>
            <span style={{ color: 'var(--amber)', fontFamily: 'var(--mono)' }}>+{fmt(summary.error_percentiles.p95)}</span>
          </div>
          <div className="kpi-mini-sub">MW — tail range</div>
        </div>
        <div className="kpi-mini">
          <div className="kpi-mini-label">Mean Wind Actual</div>
          <div className="kpi-mini-value">{fmt(summary.mean_actual)}<span style={{ fontSize: 11, color: 'var(--text-muted)' }}>MW</span></div>
          <div className="kpi-mini-sub">Avg generation</div>
        </div>
        <div className="kpi-mini">
          <div className="kpi-mini-label">Sample Count n</div>
          <div className="kpi-mini-value">{summary.n.toLocaleString()}</div>
          <div className="kpi-mini-sub">Exact hourly matches</div>
        </div>
      </div>
    </div>
  );
};
