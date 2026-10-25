import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { CalendarDays } from 'lucide-react';
import { DailyMetric } from '../types';

interface DailyTrendChartProps {
  dailyMetrics: DailyMetric[];
  onSelectDay: (date: string) => void;
  selectedDay: string;
}

export const DailyTrendChart: React.FC<DailyTrendChartProps> = ({
  dailyMetrics,
  onSelectDay,
  selectedDay
}) => {
  const data = dailyMetrics.map((d) => {
    const formatted = new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' });
    return { ...d, dateFormatted: formatted };
  });

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
            <CalendarDays size={18} color="var(--cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>
              Daily Accuracy &amp; Energy Volume Shortfall Trend
            </h3>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
              Day-by-day evaluation across all delivery days. <span style={{ color: 'var(--cyan)' }}>Click any bar</span> to inspect that day in detail.
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 288, width: '100%', cursor: 'pointer' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload.length) {
                const clickedDate = state.activePayload[0].payload.date;
                if (clickedDate) onSelectDay(clickedDate);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="dateFormatted"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="mae"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              unit=" MW"
              width={65}
            />
            <YAxis
              yAxisId="volume"
              orientation="right"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              unit=" MWh"
              width={75}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as DailyMetric & { dateFormatted: string };
                  const isCurrent = d.date === selectedDay;
                  return (
                    <div style={{
                      background: '#0f172a', border: `1px solid ${isCurrent ? 'var(--cyan)' : '#334155'}`,
                      borderRadius: 10, padding: '10px 14px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                      fontSize: 11, minWidth: 220,
                      display: 'flex', flexDirection: 'column', gap: 5,
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        paddingBottom: 5, borderBottom: '1px solid #334155', marginBottom: 2,
                      }}>
                        <span style={{ fontWeight: 600, color: '#fff' }}>Delivery: {d.date}</span>
                        {isCurrent && <span style={{ fontSize: 10, color: 'var(--cyan)', fontFamily: 'var(--mono)' }}>SELECTED</span>}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--cyan)' }}>Daily MAE:</span>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: '#fff' }}>{d.mae} MW</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--rose)' }}>Over-Forecast Shortfall:</span>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: '#fff' }}>{Math.round(d.total_overforecast_mwh).toLocaleString()} MWh</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--amber)' }}>Daily P90 Buffer:</span>
                        <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: '#fff' }}>{d.buffer_p90} MW</span>
                      </div>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        paddingTop: 4, borderTop: '1px solid rgba(51,65,85,0.4)', fontSize: 10, color: 'var(--text-muted)',
                      }}>
                        <span>Daily Bias:</span>
                        <span style={{ fontFamily: 'var(--mono)', color: d.bias > 0 ? 'var(--amber)' : 'var(--emerald)' }}>
                          {d.bias > 0 ? `+${d.bias}` : d.bias} MW
                        </span>
                      </div>
                      <p style={{ fontSize: 10, color: 'rgba(6,182,212,0.8)', fontStyle: 'italic' }}>Click to view detailed hourly profile</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            <Bar
              yAxisId="volume"
              dataKey="total_overforecast_mwh"
              name="Over-Forecast Energy Shortfall (MWh)"
              fill="#f43f5e"
              opacity={0.65}
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="mae"
              type="monotone"
              dataKey="mae"
              name="Daily MAE (MW)"
              stroke="#06b6d4"
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: '#06b6d4' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
