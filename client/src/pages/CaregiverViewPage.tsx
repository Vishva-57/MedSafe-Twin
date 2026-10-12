import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Plus,
  HelpCircle,
  User,
  Heart,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  Clock,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { CaregiverSummary, PageId } from '../types/index';
import { storageService } from '../services/storageService';

interface CaregiverViewPageProps {
  summary: CaregiverSummary | null;
  onNavigate: (page: PageId) => void;
}

export const CaregiverViewPage: React.FC<CaregiverViewPageProps> = ({
  summary,
  onNavigate,
}) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [observations, setObservations] = useState(() => storageService.getObservations());
  const [adherenceStats, setAdherenceStats] = useState(() => storageService.getAdherenceStats());
  const [doctorData, setDoctorData] = useState(() => storageService.getDoctorVisitData());

  const refreshData = () => {
    setObservations(storageService.getObservations());
    setAdherenceStats(storageService.getAdherenceStats());
    setDoctorData(storageService.getDoctorVisitData());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const updated = storageService.addObservation(newNoteText.trim());
    setObservations(updated);
    setDoctorData(storageService.getDoctorVisitData());
    setNewNoteText('');
  };

  const handlePrint = () => {
    window.print();
  };

  const { last7Days, today, dailyBreakdown } = adherenceStats;
  const hasEnough7DayData = last7Days.evaluatedTotal > 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* 1. Header with Print button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-800 rounded-2xl">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Caregiver View & Doctor Visit Prep
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Care coordination hub for Elena Miller & Arthur Miller.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="self-start sm:self-auto px-5 py-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm transition-colors shadow-2xs inline-flex items-center gap-2"
        >
          <Printer className="w-4 h-4 text-slate-600" />
          <span>Print Doctor Summary</span>
        </button>
      </div>

      {/* 2. Elder Profile & Real Adherence Rate Card (Step 8) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile info */}
        <div className="space-y-3 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-800 font-bold text-lg flex items-center justify-center">
              <User className="w-7 h-7 text-sky-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Arthur Miller
              </h2>
              <p className="text-xs text-slate-500">
                Age: 78 • Geriatric Polypharmacy Patient
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
            <p className="font-semibold text-slate-700">
              Primary Caregiver: <span className="text-slate-900 font-bold">Elena Miller (Daughter)</span>
            </p>
            <p className="text-slate-500">Caregiver Access: Proxy sync & bottle scanning authorization</p>
          </div>
        </div>

        {/* Real 7-Day Adherence Percentage */}
        <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-6 flex flex-col justify-center">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>7-Day Adherence Rate</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>

          {hasEnough7DayData ? (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold text-emerald-600">
                  {last7Days.percentage}%
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {last7Days.percentage! >= 90 ? 'Excellent' : last7Days.percentage! >= 80 ? 'Good' : 'Needs Attention'}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-1">
                {last7Days.taken} / {last7Days.evaluatedTotal} confirmed doses
              </p>
              <p className="text-2xs text-slate-400 mt-0.5">
                Evaluated: {last7Days.taken} taken, {last7Days.skipped} skipped, {last7Days.missed} missed (today pending excluded)
              </p>
            </div>
          ) : (
            <div className="py-2">
              <span className="text-lg font-bold text-slate-500">Not enough data yet</span>
              <p className="text-xs text-slate-400 mt-1">
                Adherence statistics will calculate as scheduled doses are confirmed.
              </p>
            </div>
          )}
        </div>

        {/* Today's Real Doses Status */}
        <div className="space-y-2 flex flex-col justify-center">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-sky-600" />
            <span>Today's Real-Time Status</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-emerald-700">Taken Doses:</span>
              <span className="font-extrabold text-slate-900">{today.taken}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span className="text-sky-700">Pending Doses:</span>
              <span className="font-extrabold text-slate-900">{today.pending}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span className="text-amber-700">Skipped Doses:</span>
              <span className="font-extrabold text-slate-900">{today.skipped}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span className="text-rose-700">Missed Doses:</span>
              <span className="font-extrabold text-slate-900">{today.missed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Real 7-Day Adherence Visualization Bar Chart */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>7-Day Dose Adherence Breakdown</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Recorded medication taken status across daily slots (pending future doses not counted as missed).
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">Target: ≥ 90%</span>
        </div>

        {/* Accessible Bar Chart */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-3">
          {dailyBreakdown.map((item) => {
            const percent = item.total > 0 ? Math.round((item.taken / item.total) * 100) : 0;
            return (
              <div key={item.dateStr} className="flex flex-col items-center gap-2">
                <div className="text-2xs sm:text-xs font-bold text-slate-600">
                  {item.total > 0 ? `${item.taken}/${item.total}` : '—'}
                </div>
                <div className="w-full bg-slate-100 h-28 rounded-2xl flex flex-col justify-end p-1">
                  {item.total > 0 ? (
                    <div
                      className={`w-full rounded-xl transition-all ${
                        percent === 100
                          ? 'bg-emerald-500'
                          : percent >= 80
                          ? 'bg-teal-500'
                          : 'bg-amber-400'
                      }`}
                      style={{ height: `${Math.max(percent, 8)}%` }}
                      title={`${item.day} (${item.dateStr}): ${percent}% adherence (${item.taken}/${item.total})`}
                    />
                  ) : (
                    <div className="w-full h-2 rounded-full bg-slate-200" title="No evaluated doses" />
                  )}
                </div>
                <span className="text-2xs sm:text-xs font-semibold text-slate-700 text-center">
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Caregiver Observation Log (Step 9) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            <span>Caregiver Observation Log</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record home symptoms, pill organization dates, or meal schedule adjustments. Notes are stored factually without automatic medical inference.
          </p>
        </div>

        {/* Add Note Form */}
        <form onSubmit={handleAddNote} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Type caregiver note (e.g., 'Arthur reported feeling tired this morning')..."
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:bg-white focus:border-sky-500 focus:outline-none font-medium"
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm transition-colors inline-flex items-center justify-center gap-1.5 shadow-2xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Record Observation</span>
          </button>
        </form>

        {/* Recent observations entries */}
        <div className="space-y-3 pt-2">
          {observations.map((obs) => (
            <div
              key={obs.id}
              className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900">{obs.title}</span>
                <span className="text-2xs text-slate-500 font-semibold">{obs.date}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                "{obs.note}"
              </p>
              {/* Mandatory Step 9 statement */}
              <p className="text-2xs font-semibold text-sky-800 bg-sky-50 p-2 rounded-lg border border-sky-100 flex items-center gap-1.5 mt-1">
                <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>Observation recorded — discuss with your healthcare professional if concerning.</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Deterministic Doctor Visit Summary (Step 10) */}
      <div id="doctor-summary-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-sky-600" />
              <h3 className="text-xl font-extrabold text-slate-900">
                Doctor Visit Clinical Summary
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Grounded, deterministic report generated directly from recorded medication regimen and adherence logs.
            </p>
          </div>
          <span className="text-2xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700 self-start sm:self-auto">
            Generated: {doctorData.generatedAt}
          </span>
        </div>

        {/* Clinical Patient Profile */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block font-semibold">Patient Name:</span>
            <span className="font-extrabold text-slate-900 text-sm">{doctorData.patient.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block font-semibold">Age / Demographics:</span>
            <span className="font-bold text-slate-900">{doctorData.patient.age} yrs • Male</span>
          </div>
          <div>
            <span className="text-slate-500 block font-semibold">Caregiver Proxy:</span>
            <span className="font-bold text-slate-900">{doctorData.patient.caregiver}</span>
          </div>
          <div>
            <span className="text-slate-500 block font-semibold">Clinical Category:</span>
            <span className="font-bold text-slate-900">{doctorData.patient.profile}</span>
          </div>
        </div>

        {/* Confirmed Regimen Table */}
        <div className="space-y-3">
          <h4 className="font-extrabold text-sm text-slate-900 flex items-center justify-between">
            <span>1. Confirmed Active Regimen ({doctorData.confirmedMedications.length} Prescriptions)</span>
            <span className="text-xs font-normal text-slate-500">Verified by Human-in-the-Loop</span>
          </h4>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Medication</th>
                  <th className="p-3">Dosage</th>
                  <th className="p-3">Frequency & Instruction</th>
                  <th className="p-3">Prescriber</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {doctorData.confirmedMedications.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">
                      {m.brandName} <span className="font-normal text-slate-500">({m.genericName})</span>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">{m.dosage}</td>
                    <td className="p-3 text-slate-700">{m.instructions}</td>
                    <td className="p-3 text-slate-600">{m.prescribingDoctor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Current Schedule & 7-Day Adherence Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <h5 className="font-extrabold text-slate-900 text-sm">2. 7-Day Adherence Record</h5>
            <div className="space-y-1 font-medium text-slate-700">
              <p>• 7-Day Adherence: <strong className="text-emerald-700">{doctorData.adherence.last7Days.percentage !== null ? `${doctorData.adherence.last7Days.percentage}%` : 'Not enough data yet'}</strong> ({doctorData.adherence.last7Days.taken} / {doctorData.adherence.last7Days.evaluatedTotal} confirmed doses)</p>
              <p>• Recent Skipped Doses: <strong>{doctorData.adherence.last7Days.skipped}</strong></p>
              <p>• Recent Missed Doses: <strong>{doctorData.adherence.last7Days.missed}</strong></p>
              <p>• Today Pending Doses: <strong>{doctorData.adherence.today.pending}</strong> (not counted as missed)</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <h5 className="font-extrabold text-slate-900 text-sm">3. Safety Review Status</h5>
            <div className="space-y-1 text-slate-700 font-medium">
              <p className="flex items-center gap-1.5">
                {doctorData.safetyStatus.isReviewNeeded ? (
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                )}
                <span>Status: <strong>{doctorData.safetyStatus.status}</strong></span>
              </p>
              <p>• Last Safety Evaluation: <strong>{doctorData.safetyStatus.lastCheckedDate}</strong></p>
              <p>• Unresolved Timing Confirmations: <strong>{doctorData.unresolvedTimingIssues.length} items</strong></p>
            </div>
          </div>
        </div>

        {/* Unresolved Timing Issues Warning (if any) */}
        {doctorData.unresolvedTimingIssues.length > 0 && (
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-300 text-xs text-amber-900 space-y-1">
            <p className="font-extrabold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Unresolved Schedule Timing ({doctorData.unresolvedTimingIssues.length}):</span>
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              {doctorData.unresolvedTimingIssues.map((s) => (
                <li key={s.id}>
                  <strong>{s.medicationName}</strong>: {s.instruction} — (Timing needs caregiver confirmation)
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Caregiver Recorded Observations */}
        <div className="space-y-2 text-xs">
          <h5 className="font-extrabold text-slate-900 text-sm">4. Caregiver Recorded Observations</h5>
          {doctorData.observations.length > 0 ? (
            <div className="space-y-1.5">
              {doctorData.observations.map((obs) => (
                <div key={obs.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800">[{obs.date}]</span>{' '}
                  <span className="text-slate-700">{obs.note}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500">No caregiver observations recorded yet.</p>
          )}
        </div>

        {/* Mandatory Doctor Visit Summary Disclaimers */}
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-xs text-teal-900 space-y-1">
          <p className="font-extrabold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>Clinical Verification Notice:</span>
          </p>
          <p className="leading-relaxed">
            {doctorData.disclaimer}
          </p>
          <p className="text-2xs text-teal-800">
            *MedSafe Twin never diagnoses conditions, prescribes medication, or modifies dosages. All treatment adjustments must be made exclusively by Dr. Sarah Lin or authorized physicians.
          </p>
        </div>
      </div>
    </div>
  );
};
