import React from 'react';
import { X, ShieldAlert, Clock, Scale, Layers, HelpCircle, AlertCircle } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-bg-surface border border-border-subtle rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Methodology, Domain Logic & Market Assumptions
              </h2>
              <p className="text-xs text-text-secondary">
                Technical reference for UK Day-Ahead Electricity Trading & Balancing Mechanism
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-bg-surface-elevated transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Sections */}
        <div className="space-y-6 text-xs text-text-secondary leading-relaxed">
          {/* Section 1: Gate Closure */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              1. Day-Ahead Gate Closure Timings (London Time)
            </h3>
            <p>
              In the GB wholesale electricity market, day-ahead power is traded on two competing power exchanges:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong className="text-white">EPEX SPOT GB:</strong> Auction gate closes at <strong className="text-cyan-400">09:20 London time</strong> on Day D-1. (This is our default cut-off).
              </li>
              <li>
                <strong className="text-white">Nord Pool N2EX:</strong> Auction gate closes at <strong className="text-cyan-400">09:50 London time</strong> on Day D-1.
              </li>
              <li>
                <strong className="text-amber-400">Legacy 11:00 London time:</strong> <span className="underline">OUTDATED</span>. Prior to January 2021 (pre-Brexit Multi-Regional Coupling), the GB gate closure was 11:00. Following the transition to uncoupled national day-ahead auctions, GB gate closures shifted to 09:20 / 09:50. The tool supports testing this legacy cutoff for historical comparison.
              </li>
            </ul>
            <div className="p-3 rounded-lg bg-bg-surface-elevated border border-border-subtle text-[11px]">
              <strong className="text-white block mb-0.5">Strict Look-Ahead Isolation:</strong>
              For delivery day D, the cut-off is evaluated on D-1 at the gate closure time. Any forecast published after this timestamp is strictly excluded. Only the newest forecast published at or before the cut-off is utilized.
            </div>
          </div>

          {/* Section 2: Error Sign Convention */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-400" />
              2. Error Sign Convention & Financial Asymmetry
            </h3>
            <p>
              The error sign convention is defined as:
            </p>
            <div className="p-2.5 rounded bg-bg-surface-elevated font-mono text-center text-sm font-bold text-white border border-border-subtle">
              Error = Forecast - Actual
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/40">
                <span className="font-semibold text-amber-300 block mb-1">
                  Positive Error (&gt; 0) = Wind Over-Forecast
                </span>
                <p className="text-[11px] text-text-muted">
                  The utility assumed wind would generate more power than actually occurred. As a result, the utility <strong>under-buys</strong> thermal/non-wind supply in the day-ahead auction, creating a generation deficit in real time. The utility is exposed to the costly <strong>System Buy Price (Cash-Out)</strong> in the Elexon Balancing Mechanism.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40">
                <span className="font-semibold text-emerald-300 block mb-1">
                  Negative Error (&lt; 0) = Wind Under-Forecast
                </span>
                <p className="text-[11px] text-text-muted">
                  The utility had surplus wind generation. The utility over-procured non-wind power. Unwinding a surplus by spilling power or selling through the system sell cash-out is far cheaper and carries negligible operational shortfall risk.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Risk Buffer P90 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              3. P90 Risk Buffer Formulation
            </h3>
            <p>
              The risk buffer is computed as:
            </p>
            <div className="p-2.5 rounded bg-bg-surface-elevated font-mono text-center text-sm font-bold text-white border border-border-subtle">
              Buffer_P90 = max(0, P90 of Error)
            </div>
            <p>
              <strong className="text-white">Commercial Interpretation:</strong> "To be approximately 90% confident that wind power generation will not fall short of the procurement plan, the trading desk must assume that available wind is up to <code className="text-amber-300">Buffer_P90 MW</code> lower than the headline forecast."
            </p>
            <p className="text-[11px] text-text-muted">
              Likewise, <code className="text-amber-300">Buffer_P95 = max(0, P95 of Error)</code> provides a 95% confidence hedge against severe tails.
            </p>
          </div>

          {/* Section 4: Resolution Mismatch & Exact Join */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              4. Resolution Handling: 30-Min Actuals vs 60-Min Forecasts
            </h3>
            <p>
              Data is sourced directly from official Elexon BMRS API v1 streams:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>
                <strong className="text-white">Actuals (FUELHH):</strong> 30-minute settlement period resolution (:00 and :30 timestamps). Filtered for fuelType = &quot;WIND&quot;.
              </li>
              <li>
                <strong className="text-white">Forecasts (WINDFOR):</strong> 60-minute hourly resolution (:00 timestamps). Published up to 8 times daily by NESO.
              </li>
              <li>
                <strong className="text-white">Join Rule:</strong> Joined strictly on <strong className="text-cyan-400">exact startTime</strong> (:00 on the hour). No interpolation or synthetic points are invented. This matches 24 exact hourly points per day (e.g. 744 matched intervals across January).
              </li>
            </ul>
          </div>

          {/* Section 5: Date Window */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              5. Decision Day D-1 vs Delivery Day D Window
            </h3>
            <p>
              Under day-ahead electricity market rules, power delivered on day <strong className="text-white">D</strong> must be transacted on day <strong className="text-white">D-1</strong>.
            </p>
            <p>
              When purchase decisions are made across <strong className="text-white">1–31 January 2026</strong> (decision days D-1), physical electricity delivery occurs from <strong className="text-white">2 January to 1 February 2026</strong>. The date picker allows full flexibility to select decision windows or evaluate any custom period.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border-subtle flex justify-end">
          <button onClick={onClose} className="btn btn-primary text-xs py-2 px-5">
            Close & Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
