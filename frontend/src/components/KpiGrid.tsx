import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  TrendingUp, 
  Percent, 
  Clock, 
  Zap, 
  AlertCircle, 
  Layers, 
  Scale,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { SummaryMetrics } from '../types';

interface KpiGridProps {
  summary: SummaryMetrics;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ summary }) => {
  const isOverforecastBiased = summary.bias > 0;

  return (
    <div className="space-y-4">
      {/* Primary Hero Row: Risk Buffer & Key Error */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* P90 Risk Buffer Card */}
        <div className="card relative overflow-hidden bg-gradient-to-br from-amber-950/40 via-bg-surface to-bg-surface border-amber-600/40 shadow-lg shadow-amber-950/20">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                P90 Risk Buffer
              </span>
              <p className="text-2xl lg:text-3xl font-bold font-mono text-white mt-1">
                {summary.buffer_p90.toLocaleString()} <span className="text-sm font-normal text-text-secondary">MW</span>
              </p>
            </div>
            <span className="px-2 py-1 rounded bg-amber-900/60 text-amber-300 text-[11px] font-mono border border-amber-700/60">
              90% Conf.
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-2 leading-relaxed">
            Assume wind is up to <span className="font-semibold text-amber-300">{summary.buffer_p90} MW</span> below forecast to be ~90% sure wind won't fall short.
          </p>
          <div className="mt-2 pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-muted">
            <span>P95 Buffer: <strong className="text-text-secondary font-mono">{summary.buffer_p95.toLocaleString()} MW</strong></span>
            <span>Median (P50): <strong className="text-text-secondary font-mono">{summary.error_percentiles.p50} MW</strong></span>
          </div>
        </div>

        {/* MAE Card */}
        <div className="card">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              Mean Absolute Error (MAE)
            </span>
          </div>
          <p className="text-2xl lg:text-3xl font-bold font-mono text-white mt-1">
            {summary.mae.toLocaleString()} <span className="text-sm font-normal text-text-secondary">MW</span>
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
            <span>RMSE: <strong className="text-white font-mono">{summary.rmse.toLocaleString()} MW</strong></span>
            <span>•</span>
            <span>WAPE: <strong className="text-white font-mono">{summary.wape}%</strong></span>
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            Average magnitude of generation deviation across all {summary.n} evaluated hourly intervals.
          </p>
        </div>

        {/* Bias & Asymmetry Card */}
        <div className="card">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-blue-400" />
              Forecast Bias (Mean Error)
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 ${
              isOverforecastBiased 
                ? 'bg-rose-950/70 text-rose-300 border border-rose-800' 
                : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
            }`}>
              {isOverforecastBiased ? <ArrowUpRight className="w-3 h-3 text-rose-400" /> : <ArrowDownRight className="w-3 h-3 text-emerald-400" />}
              {isOverforecastBiased ? 'Over-Forecast Bias' : 'Under-Forecast Bias'}
            </span>
          </div>
          <p className="text-2xl lg:text-3xl font-bold font-mono text-white mt-1">
            {summary.bias > 0 ? `+${summary.bias.toLocaleString()}` : summary.bias.toLocaleString()}{' '}
            <span className="text-sm font-normal text-text-secondary">MW</span>
          </p>
          <div className="flex items-center justify-between text-xs text-text-secondary mt-2">
            <span>Over-forecast share:</span>
            <strong className="text-amber-400 font-mono font-semibold">{summary.share_overforecast}%</strong>
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            Positive error = wind over-forecast (utility under-buys non-wind, facing cashout shortfall penalties).
          </p>
        </div>

        {/* Total Over-forecast Energy Card */}
        <div className="card">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-rose-400" />
              Total Over-Forecast Volume
            </span>
          </div>
          <p className="text-2xl lg:text-3xl font-bold font-mono text-white mt-1">
            {Math.round(summary.total_overforecast_mwh).toLocaleString()} <span className="text-sm font-normal text-text-secondary">MWh</span>
          </p>
          <div className="flex items-center justify-between text-xs text-text-secondary mt-2">
            <span>Total Actual Wind:</span>
            <strong className="text-white font-mono">{Math.round(summary.total_actual_mwh).toLocaleString()} MWh</strong>
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            Cumulative energy shortfall utility had to procure from balancing reserve or thermal backup.
          </p>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-bg-surface-elevated/70 border border-border-subtle rounded-xl p-3">
          <span className="text-[11px] text-text-muted block">MAPE (≥100 MW)</span>
          <p className="text-lg font-bold font-mono text-white mt-0.5">{summary.mape}%</p>
          <span className="text-[10px] text-text-muted">Avoids small-actual skew</span>
        </div>

        <div className="bg-bg-surface-elevated/70 border border-border-subtle rounded-xl p-3">
          <span className="text-[11px] text-text-muted block">WAPE</span>
          <p className="text-lg font-bold font-mono text-white mt-0.5">{summary.wape}%</p>
          <span className="text-[10px] text-text-muted">Weighted error / actual</span>
        </div>

        <div className="bg-bg-surface-elevated/70 border border-border-subtle rounded-xl p-3">
          <span className="text-[11px] text-text-muted block">Mean Lead Time</span>
          <p className="text-lg font-bold font-mono text-cyan-400 mt-0.5">{summary.mean_lead_time_hours}h</p>
          <span className="text-[10px] text-text-muted">Publish to delivery</span>
        </div>

        <div className="bg-bg-surface-elevated/70 border border-border-subtle rounded-xl p-3">
          <span className="text-[11px] text-text-muted block">P95 Error</span>
          <p className="text-lg font-bold font-mono text-amber-400 mt-0.5">+{summary.error_percentiles.p95} MW</p>
          <span className="text-[10px] text-text-muted">Extreme tail risk</span>
        </div>

        <div className="bg-bg-surface-elevated/70 border border-border-subtle rounded-xl p-3">
          <span className="text-[11px] text-text-muted block">P10 Error</span>
          <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{summary.error_percentiles.p10} MW</p>
          <span className="text-[10px] text-text-muted">Surplus tail (under-fc)</span>
        </div>

        <div className="bg-bg-surface-elevated/70 border border-border-subtle rounded-xl p-3">
          <span className="text-[11px] text-text-muted block">Sample Count (n)</span>
          <p className="text-lg font-bold font-mono text-white mt-0.5">{summary.n}</p>
          <span className="text-[10px] text-text-muted">Exact hourly matches</span>
        </div>
      </div>
    </div>
  );
};
