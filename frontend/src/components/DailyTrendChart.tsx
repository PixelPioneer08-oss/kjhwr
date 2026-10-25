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
    return {
      ...d,
      dateFormatted: formatted,
    };
  });

  return (
    <div className="card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-base font-semibold text-white">
              Daily Accuracy & Energy Volume Shortfall Trend
            </h3>
            <p className="text-xs text-text-secondary">
              Chronological day-by-day evaluation across delivery days. Click any bar to inspect that day in detail above.
            </p>
          </div>
        </div>
      </div>

      <div className="h-72 w-full pt-2">
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
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as DailyMetric & { dateFormatted: string };
                  const isCurrent = d.date === selectedDay;
                  return (
                    <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 shadow-xl text-xs space-y-1.5 min-w-[220px]">
                      <div className="flex items-center justify-between border-b border-border-subtle pb-1">
                        <span className="font-semibold text-white">Delivery: {d.date}</span>
                        {isCurrent && <span className="text-[10px] text-cyan-400 font-mono">SELECTED</span>}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-400">Daily MAE:</span>
                        <span className="font-mono font-bold text-white">{d.mae} MW</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-rose-400">Over-Forecast Shortfall:</span>
                        <span className="font-mono font-bold text-white">{Math.round(d.total_overforecast_mwh).toLocaleString()} MWh</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-400">Daily P90 Buffer:</span>
                        <span className="font-mono font-bold text-white">{d.buffer_p90} MW</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-text-muted pt-1 border-t border-border-subtle/40">
                        <span>Daily Bias:</span>
                        <span className={`font-mono ${d.bias > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {d.bias > 0 ? `+${d.bias}` : d.bias} MW
                        </span>
                      </div>
                      <p className="text-[10px] text-cyan-400/80 pt-1 italic">
                        Click to view detailed hourly profile
                      </p>
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
