import React from 'react';
import { RotateCcw, AlertTriangle, ShieldCheck, X, FlaskConical, Check } from 'lucide-react';

interface ResetDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
}

export const ResetDemoModal: React.FC<ResetDemoModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-demo-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="reset-demo-title" className="text-xl font-extrabold text-slate-900">
                  Reset Synthetic Demo Data?
                </h3>
              </div>
              <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                Academic Demonstration Scenario
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Details of reset scope */}
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            This action will restore the baseline synthetic evaluation scenario for patient <strong>Arthur Miller (Age 78)</strong>:
          </p>

          <ul className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 font-medium text-slate-700">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Restores 5 synthetic active prescriptions (Norvasc, Lipitor, Glucophage, Cozaar, Prilosec).</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Sets <strong>Prilosec OTC</strong> back to "Pending Review" for testing Human-in-the-Loop verification.</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Resets 7-day adherence history to the baseline 92% rate ($37 / 40$ confirmed doses).</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Resets demo caregiver observation logs and schedule timing states.</span>
            </li>
          </ul>

          {/* Privacy & Secret isolation guarantee */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <p>
              <strong>Data Safety Guarantee:</strong> Only designated MedSafe Twin demo keys (<code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">medsafe_twin_v1_*</code>) are reset. Your API keys, server environment variables, and unrelated browser storage are strictly preserved.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmReset();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Confirm Demo Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
