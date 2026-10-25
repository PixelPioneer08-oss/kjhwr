import React from 'react';
import { MetadataResponse } from '../types';

interface HeaderProps {
  metadata: MetadataResponse | null;
  onOpenMethodology: () => void;
}

export const Header: React.FC<HeaderProps> = ({ metadata, onOpenMethodology }) => {
  const isSynthetic = metadata?.is_synthetic ?? false;
  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <div className="logo-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2" />
            </svg>
          </div>
          <div>
            <div className="header-title">GB Wind Day-Ahead Procurement Pilot</div>
            <div className="header-sub">
              Elexon BMRS • FUELHH (Actuals) + WINDFOR (Forecasts) • January 2026
            </div>
          </div>
        </div>
        <div className="header-actions">
          {isSynthetic ? (
            <span className="badge badge-rose" style={{ fontSize: 11 }}>
              ⚠ SYNTHETIC DATA MODE
            </span>
          ) : (
            <span className="badge badge-emerald" style={{ fontSize: 11 }}>
              ✓ Real Elexon Data
            </span>
          )}
          <span className="badge badge-blue" style={{ fontSize: 11 }}>
            Res: 30m Act / 60m Fc
          </span>
          {metadata?.observed_publish_times_utc && (
            <span className="badge badge-purple" style={{ fontSize: 11 }}>
              {metadata.observed_publish_times_utc.length} publish runs/day detected
            </span>
          )}
          <button className="btn btn-ghost" onClick={onOpenMethodology}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
            Method & Assumptions
          </button>
        </div>
      </div>
    </header>
  );
};
