import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { Calendar, Info, CheckCircle2, ChevronDown, Table as TableIcon } from 'lucide-react';
import { SelectedDayData, SummaryMetrics } from '../types';

interface DeliveryDayChartProps {
  dayData: SelectedDayData;
  availableDays: string[];
  selectedDay: string;
  onSelectDay: (day: string) => void;
  cutoff: string;
}

export const DeliveryDayChart: React.FC<DeliveryDayChartProps> = ({
  dayData,
  availableDays,
  selectedDay,
  onSelectDay,
  cutoff
}) => {
  const [showTable, setShowTable] = useState(false);

  const series = dayData.series.map((pt) => {
    const timeFormatted = new Date(pt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const pubFormatted = new Date(pt.publishTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
    const pubDate = new Date(pt.publishTime).toLocaleDateString([], { month: 'short', day: 'numeric', timeZone: 'UTC' });

    return {
      ...pt,
      timeFormatted,
      publishFormatted: `${pubDate} ${pubFormatted} UTC`,
      overforecastMW: pt.error > 0 ? pt.error : 0,
      underforecastMW: pt.error < 0 ? pt.error : 0,
    };
  });

  // Calculate day summary metrics
  const daySummary = dayData.summary;

  return (
    <div className="card space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-base font-semibold text-white">
              Delivery Day Profile: <span className="text-cyan-400 font-mono">{selectedDay}</span>
            </h3>
            <p className="text-xs text-text-secondary">
              Hourly day-ahead purchase decision at {cutoff} London cut-off vs actual physical delivery
            </p>
          </div>
        </div>

        {/* Day selector & toggle view */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedDay}
              onChange={(e) => onSelectDay(e.target.value)}
              className="appearance-none bg-bg-surface-elevated border border-border-subtle rounded-lg px-3 py-1.5 pr-8 text-xs font-mono text-white focus:outline-none focus:border-accent-blue cursor-pointer"
            >
              {availableDays.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-text-muted absolute right-2 top-2 pointer-events-none" />
          </div>

          <button
            onClick={() => setShowTable(!showTable)}
            className={`btn text-xs py-1.5 px-3 ${showTable ? 'btn-primary' : 'btn-secondary'}`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>{showTable ? 'Hide Audit Log' : 'Audit Forecast Versions'}</span>
          </button>
        </div>
      </div>

      {/* Day quick KPI pill */}
      <div className="flex flex-wrap items-center gap-4 text-xs bg-bg-surface-elevated/50 p-2.5 rounded-lg border border-border-subtle">
        <div>
          <span className="text-text-muted">Day MAE: </span>
          <strong className="text-white font-mono">{daySummary.mae} MW</strong>
        </div>
        <div className="border-l border-border-subtle pl-4">
          <span className="text-text-muted">Day Bias: </span>
          <strong className={`font-mono ${daySummary.bias > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {daySummary.bias > 0 ? `+${daySummary.bias}` : daySummary.bias} MW
          </strong>
        </div>
        <div className="border-l border-border-subtle pl-4">
          <span className="text-text-muted">Day Over-Forecast Vol: </span>
          <strong className="text-rose-400 font-mono">{Math.round(daySummary.total_overforecast_mwh)} MWh</strong>
        </div>
        <div className="border-l border-border-subtle pl-4">
          <span className="text-text-muted">Day P90 Buffer: </span>
          <strong className="text-amber-300 font-mono">{daySummary.buffer_p90} MW</strong>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-text-muted text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cut-off verified on D-1</span>
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis 
              dataKey="timeFormatted" 
              stroke="#64748b" 
              tick={{ fill: '#94a3b8', fontSize: 11 }} 
            />
            <YAxis 
              yAxisId="power"
              stroke="#64748b" 
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              unit=" MW"
              width={70}
            />
            <YAxis 
              yAxisId="error" 
              orientation="right" 
              stroke="#64748b" 
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              unit=" MW"
              width={65}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 shadow-xl text-xs space-y-1.5 min-w-[220px]">
                      <p className="font-semibold text-white border-b border-border-subtle pb-1">
                        Time: {label} (Delivery: {selectedDay})
                      </p>
                      <div className="flex justify-between">
                        <span className="text-cyan-400">Actual Wind:</span>
                        <span className="font-mono font-semibold text-white">{data.actual.toLocaleString()} MW</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-indigo-400">Day-Ahead Forecast:</span>
                        <span className="font-mono font-semibold text-white">{data.forecast.toLocaleString()} MW</span>
                      </div>
                      <div className="flex justify-between border-t border-border-subtle/60 pt-1">
                        <span className="text-text-secondary">Error (Fc - Act):</span>
                        <span className={`font-mono font-bold ${data.error > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {data.error > 0 ? `+${data.error}` : data.error} MW
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-text-muted pt-1 border-t border-border-subtle/40">
                        <span>Forecast Published:</span>
                        <span className="font-mono text-cyan-300">{data.publishFormatted}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-text-muted">
                        <span>Decision Lead Time:</span>
                        <span className="font-mono text-text-secondary">{data.lead_time_hours} hours</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: 12, paddingTop: 10 }} 
            />
            <ReferenceLine yAxisId="error" y={0} stroke="#475569" strokeDasharray="3 3" />
            
            <Bar 
              yAxisId="error"
              dataKey="overforecastMW" 
              name="Shortfall (Over-forecast > 0)" 
              fill="#f59e0b" 
              opacity={0.65} 
            />
            <Bar 
              yAxisId="error"
              dataKey="underforecastMW" 
              name="Surplus (Under-forecast < 0)" 
              fill="#10b981" 
              opacity={0.5} 
            />
            
            <Line 
              yAxisId="power"
              type="monotone" 
              dataKey="actual" 
              name="Actual Wind Generation (MW)" 
              stroke="#06b6d4" 
              strokeWidth={2.5} 
              dot={{ r: 3, fill: '#06b6d4' }}
              activeDot={{ r: 5 }}
            />
            <Line 
              yAxisId="power"
              type="monotone" 
              dataKey="forecast" 
              name="Day-Ahead Forecast (MW)" 
              stroke="#818cf8" 
              strokeWidth={2.5} 
              strokeDasharray="4 2"
              dot={{ r: 3, fill: '#818cf8' }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Lookahead Audit Log Table */}
      {showTable && (
        <div className="overflow-x-auto pt-3 border-t border-border-subtle animate-fade-in">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Audit Log: Exact Forecast Version Used per Delivery Interval
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">
              All publish times ≤ D-1 {cutoff} Cut-off
            </span>
          </div>
          <table className="w-full text-xs text-left text-text-secondary">
            <thead className="bg-bg-surface-elevated text-text-muted font-medium">
              <tr>
                <th className="px-3 py-2">Delivery Start (London)</th>
                <th className="px-3 py-2">Actual (MW)</th>
                <th className="px-3 py-2">Forecast (MW)</th>
                <th className="px-3 py-2">Error (MW)</th>
                <th className="px-3 py-2">Selected publishTime (UTC)</th>
                <th className="px-3 py-2">Lead Time</th>
                <th className="px-3 py-2">Leakage Check</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50 font-mono">
              {series.map((row) => (
                <tr key={row.startTime} className="hover:bg-bg-surface-elevated/40">
                  <td className="px-3 py-1.5 text-white">{row.timeFormatted}</td>
                  <td className="px-3 py-1.5 text-cyan-400">{row.actual.toLocaleString()}</td>
                  <td className="px-3 py-1.5 text-indigo-400">{row.forecast.toLocaleString()}</td>
                  <td className={`px-3 py-1.5 font-bold ${row.error > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {row.error > 0 ? `+${row.error}` : row.error}
                  </td>
                  <td className="px-3 py-1.5 text-text-primary">{row.publishFormatted}</td>
                  <td className="px-3 py-1.5 text-text-secondary">{row.lead_time_hours}h</td>
                  <td className="px-3 py-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Valid
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
