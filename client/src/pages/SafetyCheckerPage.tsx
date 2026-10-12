import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Info,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowRight,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Medication, PageId, SafetyCheckResponse, MatchedInteraction } from '../types/index';
import { apiService } from '../services/api';
import { storageService } from '../services/storageService';

interface SafetyCheckerPageProps {
  medications: Medication[];
  onSafetyCheckComplete?: () => void;
  onNavigate: (page: PageId) => void;
}

export const SafetyCheckerPage: React.FC<SafetyCheckerPageProps> = ({
  medications,
  onSafetyCheckComplete,
  onNavigate,
}) => {
  const [safetyResponse, setSafetyResponse] = useState<SafetyCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasRunInitialCheck, setHasRunInitialCheck] = useState(false);

  // Run safety check against current regimen
  const handleRunSafetyCheck = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await apiService.checkSafety(medications);
      setSafetyResponse(response);
      setHasRunInitialCheck(true);
      storageService.setSafetyReviewRequired(false);
      if (onSafetyCheckComplete) {
        onSafetyCheckComplete();
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to complete evidence safety check. Please check backend connection and retry.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Run automatically on first mount if medications exist
  useEffect(() => {
    if (!hasRunInitialCheck && medications.length > 0) {
      handleRunSafetyCheck();
    }
  }, [medications.length]);

  const getSignificanceBadge = (significance: string) => {
    switch (significance) {
      case 'major':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5" />
            Major Clinical Significance
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            Moderate Clinical Significance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-sky-100 text-sky-800 border border-sky-300">
            <Info className="w-3.5 h-3.5" />
            Minor / Informational
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-900 rounded-2xl shadow-2xs">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Medication Safety Checker
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-0.5">
              Checks your medicines together to ensure they can be safely taken at the same time.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleRunSafetyCheck}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Evaluating Regimen...' : 'Check Current Regimen'}</span>
        </button>
      </div>

      {/* Safety Notice */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 sm:p-6 text-amber-950 space-y-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
          <h2 className="font-extrabold text-base sm:text-lg text-amber-900">
            Safety Notice: Academic Demonstration
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
          This safety checker searches a verified index of official FDA package inserts.
          <strong> Always review any medication questions or concerns with your prescribing doctor or pharmacist. </strong>
        </p>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Regimen Evaluated</span>
            <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{medications.length} Drugs</p>
          <p className="text-xs text-slate-500">
            Active confirmed medications in Arthur Miller's regimen.
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Reference Standard</span>
            <span className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
              <BookOpen className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-bold text-teal-900">Official FDA Labels</p>
          <p className="text-xs text-slate-500">
            Verified drug information from official FDA inserts.
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Verification Status</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-xl font-bold text-slate-900">
            {safetyResponse ? safetyResponse.statusLabel : 'Awaiting Check'}
          </p>
          <p className="text-xs text-slate-500">
            {safetyResponse?.checkedAt
              ? `Checked at ${new Date(safetyResponse.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Click button above to evaluate'}
          </p>
        </div>
      </div>

      {/* Error Banner with Retry */}
      {errorMessage && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-700 shrink-0" />
            <p className="text-sm font-semibold">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={handleRunSafetyCheck}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 cursor-pointer"
          >
            Retry Check
          </button>
        </div>
      )}

      {/* Safety Evaluation Results */}
      {safetyResponse && (
        <div className="space-y-6">
          {/* Status Alert Banner */}
          {safetyResponse.status === 'matches_found' ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-amber-50 border-2 border-amber-300 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-amber-200 text-amber-900 rounded-xl">
                    <ShieldAlert className="w-6 h-6" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-lg text-amber-950">
                      {safetyResponse.statusLabel} ({safetyResponse.matchedInteractions.length} Identified)
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-900/90 mt-0.5">
                      {safetyResponse.statusDescription}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : safetyResponse.status === 'no_matches_in_dataset' ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-100 border border-slate-300 space-y-2">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-slate-200 text-slate-700 rounded-xl">
                  <Info className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    {safetyResponse.statusLabel}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    {safetyResponse.statusDescription}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 sm:p-6 rounded-3xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-lg text-amber-950">
                    {safetyResponse.statusLabel}
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-800">
                    {safetyResponse.statusDescription}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Matched Interaction Cards */}
          {safetyResponse.matchedInteractions.map((match: MatchedInteraction, idx: number) => (
            <div
              key={match.evidence.evidenceId || idx}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-2xs font-extrabold uppercase tracking-wider text-slate-400">
                      Interaction Alert #{idx + 1}
                    </span>
                    {getSignificanceBadge(match.evidence.clinicalSignificance)}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    {match.medicationA.brandName} ({match.medicationA.dosage}) +{' '}
                    {match.medicationB.brandName} ({match.medicationB.dosage})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Active ingredients: {match.medicationA.genericName} &amp; {match.medicationB.genericName}
                  </p>
                </div>
              </div>

              {/* Section 1: Plain-Language Summary for Arthur & Elena */}
              <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-sky-200 text-sky-800 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-sky-950">
                    What You Should Know
                  </h3>
                </div>

                <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium">
                  {match.plainLanguageExplanation}
                </p>

                {/* Recommended action */}
                <div className="pt-2 border-t border-sky-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-700">
                    <strong className="text-slate-900">Recommended Action: </strong>
                    {match.evidence.recommendedAction}
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('caregiver')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline shrink-0 cursor-pointer"
                  >
                    <span>View in Doctor Notes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Section 2: FDA Label Excerpt */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                    <span>Official FDA Package Insert Reference</span>
                  </h3>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <a
                      href={match.evidence.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-sm text-teal-800 hover:text-teal-950 hover:underline flex items-center gap-1.5"
                    >
                      <span>{match.evidence.sourceTitle}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                    <span className="text-2xs font-bold px-2 py-0.5 rounded bg-teal-100 text-teal-800 shrink-0">
                      Verified FDA Label
                    </span>
                  </div>

                  <blockquote className="p-3 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 italic border-l-4 border-l-teal-600">
                    "{match.evidence.supportingExcerpt}"
                  </blockquote>
                </div>
              </div>

              {/* Section 3: DailyMed API Official Label Lookups */}
              {match.dailyMedLookups && match.dailyMedLookups.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-2xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Official Package Inserts (DailyMed)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {match.dailyMedLookups.map((lookup, lIdx) => (
                      <div
                        key={lIdx}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2"
                      >
                        <div className="truncate">
                          <p className="font-bold text-slate-800 truncate">{lookup.drugName}</p>
                          <p className="text-2xs text-slate-500 truncate">
                            {lookup.lookupStatus === 'success'
                              ? lookup.title || 'Official DailyMed Package Insert'
                              : `Status: ${lookup.lookupStatus}`}
                          </p>
                        </div>
                        {lookup.dailyMedUrl && (
                          <a
                            href={lookup.dailyMedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-teal-700 hover:text-teal-900 rounded-lg hover:bg-teal-50 shrink-0"
                            title="View official NIH DailyMed SPL label"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Unmatched Medications Disclosure */}
          {safetyResponse.unmatchedMedications.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Info className="w-4 h-4 text-slate-500" />
                  <span>Unmatched Regimen Items ({safetyResponse.unmatchedMedications.length})</span>
                </h3>
                <span className="text-2xs font-bold text-slate-400">Curated Index Scope</span>
              </div>
              <p className="text-xs text-slate-600">
                The following medications had no matching records in our current demonstration dataset. Because this dataset is limited, an unmatched result does <strong>not</strong> mean these medications cannot interact.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {safetyResponse.unmatchedMedications.map((item, uIdx) => (
                  <span
                    key={uIdx}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Regimen Data Quality Issues */}
          {safetyResponse.unresolvedIssues.length > 0 && (
            <div className="bg-amber-50 rounded-3xl p-6 border border-amber-300 space-y-3">
              <h3 className="font-bold text-amber-950 text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Regimen Quality Issues Detected ({safetyResponse.unresolvedIssues.length})</span>
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-amber-900">
                {safetyResponse.unresolvedIssues.map((issue, iIdx) => (
                  <li key={iIdx} className="flex items-start gap-2">
                    <span className="font-bold shrink-0">•</span>
                    <span>
                      <strong>{issue.medicationName}:</strong> {issue.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dataset Coverage Notice */}
          <div className="p-4 rounded-2xl bg-slate-100 text-slate-600 text-2xs sm:text-xs flex items-center justify-between gap-3">
            <p>
              <strong>Dataset Coverage: </strong>
              {safetyResponse.datasetCoverageNotice}
            </p>
            <span className="font-mono text-slate-400 shrink-0">v1.0.0-academic</span>
          </div>
        </div>
      )}

      {/* Human-in-the-Loop Checklist */}
      <div className="bg-slate-50 rounded-3xl p-6 sm:p-7 border border-slate-200 space-y-3">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
          <span>Caregiver &amp; Patient Checklist Before Medication Changes</span>
        </h3>
        <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
            <span>Never discontinue, pause, or change a medication dosage without consulting your prescribing doctor.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
            <span>Inform your pharmacist of all over-the-counter vitamins, antacids, or supplements taken at home.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
            <span>Bring Arthur's full printed medication list from the Caregiver View to every cardiology and PCP appointment.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
