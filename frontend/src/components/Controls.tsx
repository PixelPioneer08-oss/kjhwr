import React from 'react';
import { AnalysisParams } from '../api';

interface ControlsProps {
  params: AnalysisParams;
  onChange: (u: Partial<AnalysisParams>) => void;
}

const CUTOFF_PRESETS = [
  { label: 'EPEX GB 09:20', value: '09:20', note: 'Default' },
  { label: 'N2EX 09:50',    value: '09:50', note: '' },
  { label: '11:00 Later Cut-off', value: '11:00', note: 'Sensitivity' },
];

const DATE_PRESETS = [
  { label: 'Full Jan (31d)', from: '2026-01-01', to: '2026-01-31' },
  { label: 'Week 1',         from: '2026-01-01', to: '2026-01-07' },
  { label: 'Week 2',         from: '2026-01-08', to: '2026-01-14' },
  { label: 'Week 3',         from: '2026-01-15', to: '2026-01-21' },
  { label: 'Week 4+',        from: '2026-01-22', to: '2026-01-31' },
];

export const Controls: React.FC<ControlsProps> = ({ params, onChange }) => {
  const mode    = params.mode    || 'gate';
  const cutoff  = params.cutoff  || '09:20';
  const horizon = params.horizon_hours ?? 24;

  return (
    <div className="controls-panel">
      {/* Top row: title + mode toggle */}
      <div className="controls-header">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="var(--cyan)" strokeWidth="2">
            <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
            <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
            <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Market Cut-Off &amp; Decision Parameters
          </span>
        </div>
        <div className="toggle-group">
          <button className={`btn ${mode === 'gate' ? 'active' : ''}`} onClick={() => onChange({ mode: 'gate' })}>
            Day-Ahead Gate (D-1)
          </button>
          <button className={`btn ${mode === 'horizon' ? 'active' : ''}`} onClick={() => onChange({ mode: 'horizon' })}>
            Fixed Lead Time
          </button>
        </div>
      </div>

      {/* Controls grid */}
      <div className="controls-row" style={{ paddingTop: 16 }}>
        {/* Date Window */}
        <div className="control-group">
          <div className="control-label">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Decision Window (Day D-1)
          </div>
          <div className="date-inputs">
            <input
              type="date"
              className="date-input"
              value={params.decision_from || '2026-01-01'}
              min="2025-12-31"
              max="2026-01-31"
              onChange={e => onChange({ decision_from: e.target.value })}
            />
            <span className="date-sep">→</span>
            <input
              type="date"
              className="date-input"
              value={params.decision_to || '2026-01-31'}
              min="2026-01-01"
              max="2026-02-01"
              onChange={e => onChange({ decision_to: e.target.value })}
            />
          </div>
          <div className="chip-row" style={{ paddingTop: 4 }}>
            {DATE_PRESETS.map(p => (
              <button
                key={p.label}
                className={`chip ${params.decision_from === p.from && params.decision_to === p.to ? 'active' : ''}`}
                onClick={() => onChange({ decision_from: p.from, decision_to: p.to })}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Deliveries: {params.decision_from || 'Jan 1'} +1d → {params.decision_to || 'Jan 31'} +1d
          </p>
        </div>

        {/* Cutoff / Horizon */}
        {mode === 'gate' ? (
          <div className="control-group">
            <div className="control-label">
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              Gate Closure Cut-off (London Time on D-1)
            </div>
            <div className="gate-presets">
              {CUTOFF_PRESETS.map(p => (
                <button
                  key={p.value}
                  className={`chip ${cutoff === p.value ? (p.value === '11:00' ? 'active-amber' : 'active') : ''}`}
                  onClick={() => onChange({ cutoff: p.value })}
                >
                  {p.label} {p.note && <span style={{ opacity: 0.8 }}>{p.note}</span>}
                </button>
              ))}
              <div className="custom-time-wrap flex items-center gap-2">
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Custom:</span>
                <input type="time" value={cutoff} onChange={e => onChange({ cutoff: e.target.value })} style={{ width: 90 }} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, maxWidth: 600 }}>
              <strong style={{ color: 'var(--cyan)' }}>Strict isolation:</strong> Only forecasts published at or before{' '}
              <code style={{ fontFamily: 'var(--mono)', color: 'var(--amber)', fontSize: 11 }}>{cutoff} London</code> on D-1 are eligible. Post-cutoff forecasts are strictly discarded.
            </p>
          </div>
        ) : (
          <div className="control-group">
            <div className="control-label" style={{ justifyContent: 'space-between' }}>
              <span className="flex items-center gap-2">
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                Fixed Lead Time (hours before each delivery interval)
              </span>
              <span className="font-mono" style={{ color: 'var(--cyan)', fontWeight: 700 }}>{horizon}h Horizon</span>
            </div>
            <input
              type="range" min={1} max={48} step={1} value={horizon}
              onChange={e => onChange({ horizon_hours: Number(e.target.value) })}
            />
            <div className="flex justify-between" style={{ marginTop: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>1h (intraday)</span>
              <span style={{ fontSize: 11, color: 'var(--amber)' }}>24h (typical DA gate: ~28h from midnight)</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>48h</span>
            </div>
          </div>
        )}

        {/* Summary meta pill */}
        <div className="control-group" style={{ minWidth: 160 }}>
          <div className="control-label">Mode Active</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {mode === 'gate' ? (
              <div className="badge badge-cyan" style={{ justifyContent: 'center', padding: '6px 10px' }}>
                Gate Closure: {cutoff} London
              </div>
            ) : (
              <div className="badge badge-blue" style={{ justifyContent: 'center', padding: '6px 10px' }}>
                Lead: {horizon}h ahead
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
              Jan 2026 · EPEX/N2EX GB
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
