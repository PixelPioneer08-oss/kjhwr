import React from 'react';
import { Calendar, Clock, Filter, Sliders, Info, Zap } from 'lucide-react';
import { AnalysisParams } from '../api';

interface ControlsProps {
  params: AnalysisParams;
  onChange: (updated: Partial<AnalysisParams>) => void;
  isLoading: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ params, onChange, isLoading }) => {
  const currentMode = params.mode || 'gate';
  const currentCutoff = params.cutoff || '09:20';
  const currentHorizon = params.horizon_hours ?? 24;

  const handleCutoffPreset = (val: string) => {
    onChange({ cutoff: val });
  };

  const handleDatePreset = (from: string, to: string) => {
    onChange({ decision_from: from, decision_to: to });
  };

  return (
    <div className="card space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-text-primary">
            Market Cut-Off & Decision Parameters
          </h2>
        </div>

        {/* Mode switch */}
        <div className="flex items-center bg-bg-surface-elevated p-1 rounded-lg border border-border-subtle">
          <button
            onClick={() => onChange({ mode: 'gate' })}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              currentMode === 'gate'
                ? 'bg-blue-600 text-white shadow'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Day-Ahead Gate Cut-off (D-1)
          </button>
          <button
            onClick={() => onChange({ mode: 'horizon' })}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              currentMode === 'horizon'
                ? 'bg-blue-600 text-white shadow'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Fixed Lead Time (Horizon)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Decision Date Window */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-text-secondary flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Decision Window (Day D-1)
            </span>
            <span className="text-[11px] text-text-muted">Jan 2026 Target</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={params.decision_from || '2026-01-01'}
              min="2025-12-31"
              max="2026-02-01"
              onChange={(e) => onChange({ decision_from: e.target.value })}
              className="bg-bg-surface-elevated border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-blue w-full font-mono"
            />
            <span className="text-text-muted text-xs">to</span>
            <input
              type="date"
              value={params.decision_to || '2026-01-31'}
              min="2026-01-01"
              max="2026-02-01"
              onChange={(e) => onChange({ decision_to: e.target.value })}
              className="bg-bg-surface-elevated border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-blue w-full font-mono"
            />
          </div>
          {/* Presets */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <button
              onClick={() => handleDatePreset('2026-01-01', '2026-01-31')}
              className="text-[11px] px-2 py-0.5 rounded bg-bg-surface-elevated hover:bg-bg-surface-hover text-text-secondary border border-border-subtle"
            >
              Full Jan (31d)
            </button>
            <button
              onClick={() => handleDatePreset('2026-01-01', '2026-01-07')}
              className="text-[11px] px-2 py-0.5 rounded bg-bg-surface-elevated hover:bg-bg-surface-hover text-text-secondary border border-border-subtle"
            >
              Week 1
            </button>
            <button
              onClick={() => handleDatePreset('2026-01-08', '2026-01-14')}
              className="text-[11px] px-2 py-0.5 rounded bg-bg-surface-elevated hover:bg-bg-surface-hover text-text-secondary border border-border-subtle"
            >
              Week 2
            </button>
            <button
              onClick={() => handleDatePreset('2026-01-15', '2026-01-21')}
              className="text-[11px] px-2 py-0.5 rounded bg-bg-surface-elevated hover:bg-bg-surface-hover text-text-secondary border border-border-subtle"
            >
              Week 3
            </button>
            <button
              onClick={() => handleDatePreset('2026-01-22', '2026-01-31')}
              className="text-[11px] px-2 py-0.5 rounded bg-bg-surface-elevated hover:bg-bg-surface-hover text-text-secondary border border-border-subtle"
            >
              Week 4+
            </button>
          </div>
          <p className="text-[11px] text-text-muted">
            Deliveries: {params.decision_from ? new Date(params.decision_from).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'Jan 1'} + 1d → {params.decision_to ? new Date(params.decision_to).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'Jan 31'} + 1d
          </p>
        </div>

        {/* Gate Closure Cut-off or Horizon Selection */}
        {currentMode === 'gate' ? (
          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs font-medium text-text-secondary flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Gate Closure Cut-off Time (London Time on Day D-1)
              </span>
              <span className="text-[11px] text-text-muted">Strict look-ahead isolation</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleCutoffPreset('09:20')}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                  currentCutoff === '09:20'
                    ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-semibold'
                    : 'bg-bg-surface-elevated border-border-subtle text-text-secondary hover:text-white'
                }`}
              >
                EPEX GB (09:20) <span className="text-[10px] opacity-75">• Default</span>
              </button>
              <button
                onClick={() => handleCutoffPreset('09:50')}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                  currentCutoff === '09:50'
                    ? 'bg-blue-950 border-blue-500 text-blue-300 font-semibold'
                    : 'bg-bg-surface-elevated border-border-subtle text-text-secondary hover:text-white'
                }`}
              >
                N2EX (09:50)
              </button>
              <button
                onClick={() => handleCutoffPreset('11:00')}
                className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                  currentCutoff === '11:00'
                    ? 'bg-amber-950 border-amber-500 text-amber-300 font-semibold'
                    : 'bg-bg-surface-elevated border-border-subtle text-text-secondary hover:text-white'
                }`}
              >
                Legacy 11:00 <span className="text-[10px] text-amber-400 font-semibold">⚠️ Outdated</span>
              </button>

              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs text-text-muted">Custom:</span>
                <input
                  type="time"
                  value={currentCutoff}
                  onChange={(e) => onChange({ cutoff: e.target.value })}
                  className="bg-bg-surface-elevated border border-border-subtle rounded-lg px-2 py-1 text-xs text-text-primary font-mono focus:outline-none focus:border-accent-blue"
                />
              </div>
            </div>
            <p className="text-[11px] text-text-muted flex items-center gap-1">
              <Info className="w-3 h-3 text-cyan-500 inline shrink-0" />
              Only forecasts published at or before {currentCutoff} London time on D-1 are permitted. Post-cutoff forecasts are strictly discarded.
            </p>
          </div>
        ) : (
          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs font-medium text-text-secondary flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                Fixed Lead Time Horizon (h hours ahead of each delivery interval)
              </span>
              <span className="font-mono text-cyan-400 text-xs font-semibold">{currentHorizon} Hours Ahead</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="48"
                step="1"
                value={currentHorizon}
                onChange={(e) => onChange({ horizon_hours: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 h-2 bg-bg-surface-elevated rounded-lg cursor-pointer"
              />
              <span className="font-mono text-sm px-3 py-1 rounded bg-bg-surface-elevated border border-border-subtle text-white min-w-[60px] text-center">
                {currentHorizon}h
              </span>
            </div>
            <p className="text-[11px] text-text-muted">
              Evaluates latest forecast published at least {currentHorizon} hours prior to target delivery time. Allows comparing intraday vs day-ahead value.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
