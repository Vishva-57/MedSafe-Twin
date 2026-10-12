import React, { useState } from 'react';
import {
  Pill,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Info,
  Volume2,
  VolumeX,
  SkipForward,
  Check,
  Settings,
  HelpCircle,
  Sun,
  Sunrise,
  Sunset,
  Moon,
} from 'lucide-react';
import {
  Medication,
  ScheduleItem,
  SafetyReviewStatus,
  PageId,
  MedicationSchedule,
  AdherenceRecord,
  ScheduleTimeSlot,
} from '../types/index';
import { ReminderSettingsModal } from '../components/ReminderSettingsModal';
import { voiceReminderService } from '../services/voiceReminderService';

interface DashboardPageProps {
  medications: Medication[];
  schedule: ScheduleItem[];
  medSchedules?: MedicationSchedule[];
  adherenceRecords?: AdherenceRecord[];
  safetyStatus: SafetyReviewStatus | null;
  safetyReviewRequired?: boolean;
  onToggleSchedule: (id: string) => void;
  onRecordAdherence?: (scheduleId: string, medicationId: string, status: 'taken' | 'skipped') => void;
  onConfirmScheduleTiming?: (scheduleId: string, slot: ScheduleTimeSlot, clockTime?: string) => void;
  onNavigate: (page: PageId) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  medications,
  schedule,
  medSchedules = [],
  adherenceRecords = [],
  safetyStatus,
  safetyReviewRequired = false,
  onToggleSchedule,
  onRecordAdherence,
  onConfirmScheduleTiming,
  onNavigate,
}) => {
  const [filterSlot, setFilterSlot] = useState<string>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [confirmingScheduleId, setConfirmingScheduleId] = useState<string | null>(null);
  const [selectedSlotForConfirm, setSelectedSlotForConfirm] = useState<ScheduleTimeSlot>('morning');
  const [customClockTime, setCustomClockTime] = useState<string>('08:00 AM');

  const pendingConfirmations = medications.filter(
    (m) => m.verificationStatus === 'pending_review'
  );

  // Grouped active schedules
  const effectiveSchedules = medSchedules.length > 0
    ? medSchedules
    : schedule.map((s) => ({
        id: s.id,
        medicationId: s.medicationId,
        medicationName: s.medicationName,
        dosage: s.dosage,
        instruction: s.instructions,
        route: 'oral',
        scheduledTime: s.timeSlot.includes(':') ? s.timeSlot : null,
        timeSlot: (s.timeSlotKey as ScheduleTimeSlot) || 'morning',
        frequencyLabel: s.timeSlot,
        source: 'confirmed_prescription' as const,
        confirmationStatus: 'confirmed' as const,
        timingConfirmed: true,
      }));

  // Map each schedule item to today's adherence record
  const todayStr = new Date().toISOString().split('T')[0];
  const scheduleWithAdherence = effectiveSchedules.map((sch) => {
    const record = adherenceRecords.find(
      (r) => r.scheduleId === sch.id && r.scheduledDate === todayStr
    );
    const legacyItem = schedule.find((item) => item.id === sch.id);
    const status = record
      ? record.status
      : legacyItem?.taken
      ? 'taken'
      : 'pending';

    return {
      ...sch,
      todayStatus: status,
      recordedAt: record?.recordedAt,
    };
  });

  const takenCount = scheduleWithAdherence.filter((s) => s.todayStatus === 'taken').length;
  const totalCount = scheduleWithAdherence.length;
  const pendingCount = scheduleWithAdherence.filter((s) => s.todayStatus === 'pending').length;
  const needsConfirmationCount = scheduleWithAdherence.filter(
    (s) => s.timeSlot === 'needs_confirmation' || !s.timingConfirmed
  ).length;

  // Filter items
  const filteredItems = filterSlot === 'all'
    ? scheduleWithAdherence
    : scheduleWithAdherence.filter((s) => s.timeSlot === filterSlot);

  // Slot definitions
  const slots: { key: ScheduleTimeSlot; label: string; icon: React.ReactNode; timeRange: string }[] = [
    { key: 'morning', label: 'Morning', icon: <Sunrise className="w-5 h-5 text-amber-500" />, timeRange: '07:00 AM – 11:59 AM' },
    { key: 'afternoon', label: 'Afternoon', icon: <Sun className="w-5 h-5 text-orange-500" />, timeRange: '12:00 PM – 04:59 PM' },
    { key: 'evening', label: 'Evening', icon: <Sunset className="w-5 h-5 text-indigo-500" />, timeRange: '05:00 PM – 08:59 PM' },
    { key: 'bedtime', label: 'Bedtime', icon: <Moon className="w-5 h-5 text-purple-500" />, timeRange: '09:00 PM – 11:59 PM' },
    { key: 'needs_confirmation', label: 'Needs Confirmation', icon: <AlertTriangle className="w-5 h-5 text-amber-600" />, timeRange: 'Timing unconfirmed — reminders withheld' },
  ];

  const handleAction = (item: (typeof scheduleWithAdherence)[0], action: 'taken' | 'skipped') => {
    if (onRecordAdherence) {
      onRecordAdherence(item.id, item.medicationId, action);
    } else {
      onToggleSchedule(item.id);
    }

    if (action === 'taken' && voiceReminderService.isEnabled()) {
      voiceReminderService.speak(
        `${item.medicationName} marked as taken. Good job staying on track.`
      );
    }
  };

  const handleSaveTimingConfirmation = (scheduleId: string) => {
    if (onConfirmScheduleTiming) {
      onConfirmScheduleTiming(scheduleId, selectedSlotForConfirm, customClockTime);
    }
    setConfirmingScheduleId(null);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* 1. Welcome Header */}
      <section className="bg-gradient-to-r from-sky-700 via-sky-600 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-sky-900/10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-xs sm:text-sm font-semibold tracking-wide text-sky-100 mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Today's Medication Plan</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Welcome back, Arthur
          </h1>
          <p className="mt-2 text-base sm:text-lg text-sky-100 leading-relaxed font-normal">
            Caregiver Elena is synced. Here is your daily schedule and medication status for today.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('scanner')}
              className="px-5 py-3 rounded-xl bg-white text-sky-800 font-bold text-sm sm:text-base hover:bg-sky-50 transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <span>Scan Prescription Bottle</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('caregiver')}
              className="px-5 py-3 rounded-xl bg-sky-800/60 hover:bg-sky-800 text-white font-semibold text-sm sm:text-base transition-colors border border-white/20 inline-flex items-center gap-2"
            >
              <span>Doctor Visit Summary</span>
              <ChevronRight className="w-4 h-4 text-sky-300" />
            </button>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm transition-colors border border-white/20 inline-flex items-center gap-2"
              title="Reminder audio and voice settings"
            >
              {voiceReminderService.isEnabled() ? (
                <Volume2 className="w-4 h-4 text-emerald-300" />
              ) : (
                <VolumeX className="w-4 h-4 text-sky-200" />
              )}
              <span>Reminders: {voiceReminderService.isEnabled() ? 'Voice ON' : 'Voice OFF'}</span>
            </button>
          </div>
        </div>

        {/* Decorative subtle medical ring */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-24 -top-8 w-40 h-40 rounded-full bg-teal-400/10 pointer-events-none" />
      </section>

      {/* 2. Key Status Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Quick metrics">
        {/* Medication count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-sky-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Active Regimen</span>
            <span className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
              <Pill className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">{medications.length}</span>
            <span className="text-sm font-semibold text-slate-500">prescriptions</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1 font-medium">
            <Info className="w-3.5 h-3.5 text-sky-500" />
            <span>Prescriptions on schedule</span>
          </p>
        </div>

        {/* Today's Schedule Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Today's Doses</span>
            <span className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">{takenCount}</span>
            <span className="text-base font-semibold text-slate-500">/ {totalCount} taken</span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-teal-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${totalCount > 0 ? (takenCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Pending Confirmations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Confirmations</span>
            <span className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-amber-600">
              {pendingConfirmations.length + needsConfirmationCount}
            </span>
            <span className="text-sm font-semibold text-slate-500">action required</span>
          </div>
          <p className="mt-2 text-xs text-amber-700 font-medium">
            {pendingConfirmations.length + needsConfirmationCount > 0
              ? `${pendingConfirmations.length} meds • ${needsConfirmationCount} schedule timing`
              : 'All medications & timing verified'}
          </p>
        </div>

        {/* Safety Review Status (Step 11 Connection) */}
        <div className={`p-5 rounded-2xl border transition-colors ${
          safetyReviewRequired
            ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400'
            : 'bg-white border-slate-200/90 hover:border-teal-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Safety Status</span>
            <span className={`p-2.5 rounded-xl ${
              safetyReviewRequired ? 'bg-amber-100 text-amber-700' : 'bg-teal-50 text-teal-600'
            }`}>
              {safetyReviewRequired ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-lg sm:text-xl font-extrabold ${
              safetyReviewRequired ? 'text-amber-900' : 'text-teal-800'
            }`}>
              {safetyReviewRequired ? 'Safety review needed' : 'Safety check completed'}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            {safetyReviewRequired ? 'Regimen changed — recheck advised' : 'Verified safety review'}
          </p>
        </div>
      </section>

      {/* Safety Review Needed Banner (Step 11) */}
      {safetyReviewRequired && (
        <section
          aria-label="Safety review alert"
          className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-200 text-amber-900 rounded-xl shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-amber-950 text-base">
                Safety Review Recommended: Medication Regimen Updated
              </h3>
              <p className="text-xs sm:text-sm text-amber-900/90 mt-0.5">
                New medications or schedule adjustments were made. Run an evidence check to verify no drug-drug interactions exist.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('safety')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shrink-0 shadow-2xs"
          >
            Run Safety Check Now
          </button>
        </section>
      )}

      {/* Pending Confirmations Alert Card */}
      {pendingConfirmations.length > 0 && (
        <section
          aria-labelledby="pending-confirmations-heading"
          className="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-5 sm:p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-200/60 rounded-xl text-amber-900 shrink-0 mt-0.5">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h2 id="pending-confirmations-heading" className="text-lg sm:text-xl font-bold text-amber-950">
                Action Required: Please Confirm New Medicine ({pendingConfirmations.length})
              </h2>
              <p className="text-sm sm:text-base text-amber-900/90 mt-1">
                A new prescription bottle was scanned. Please check the name and dose below to add it to your daily schedule.
              </p>

              <div className="mt-4 space-y-2">
                {pendingConfirmations.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-3.5 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-base">
                        {item.brandName} ({item.genericName}) — {item.dosage}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600">
                        Prescribed: {item.prescribedDate} • For: {item.prescribedFor} ({item.prescribingDoctor})
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => onNavigate('safety')}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-lg transition-colors"
                      >
                        Review Safety Evidence
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Today's Medication Timeline (Step 3 & Step 4) */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-sky-600" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Today's Medication Timeline
              </h2>
            </div>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Structured daily schedule. Tap large buttons to mark doses taken or skipped.
            </p>
          </div>

          {/* Time Slot Filter Pills */}
          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl" role="tablist" aria-label="Filter schedule by time">
            <button
              type="button"
              onClick={() => setFilterSlot('all')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold capitalize transition-all ${
                filterSlot === 'all'
                  ? 'bg-white text-sky-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Slots ({totalCount})
            </button>
            {slots.map((s) => {
              const countInSlot = scheduleWithAdherence.filter((i) => i.timeSlot === s.key).length;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setFilterSlot(s.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold capitalize transition-all inline-flex items-center gap-1.5 ${
                    filterSlot === s.key
                      ? 'bg-white text-sky-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{s.label}</span>
                  {countInSlot > 0 && (
                    <span className="text-2xs px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                      {countInSlot}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grouped Timeline View */}
        <div className="mt-6 space-y-6">
          {slots
            .filter((slot) => filterSlot === 'all' || filterSlot === slot.key)
            .map((slot) => {
              const itemsInSlot = scheduleWithAdherence.filter((i) => i.timeSlot === slot.key);
              if (itemsInSlot.length === 0 && filterSlot !== 'all') {
                return (
                  <div key={slot.key} className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-500 font-semibold text-sm">No doses scheduled for {slot.label}.</p>
                  </div>
                );
              }
              if (itemsInSlot.length === 0) return null;

              return (
                <div key={slot.key} className="space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-2">
                      {slot.icon}
                      <h3 className="text-lg font-extrabold text-slate-900">{slot.label}</h3>
                      <span className="text-xs text-slate-500 font-medium">({slot.timeRange})</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      {itemsInSlot.filter((i) => i.todayStatus === 'taken').length} of {itemsInSlot.length} taken
                    </span>
                  </div>

                  <div className="space-y-3" role="list" aria-label={`${slot.label} doses`}>
                    {itemsInSlot.map((item) => (
                      <div
                        key={item.id}
                        role="listitem"
                        className={`p-5 rounded-2xl border transition-all ${
                          item.todayStatus === 'taken'
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : item.todayStatus === 'skipped'
                            ? 'bg-slate-100/70 border-slate-300'
                            : item.timeSlot === 'needs_confirmation'
                            ? 'bg-amber-50/60 border-amber-300'
                            : 'bg-white border-slate-200 hover:border-sky-300 shadow-2xs'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Medicine details */}
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 border border-sky-200">
                                {item.scheduledTime || (item.timeSlot === 'needs_confirmation' ? 'Timing Unconfirmed' : slot.label)}
                              </span>
                              <span className={`text-lg sm:text-xl font-extrabold ${
                                item.todayStatus === 'taken' ? 'line-through text-slate-500' : 'text-slate-900'
                              }`}>
                                {item.medicationName}
                              </span>
                              <span className="text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                {item.dosage}
                              </span>
                            </div>

                            <p className="text-sm sm:text-base text-slate-700 font-medium">
                              {item.instruction}
                            </p>

                            <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500 pt-1">
                              <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                                <Info className="w-3.5 h-3.5 text-sky-500" />
                                <span>Source: {item.source.replace('_', ' ')}</span>
                              </span>
                              <span>•</span>
                              <span className={`inline-flex items-center gap-1 font-semibold ${
                                item.timingConfirmed ? 'text-teal-700' : 'text-amber-700'
                              }`}>
                                {item.timingConfirmed ? (
                                  <Check className="w-3.5 h-3.5 text-teal-600" />
                                ) : (
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                )}
                                <span>{item.timingConfirmed ? 'Timing Confirmed' : 'Timing needs confirmation'}</span>
                              </span>
                            </div>
                          </div>

                          {/* Large Elderly Action Buttons */}
                          <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center">
                            {item.timeSlot === 'needs_confirmation' ? (
                              <button
                                type="button"
                                onClick={() => setConfirmingScheduleId(item.id)}
                                className="px-5 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm sm:text-base shadow-sm transition-all flex items-center gap-2"
                              >
                                <AlertCircle className="w-5 h-5" />
                                <span>Caregiver: Confirm Timing</span>
                              </button>
                            ) : item.todayStatus === 'taken' ? (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold text-sm sm:text-base border border-emerald-300">
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                  <span>Taken Today</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAction(item, 'skipped')}
                                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 underline"
                                  title="Change to skipped"
                                >
                                  Change
                                </button>
                              </div>
                            ) : item.todayStatus === 'skipped' ? (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-200 text-slate-700 font-bold text-sm sm:text-base">
                                  <SkipForward className="w-4 h-4 text-slate-500" />
                                  <span>Skipped</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleAction(item, 'taken')}
                                  className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all"
                                >
                                  Mark as Taken
                                </button>
                              </div>
                            ) : (
                              /* Pending state: Large accessible buttons */
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleAction(item, 'taken')}
                                  className="px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm sm:text-base shadow-sm transition-all flex items-center gap-2"
                                  aria-label={`Mark ${item.medicationName} as taken`}
                                >
                                  <Check className="w-5 h-5 stroke-[3]" />
                                  <span>Mark as Taken</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAction(item, 'skipped')}
                                  className="px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-sm sm:text-base transition-all flex items-center gap-1.5"
                                  aria-label={`Skip ${item.medicationName}`}
                                >
                                  <SkipForward className="w-4 h-4 text-slate-500" />
                                  <span>Skip</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Inline Caregiver Confirmation Drawer */}
                        {confirmingScheduleId === item.id && (
                          <div className="mt-4 pt-4 border-t border-amber-200 bg-amber-50/80 -mx-5 -mb-5 p-5 rounded-b-2xl space-y-3">
                            <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
                              <HelpCircle className="w-4 h-4 text-amber-600" />
                              <span>Select Dose Time for Schedule</span>
                            </h4>
                            <p className="text-xs text-amber-900">
                              Please select which time of day Arthur should take this dose:
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex rounded-xl bg-white border border-amber-300 p-1">
                                {(['morning', 'afternoon', 'evening', 'bedtime'] as ScheduleTimeSlot[]).map((slotKey) => (
                                  <button
                                    key={slotKey}
                                    type="button"
                                    onClick={() => setSelectedSlotForConfirm(slotKey)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                                      selectedSlotForConfirm === slotKey
                                        ? 'bg-amber-600 text-white'
                                        : 'text-amber-900 hover:bg-amber-100'
                                    }`}
                                  >
                                    {slotKey}
                                  </button>
                                ))}
                              </div>
                              <input
                                type="text"
                                value={customClockTime}
                                onChange={(e) => setCustomClockTime(e.target.value)}
                                placeholder="e.g. 08:00 AM"
                                className="px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-xl font-medium w-28 text-slate-800"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveTimingConfirmation(item.id)}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
                              >
                                Confirm Time
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmingScheduleId(null)}
                                className="px-3 py-2 text-xs text-slate-600 hover:text-slate-800 font-semibold"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* Reminder Settings Modal (Step 6 & Step 7) */}
      <ReminderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
