import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Line, 
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
    <div className="card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-base font-semibold text-white">
              Diurnal Error Profile (Hour of Day 00:00 – 23:00 London)
            </h3>
            <p className="text-xs text-text-secondary">
              Reveals systematic forecast bias and uncertainty patterns during morning ramp and evening peak demand
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded bg-bg-surface-elevated border border-border-subtle flex items-center gap-1.5 text-text-secondary">
            <Sun className="w-3.5 h-3.5 text-amber-400" /> Morning Ramp: 07:00–10:00
          </span>
          <span className="px-2.5 py-1 rounded bg-bg-surface-elevated border border-border-subtle flex items-center gap-1.5 text-text-secondary">
            <Moon className="w-3.5 h-3.5 text-indigo-400" /> Evening Peak: 17:00–20:00
          </span>
        </div>
      </div>

      <div className="h-72 w-full pt-2">
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
                    <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 shadow-xl text-xs space-y-1.5 min-w-[200px]">
                      <p className="font-semibold text-white border-b border-border-subtle pb-1">
                        Hour: {label} London Time
                      </p>
                      <div className="flex justify-between">
                        <span className="text-cyan-400">MAE:</span>
                        <span className="font-mono font-bold text-white">{d.mae} MW</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-400">Bias (Mean Error):</span>
                        <span className={`font-mono font-bold ${d.bias > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {d.bias > 0 ? `+${d.bias}` : d.bias} MW
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-400">P90 Risk Buffer:</span>
                        <span className="font-mono font-bold text-white">{d.buffer_p90} MW</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-text-muted pt-1 border-t border-border-subtle/40">
                        <span>Avg Wind Actual:</span>
                        <span className="font-mono text-cyan-300">{d.mean_actual.toLocaleString()} MW</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="3 3" />

            <Bar 
              dataKey="mae" 
              name="Hourly MAE (MW)" 
              fill="#06b6d4" 
              opacity={0.8} 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="buffer_p90" 
              name="Hourly P90 Buffer (MW)" 
              fill="#f59e0b" 
              opacity={0.7} 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-text-muted">
        Desk Implication: Higher forecast errors during peak hours (17:00–20:00) compound commercial risk because wholesale system imbalance prices typically spike during these intervals.
      </p>
    </div>
  );
};
