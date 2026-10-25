import React from 'react';
import { Wind, ShieldCheck, AlertTriangle, BookOpen, Clock, Activity } from 'lucide-react';
import { MetadataResponse } from '../types';

interface HeaderProps {
  metadata: MetadataResponse | null;
  onOpenMethodology: () => void;
}

export const Header: React.FC<HeaderProps> = ({ metadata, onOpenMethodology }) => {
  const isSynthetic = metadata?.is_synthetic ?? false;

  return (
    <header className="border-b border-border-subtle bg-bg-surface/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title & Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/30">
            <Wind className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                GB Wind Day-Ahead Procurement Pilot
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                UK Day-Ahead Desk
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              Elexon BMRS National Wind Generation Actuals (FUELHH) vs WINDFOR Forecasts • January 2026
            </p>
          </div>
        </div>

        {/* Status badges & action */}
        <div className="flex items-center flex-wrap gap-2.5">
          {isSynthetic ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>Notice: Operating in Synthetic Mode</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Real Elexon BMRS Data Verified</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-surface-elevated border border-border-subtle text-text-secondary text-xs">
            <Clock className="w-3.5 h-3.5 text-text-muted" />
            <span>Resolutions: 30m Act / 60m Fc</span>
          </div>

          <button
            onClick={onOpenMethodology}
            className="btn btn-secondary text-xs py-1.5 px-3"
            title="Read regulatory assumptions, gate closure rules, and error convention"
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Method & Assumptions</span>
          </button>
        </div>
      </div>
    </header>
  );
};
