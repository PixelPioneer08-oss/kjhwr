import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { TrendingDown, Info, HelpCircle } from 'lucide-react';
import { HorizonPoint } from '../types';

interface LeadTimeCurveProps {
  curveData: HorizonPoint[];
  currentLeadTime: number;
  isLoading: boolean;
}

export const LeadTimeCurve: React.FC<LeadTimeCurveProps> = ({ 
  curveData, 
  currentLeadTime, 
  isLoading 
}) => {
  // Find reference points
  const pIntraday = curveData.find((p) => p.horizon_hours === 4);
  const pDayAhead = curveData.find((p) => Math.round(p.horizon_hours) === Math.round(currentLeadTime)) || 
                    curveData.find((p) => p.horizon_hours === 24);

  const accuracyLoss = pDayAhead && pIntraday && pIntraday.mae > 0
    ? Math.round(((pDayAhead.mae - pIntraday.mae) / pIntraday.mae) * 100)
    : 0;

  return (
    <div className="card space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-base font-semibold text-white">
              Forecast Degradation vs Decision Lead Time (1h – 48h)
            </h3>
            <p className="text-xs text-text-secondary">
              Evaluates quantitative error increase as purchase decisions are made further in advance of delivery
            </p>
          </div>
        </div>

        {pDayAhead && pIntraday && (
          <div className="px-3 py-1.5 rounded-lg bg-bg-surface-elevated border border-border-subtle text-xs">
            <span className="text-text-muted">Day-Ahead vs 4h Intraday Loss: </span>
            <span className="font-mono font-bold text-amber-400">+{accuracyLoss}% MAE</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="h-72 flex items-center justify-center text-xs text-text-muted">
          Computing horizon curve for h = 1..48 hours...
        </div>
      ) : (
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curveData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="horizon_hours" 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                unit="h"
              />
              <YAxis 
                stroke="#64748b" 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                unit=" MW"
                width={70}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as HorizonPoint;
                    return (
                      <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 shadow-xl text-xs space-y-1.5 min-w-[200px]">
                        <p className="font-semibold text-white border-b border-border-subtle pb-1">
                          Decision Lead Time: {label} Hours Ahead
                        </p>
                        <div className="flex justify-between">
                          <span className="text-cyan-400">MAE:</span>
                          <span className="font-mono font-bold text-white">{data.mae} MW</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-indigo-400">RMSE:</span>
                          <span className="font-mono font-bold text-white">{data.rmse} MW</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-400">P90 Risk Buffer:</span>
                          <span className="font-mono font-bold text-white">{data.buffer_p90} MW</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-text-muted pt-1 border-t border-border-subtle/50">
                          <span>Evaluated Sample Size:</span>
                          <span className="font-mono text-text-secondary">{data.n} points</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              
              {currentLeadTime > 0 && (
                <ReferenceLine 
                  x={Math.round(currentLeadTime)} 
                  stroke="#f59e0b" 
                  strokeDasharray="4 4"
                  label={{ 
                    value: `Avg Day-Ahead Gate (~${Math.round(currentLeadTime)}h)`, 
                    fill: '#f59e0b', 
                    fontSize: 10,
                    position: 'top'
                  }} 
                />
              )}

              <Line 
                type="monotone" 
                dataKey="mae" 
                name="MAE (MW)" 
                stroke="#06b6d4" 
                strokeWidth={2.5} 
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="rmse" 
                name="RMSE (MW)" 
                stroke="#818cf8" 
                strokeWidth={2} 
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="buffer_p90" 
                name="P90 Risk Buffer (MW)" 
                stroke="#f59e0b" 
                strokeWidth={2} 
                strokeDasharray="5 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
        <div className="p-2.5 rounded-lg bg-bg-surface-elevated/40 border border-border-subtle">
          <span className="font-semibold text-text-primary block">Intraday Trading (1-4h ahead)</span>
          <p className="text-[11px] text-text-muted mt-1">
            Short-term numerical weather prediction has updated ramp timing; lowest MAE ({pIntraday?.mae ?? 800} MW) and minimum risk buffer required.
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-bg-surface-elevated/40 border border-border-subtle">
          <span className="font-semibold text-amber-300 block">Day-Ahead Gate (~24-30h ahead)</span>
          <p className="text-[11px] text-text-muted mt-1">
            Current auction commitment window. Forecast error rises significantly due to weather front uncertainty, requiring a larger P90 buffer.
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-bg-surface-elevated/40 border border-border-subtle">
          <span className="font-semibold text-text-primary block">Value of Flexibility</span>
          <p className="text-[11px] text-text-muted mt-1">
            Quantifies the commercial option value of holding non-wind reserve back from the day-ahead auction to trade in intraday markets.
          </p>
        </div>
      </div>
    </div>
  );
};
