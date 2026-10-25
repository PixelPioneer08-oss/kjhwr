import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Clock, Sun, Moon } from 'lucide-react';
import { HourlyMetric } from '../types';

interface DiurnalChartProps {
  hourlyMetrics: HourlyMetric[];
}

export const DiurnalChart: React.FC<DiurnalChartProps> = ({ hourlyMetrics }) => {
  const data = hourlyMetrics.map((h) => ({
    ...h,
    hourLabel: `${h.hour.toString().padStart(2, '0')}:00`,
    overforecastBias: h.bias > 0 ? h.bias : 0,
    underforecastBias: h.bias < 0 ? h.bias : 0,
  }));

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            <Clock size={18} color="var(--cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>
              Diurnal Error Profile — Hour of Day (00:00–23:00 London)
            </h3>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              Reveals systematic forecast bias and uncertainty patterns during morning ramp and evening peak
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 6,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            fontSize: 11, color: 'var(--text-secondary)',
          }}>
            <Sun size={13} color="var(--amber)" />
            Morning Ramp: 07:00–10:00
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 6,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            fontSize: 11, color: 'var(--text-secondary)',
          }}>
            <Moon size={13} color="var(--indigo)" />
            Evening Peak: 17:00–20:00
          </span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 288, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="hourLabel"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              unit=" MW"
              width={65}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as HourlyMetric;
                  return (
                    <div style={{
                      background: '#0f172a', border: '1px solid #334155',
                      borderRadius: 10, padding: '10px 14px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                      fontSize: 11, minWidth: 200,
                      display: 'flex', flexDirection: 'column', gap: 5,
                    }}>
                      <p style={{ fontWeight: 600, color: '#fff', marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid #334155' }}>
                        Hour: {label} London Time
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--cyan)' }}>MAE:</span>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: '#fff' }}>{d.mae} MW</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--blue)' }}>Bias (Mean Error):</span>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: d.bias > 0 ? 'var(--amber)' : 'var(--emerald)' }}>
                          {d.bias > 0 ? `+${d.bias}` : d.bias} MW
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--amber)' }}>P90 Risk Buffer:</span>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: '#fff' }}>{d.buffer_p90} MW</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px solid rgba(51,65,85,0.4)', fontSize: 10, color: 'var(--text-muted)' }}>
                        <span>Avg Wind Actual:</span>
                        <span style={{ fontFamily: 'var(--mono)', color: '#67e8f9' }}>{d.mean_actual.toLocaleString()} MW</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />
            <Bar dataKey="mae" name="Hourly MAE (MW)" fill="#06b6d4" opacity={0.85} radius={[4, 4, 0, 0]} />
            <Bar dataKey="buffer_p90" name="Hourly P90 Buffer (MW)" fill="#f59e0b" opacity={0.75} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        <strong style={{ color: 'var(--text-secondary)' }}>Desk implication:</strong> Higher forecast errors during peak hours (17:00–20:00) compound commercial risk because wholesale system imbalance prices typically spike during these intervals.
      </p>
    </div>
  );
};
