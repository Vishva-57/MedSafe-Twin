import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface DisclaimerBannerProps {
  onTriggerResetDemo?: () => void;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  onTriggerResetDemo,
}) => {
  return (
    <div
      role="banner"
      className="bg-sky-950 text-white px-4 py-2 sm:px-6 shadow-xs border-b border-sky-900"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="p-1 bg-amber-500/20 text-amber-300 rounded shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <p className="font-medium text-slate-200">
            <strong className="text-white font-semibold">Demonstration Only:</strong> Prepared for Arthur Miller (Age 78). Always consult your doctor before changing medications.
          </p>
        </div>

        {onTriggerResetDemo && (
          <button
            type="button"
            onClick={onTriggerResetDemo}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-200 hover:text-white border border-amber-400/30 font-semibold text-xs transition-colors self-end sm:self-auto shrink-0"
            title="Reset demonstration data to initial state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
            <span>Reset Demo Data</span>
          </button>
        )}
      </div>
    </div>
  );
};
