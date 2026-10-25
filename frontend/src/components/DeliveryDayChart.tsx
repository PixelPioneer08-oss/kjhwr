import React, { useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Bar,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine
} from 'recharts';
import { SelectedDayData } from '../types';

interface Props {
  dayData: SelectedDayData;
  availableDays: string[];
  selectedDay: string;
  onSelectDay: (d: string) => void;
  cutoff: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const pubDt = new Date(d.publishTime);
  const pubStr = pubDt.toLocaleDateString('en-GB', { month: 'short', day: 'numeric', timeZone: 'UTC' })
    + ' ' + pubDt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
  return (
    <div style={{ background: '#0d1117', border: '1px solid #1e2d45', borderRadius: 10, padding: '12px 16px', minWidth: 230, boxShadow: '0 8px 32px rgba(0,0,0,0.6)', fontSize: 12 }}>
      <div style={{ fontWeight: 700, color: '#f0f6ff', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #1e2d45' }}>
        {new Date(d.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} — Delivery
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
        <span style={{ color: '#06b6d4' }}>Actual:</span>
        <strong style={{ fontFamily: 'var(--mono)' }}>{d.actual.toLocaleString()} MW</strong>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
        <span style={{ color: '#818cf8' }}>DA Forecast:</span>
        <strong style={{ fontFamily: 'var(--mono)' }}>{d.forecast.toLocaleString()} MW</strong>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingTop: 6, borderTop: '1px solid #1e2d45', marginBottom: 4 }}>
        <span style={{ color: '#8b9dc3' }}>Error (Fc−Act):</span>
        <strong style={{ fontFamily: 'var(--mono)', color: d.error > 0 ? '#f59e0b' : '#10b981' }}>
          {d.error > 0 ? '+' : ''}{d.error.toLocaleString()} MW
        </strong>
      </div>
      <div style={{ fontSize: 11, color: '#4a5568', marginTop: 6 }}>
        Published: <span style={{ color: '#06b6d4', fontFamily: 'var(--mono)' }}>{pubStr}</span>
      </div>
      <div style={{ fontSize: 11, color: '#4a5568' }}>
        Lead time: {d.lead_time_hours}h before delivery
      </div>
    </div>
  );
};

export const DeliveryDayChart: React.FC<Props> = ({ dayData, availableDays, selectedDay, onSelectDay, cutoff }) => {
  const [showAudit, setShowAudit] = useState(false);
  const s = dayData.summary;

  const series = dayData.series.map(pt => ({
    ...pt,
    hour: new Date(pt.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    overMW:  pt.error > 0 ? pt.error : 0,
    underMW: pt.error < 0 ? pt.error : 0,
  }));

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <div className="chart-title">
            Delivery Day Profile&nbsp;—&nbsp;
            <span style={{ color: 'var(--cyan)', fontFamily: 'var(--mono)' }}>{selectedDay}</span>
          </div>
          <div className="chart-sub">
            Day-ahead forecast (cut-off {cutoff} London on D-1) vs. actual delivered wind generation
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Day quick stats */}
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span>MAE: <strong style={{ fontFamily: 'var(--mono)', color: 'var(--text-primary)' }}>{s.mae} MW</strong></span>
            <span>Bias: <strong style={{ fontFamily: 'var(--mono)', color: s.bias > 0 ? 'var(--amber)' : 'var(--emerald)' }}>
              {s.bias > 0 ? '+' : ''}{s.bias} MW
            </strong></span>
            <span>Buffer P90: <strong style={{ fontFamily: 'var(--mono)', color: 'var(--amber)' }}>{s.buffer_p90} MW</strong></span>
          </div>
          <button className={`btn ${showAudit ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setShowAudit(!showAudit)}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
            </svg>
            {showAudit ? 'Hide Audit' : 'Audit Log'}
          </button>
        </div>
      </div>

      {/* Day pill selector */}
      <div style={{ padding: '10px 22px', borderBottom: '1px solid var(--border)' }}>
        <div className="day-pill-bar">
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 4 }}>Select day:</span>
          {availableDays.map(d => (
            <button key={d} className={`day-pill ${d === selectedDay ? 'active' : ''}`} onClick={() => onSelectDay(d)}>
              {d.replace('2026-', '')}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-body">
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" vertical={false} />
              <XAxis dataKey="hour" stroke="#2d3748" tick={{ fill: '#4a5568', fontSize: 11 }} />
              <YAxis yAxisId="mw" stroke="#2d3748" tick={{ fill: '#4a5568', fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} width={42} />
              <YAxis yAxisId="err" orientation="right" stroke="#2d3748" tick={{ fill: '#4a5568', fontSize: 11 }} tickFormatter={v => `${v > 0 ? '+' : ''}${Math.round(v/100)/10}k`} width={46} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={v => <span style={{ fontSize: 11, color: '#8b9dc3' }}>{v}</span>}
                wrapperStyle={{ paddingTop: 12 }}
              />
              <ReferenceLine yAxisId="err" y={0} stroke="#273450" strokeDasharray="4 4" />
              <Bar yAxisId="err" dataKey="overMW"  name="Shortfall (over-fc)"  fill="#f59e0b" opacity={0.55} radius={[2,2,0,0]} />
              <Bar yAxisId="err" dataKey="underMW" name="Surplus (under-fc)"   fill="#10b981" opacity={0.45} radius={[2,2,0,0]} />
              <Line yAxisId="mw" type="monotone" dataKey="actual"   name="Actual (MW)"   stroke="#06b6d4" strokeWidth={2.5} dot={{ r:2.5, fill:'#06b6d4', strokeWidth:0 }} activeDot={{ r:5 }} />
              <Line yAxisId="mw" type="monotone" dataKey="forecast" name="Forecast (MW)"  stroke="#818cf8" strokeWidth={2.5} strokeDasharray="5 3" dot={{ r:2.5, fill:'#818cf8', strokeWidth:0 }} activeDot={{ r:5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Audit log */}
        {showAudit && (
          <div className="animate-in" style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16, overflow: 'auto' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Forecast Version Audit Log
              </span>
              <span style={{ fontSize: 11, color: 'var(--emerald)', fontFamily: 'var(--mono)' }}>
                All publishTime ≤ D-1 {cutoff} — zero look-ahead leakage ✓
              </span>
            </div>
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Delivery Time</th><th>Actual (MW)</th><th>Forecast (MW)</th>
                  <th>Error (MW)</th><th>publishTime (UTC)</th><th>Lead Time</th><th>Leakage</th>
                </tr>
              </thead>
              <tbody>
                {dayData.series.map(row => {
                  const pubStr = new Date(row.publishTime).toLocaleString('en-GB', { timeZone: 'UTC', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) + ' UTC';
                  return (
                    <tr key={row.startTime}>
                      <td>{new Date(row.startTime).toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}</td>
                      <td style={{ color: 'var(--cyan)' }}>{row.actual.toLocaleString()}</td>
                      <td style={{ color: 'var(--indigo)' }}>{row.forecast.toLocaleString()}</td>
                      <td className={row.error > 0 ? 'val-over' : 'val-under'}>
                        {row.error > 0 ? '+' : ''}{row.error.toLocaleString()}
                      </td>
                      <td>{pubStr}</td>
                      <td>{row.lead_time_hours}h</td>
                      <td className="val-ok">✓ Valid</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
