import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine } from 'recharts';
import { HorizonPoint } from '../types';

interface Props {
  curveData: HorizonPoint[];
  currentLeadTime: number;
  isLoading: boolean;
}

const HorizonTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as HorizonPoint;
  return (
    <div style={{ background: '#0d1117', border: '1px solid #1e2d45', borderRadius: 10, padding: '12px 16px', minWidth: 210, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', fontSize: 12 }}>
      <div style={{ fontWeight: 700, color: '#f0f6ff', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #1e2d45' }}>
        {label}h Lead Time
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
        <span style={{ color: '#06b6d4' }}>MAE:</span>
        <strong style={{ fontFamily: 'var(--mono)' }}>{d.mae?.toLocaleString()} MW</strong>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
        <span style={{ color: '#818cf8' }}>RMSE:</span>
        <strong style={{ fontFamily: 'var(--mono)' }}>{d.rmse?.toLocaleString()} MW</strong>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingTop: 6, borderTop: '1px solid #1e2d45' }}>
        <span style={{ color: '#f59e0b' }}>P90 Buffer:</span>
        <strong style={{ fontFamily: 'var(--mono)' }}>{d.buffer_p90?.toLocaleString()} MW</strong>
      </div>
      <div style={{ fontSize: 11, color: '#4a5568', marginTop: 6 }}>n = {d.n} intervals</div>
    </div>
  );
};

export const LeadTimeCurve: React.FC<Props> = ({ curveData, currentLeadTime, isLoading }) => {
  const at4h  = curveData.find(p => p.horizon_hours === 4);
  const atDA  = curveData.find(p => p.horizon_hours === Math.round(currentLeadTime)) || curveData.find(p => p.horizon_hours === 24);
  const loss  = atDA && at4h && at4h.mae > 0 ? Math.round(((atDA.mae - at4h.mae) / at4h.mae) * 100) : null;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">Forecast Error vs. Decision Lead Time (1h – 48h Horizon)</div>
          <div className="chart-sub">Shows accuracy degradation as purchase decisions are committed further from delivery</div>
        </div>
        {loss !== null && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius)', padding: '6px 12px', fontSize: 12 }}>
              Day-Ahead MAE vs 4h: <strong style={{ fontFamily: 'var(--mono)', color: 'var(--amber)' }}>+{loss}%</strong>
            </div>
            {at4h && <div style={{ background: 'var(--cyan-dim)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 'var(--radius)', padding: '6px 12px', fontSize: 12 }}>
              4h MAE: <strong style={{ fontFamily: 'var(--mono)', color: 'var(--cyan)' }}>{at4h.mae?.toLocaleString()} MW</strong>
            </div>}
          </div>
        )}
      </div>
      <div className="chart-body">
        {isLoading ? (
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text-muted)' }}>
            <div className="spinner" />
            <span style={{ fontSize: 12 }}>Computing 48-point horizon curve…</span>
          </div>
        ) : (
          <>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={curveData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
                  <XAxis dataKey="horizon_hours" stroke="#2d3748" tick={{ fill: '#4a5568', fontSize: 11 }} unit="h" />
                  <YAxis stroke="#2d3748" tick={{ fill: '#4a5568', fontSize: 11 }} tickFormatter={v => `${Math.round(v/100)/10}k`} width={42} unit="" />
                  <Tooltip content={<HorizonTooltip />} />
                  <Legend formatter={v => <span style={{ fontSize: 11, color: '#8b9dc3' }}>{v}</span>} wrapperStyle={{ paddingTop: 12 }} />
                  {currentLeadTime > 0 && (
                    <ReferenceLine x={Math.round(currentLeadTime)} stroke="#f59e0b" strokeDasharray="5 3"
                      label={{ value: `~${Math.round(currentLeadTime)}h Gate`, position: 'top', fill: '#f59e0b', fontSize: 10 }}
                    />
                  )}
                  <Line type="monotone" dataKey="mae"       name="MAE (MW)"         stroke="#06b6d4" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="rmse"      name="RMSE (MW)"        stroke="#818cf8" strokeWidth={2}   dot={false} />
                  <Line type="monotone" dataKey="buffer_p90" name="P90 Buffer (MW)" stroke="#f59e0b" strokeWidth={2}   dot={false} strokeDasharray="5 3" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
              {[
                { label: 'Intraday (1–4h)', color: 'var(--cyan)', desc: 'NWP has updated; lowest MAE and minimum risk buffer required for procurement.' },
                { label: 'Day-Ahead (~24-30h)', color: 'var(--amber)', desc: 'Current auction commitment window. Error rises significantly due to weather front uncertainty.' },
                { label: 'Flexibility Option Value', color: 'var(--indigo)', desc: 'The MAE gap between horizons quantifies the commercial value of deferring commitment to intraday.' },
              ].map(row => (
                <div key={row.label} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: row.color, marginBottom: 6 }}>{row.label}</div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{row.desc}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
