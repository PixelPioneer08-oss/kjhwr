import React, { useState } from 'react';
import { Calculator, ShieldCheck, AlertCircle, ArrowRight, Zap, Flame } from 'lucide-react';
import { SummaryMetrics, SelectedDayData } from '../types';

interface WhatIfToolProps {
  summary: SummaryMetrics;
  dayData: SelectedDayData;
}

export const WhatIfTool: React.FC<WhatIfToolProps> = ({ summary, dayData }) => {
  const [demandMW, setDemandMW] = useState<number>(25000);
  const [useDaySpecific, setUseDaySpecific] = useState<boolean>(true);

  // Wind forecast basis
  const windForecastMW = useDaySpecific ? dayData.summary.mean_forecast : summary.mean_forecast;
  const p90BufferMW = useDaySpecific ? dayData.summary.buffer_p90 : summary.buffer_p90;

  // Unadjusted procurement: demand - forecast
  const unadjustedProcure = Math.max(0, demandMW - windForecastMW);

  // Risk-adjusted wind: forecast - buffer_P90
  const riskAdjustedWind = Math.max(0, windForecastMW - p90BufferMW);

  // Risk-adjusted procurement: demand - (forecast - buffer_P90)
  const riskAdjustedProcure = Math.max(0, demandMW - riskAdjustedWind);

  // Additional thermal / non-wind buffer
  const additionalBuffer = riskAdjustedProcure - unadjustedProcure;

  return (
    <div className="card space-y-4 border-cyan-800/50 bg-gradient-to-b from-bg-surface to-bg-surface-elevated/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-cyan-400" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">
                What-If Day-Ahead Procurement Calculator
              </h3>
              <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-semibold uppercase">
                Illustrative Simulator
              </span>
            </div>
            <p className="text-xs text-text-secondary">
              Calculate the risk-adjusted non-wind procurement required to protect consumer demand against wind forecast error
            </p>
          </div>
        </div>

        {/* Toggle day vs window */}
        <div className="flex items-center bg-bg-surface-elevated p-1 rounded-lg border border-border-subtle text-xs">
          <button
            onClick={() => setUseDaySpecific(true)}
            className={`px-2.5 py-1 rounded transition ${
              useDaySpecific ? 'bg-cyan-900 text-cyan-200 font-medium' : 'text-text-muted hover:text-white'
            }`}
          >
            Day ({dayData.date})
          </button>
          <button
            onClick={() => setUseDaySpecific(false)}
            className={`px-2.5 py-1 rounded transition ${
              !useDaySpecific ? 'bg-cyan-900 text-cyan-200 font-medium' : 'text-text-muted hover:text-white'
            }`}
          >
            Window Average
          </button>
        </div>
      </div>

      {/* Demand Input slider */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-1">
        <div className="space-y-3 lg:col-span-1 border-r border-border-subtle pr-4">
          <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
            Client Consumer Demand (MW)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="10000"
              max="45000"
              step="500"
              value={demandMW}
              onChange={(e) => setDemandMW(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 h-2 bg-bg-surface-elevated rounded-lg cursor-pointer"
            />
            <span className="font-mono text-sm px-3 py-1.5 rounded-lg bg-bg-surface-elevated border border-border-subtle text-white font-bold min-w-[95px] text-center">
              {demandMW.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-text-muted">
            <span>Min: 10,000 MW</span>
            <span>Typical GB: ~28,000 MW</span>
            <span>Max: 45,000 MW</span>
          </div>

          <div className="pt-2 text-xs text-text-secondary space-y-1">
            <div className="flex justify-between">
              <span>Expected Wind:</span>
              <span className="font-mono font-semibold text-cyan-400">
                {Math.round(windForecastMW).toLocaleString()} MW
              </span>
            </div>
            <div className="flex justify-between">
              <span>Applied P90 Buffer:</span>
              <span className="font-mono font-semibold text-amber-400">
                {Math.round(p90BufferMW).toLocaleString()} MW
              </span>
            </div>
          </div>
        </div>

        {/* Calculation Flow & Output */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Baseline Card */}
          <div className="bg-bg-surface-elevated/60 border border-border-subtle rounded-xl p-4 space-y-2">
            <span className="text-xs font-medium text-text-muted flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-text-muted" />
              Unadjusted Procurement (Zero Buffer)
            </span>
            <p className="text-2xl font-bold font-mono text-white">
              {Math.round(unadjustedProcure).toLocaleString()}{' '}
              <span className="text-sm font-normal text-text-secondary">MW</span>
            </p>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Formula: <code className="text-cyan-300 font-mono">Demand - Wind Forecast</code>. Assumes wind will generate 100% of forecast. If wind underperforms, utility faces real-time imbalance penalties.
            </p>
          </div>

          {/* Risk-Adjusted Card */}
          <div className="bg-gradient-to-br from-cyan-950/40 via-bg-surface-elevated to-bg-surface-elevated border border-cyan-500/40 rounded-xl p-4 space-y-2 shadow-lg shadow-cyan-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Risk-Adjusted Procurement (P90)
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 text-[10px] font-mono border border-cyan-700/60">
                90% Protection
              </span>
            </div>
            <p className="text-2xl font-bold font-mono text-cyan-300">
              {Math.round(riskAdjustedProcure).toLocaleString()}{' '}
              <span className="text-sm font-normal text-text-secondary">MW</span>
            </p>
            <p className="text-[11px] text-text-secondary leading-relaxed">
              Formula: <code className="text-cyan-300 font-mono">Demand - (Forecast - Buffer_P90)</code>. Hedged such that wind plus non-wind meets demand in ~90% of intervals.
            </p>
          </div>

          {/* Buffer Delta Note */}
          <div className="sm:col-span-2 bg-amber-950/30 border border-amber-800/40 rounded-lg p-3 flex items-start gap-3">
            <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-amber-300">
                Recommended Non-Wind Reserve Commitment: +{Math.round(additionalBuffer).toLocaleString()} MW
              </span>
              <p className="text-text-secondary mt-0.5">
                Procuring this extra {Math.round(additionalBuffer).toLocaleString()} MW of thermal/flexible supply in the day-ahead auction prevents exposing the utility to the highly volatile UK Cash-Out Imbalance Settlement prices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
