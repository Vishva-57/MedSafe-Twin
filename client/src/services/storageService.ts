import {
  MedicationSchedule,
  AdherenceRecord,
  CaregiverObservation,
  ReminderSettings,
  Medication,
  ScheduleTimeSlot,
} from '../types/index';
import { mockMedications } from '../data/mockData';
import { normalizeMedicationToSchedules } from '../utils/scheduleNormalizer';

const KEYS = {
  SCHEDULES: 'medsafe_twin_v1_schedules',
  ADHERENCE: 'medsafe_twin_v1_adherence',
  OBSERVATIONS: 'medsafe_twin_v1_observations',
  SETTINGS: 'medsafe_twin_v1_settings',
  MEDICATIONS: 'medsafe_twin_v1_medications',
  SAFETY_REVIEW_REQUIRED: 'medsafe_twin_v1_safety_review_required',
};

const DEFAULT_SETTINGS: ReminderSettings = {
  voiceEnabled: false,
  soundEnabled: true,
  leadTimeMinutes: 15,
  voiceRate: 0.9,
};

// Generates initial 7-day synthetic demo adherence history (Arthur has 92% adherence)
function generateInitialAdherenceRecords(schedules: MedicationSchedule[]): AdherenceRecord[] {
  const records: AdherenceRecord[] = [];
  const today = new Date();

  // Helper for YYYY-MM-DD
  const formatYMD = (d: Date) => d.toISOString().split('T')[0];

  // Past 6 days
  for (let offset = 6; offset >= 1; offset--) {
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - offset);
    const dateStr = formatYMD(pastDate);

    schedules.forEach((sch, idx) => {
      // 92% adherence: intentionally mark one or two historical doses as skipped or missed
      let status: 'taken' | 'skipped' | 'missed' = 'taken';
      if (offset === 3 && idx === 1) status = 'skipped';
      if (offset === 1 && idx === 2) status = 'missed';

      records.push({
        id: `adh-seed-${dateStr}-${sch.id}`,
        medicationId: sch.medicationId,
        scheduleId: sch.id,
        scheduledDate: dateStr,
        scheduledTime: sch.scheduledTime,
        status,
        recordedAt: `${dateStr}T${sch.timeSlot === 'morning' ? '08:30:00' : sch.timeSlot === 'evening' ? '18:15:00' : '21:30:00'}.000Z`,
        recordedBy: 'elder',
      });
    });
  }

  // Today's doses: morning taken, evening/bedtime pending
  const todayStr = formatYMD(today);
  schedules.forEach((sch) => {
    const isMorning = sch.timeSlot === 'morning';
    records.push({
      id: `adh-today-${sch.id}`,
      medicationId: sch.medicationId,
      scheduleId: sch.id,
      scheduledDate: todayStr,
      scheduledTime: sch.scheduledTime,
      status: isMorning ? 'taken' : 'pending',
      recordedAt: isMorning ? `${todayStr}T08:35:00.000Z` : '',
      recordedBy: 'elder',
    });
  });

  return records;
}

const INITIAL_OBSERVATIONS: CaregiverObservation[] = [
  {
    id: 'obs-01',
    date: 'Yesterday at 4:15 PM',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    title: 'Routine Blood Pressure Check',
    category: 'adherence',
    note: 'Arthur took morning Amlodipine and Losartan. Home cuff reading was 128/78 mmHg.',
    disclaimer: 'Observation recorded — discuss with your healthcare professional if concerning.',
  },
  {
    id: 'obs-02',
    date: 'Oct 08, 2026',
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    title: 'Caregiver Note on Prilosec Course',
    category: 'confirmation',
    note: 'Omeprazole temporary 30-day course ends on Oct 28. Added reminder to discuss with Dr. Vance at next visit.',
    disclaimer: 'Observation recorded — discuss with your healthcare professional if concerning.',
  },
];

export const storageService = {
  // Safe JSON getter
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch (err) {
      console.warn(`[storageService] Error parsing key ${key}, falling back to defaults:`, err);
      return fallback;
    }
  },

  // Safe JSON setter
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`[storageService] Failed to set key ${key}:`, err);
    }
  },

  // Medications
  getMedications(): Medication[] {
    return this.get<Medication[]>(KEYS.MEDICATIONS, mockMedications);
  },

  saveMedications(meds: Medication[]): void {
    this.set(KEYS.MEDICATIONS, meds);
  },

  // Schedules
  getSchedules(): MedicationSchedule[] {
    const saved = this.get<MedicationSchedule[] | null>(KEYS.SCHEDULES, null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    // Seed from current medications
    const meds = this.getMedications();
    const generated = meds.flatMap((m) => normalizeMedicationToSchedules(m));
    this.saveSchedules(generated);
    return generated;
  },

  saveSchedules(schedules: MedicationSchedule[]): void {
    this.set(KEYS.SCHEDULES, schedules);
  },

  // Adherence
  getAdherenceRecords(): AdherenceRecord[] {
    const saved = this.get<AdherenceRecord[] | null>(KEYS.ADHERENCE, null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    const schedules = this.getSchedules();
    const seeded = generateInitialAdherenceRecords(schedules);
    this.saveAdherenceRecords(seeded);
    return seeded;
  },

  saveAdherenceRecords(records: AdherenceRecord[]): void {
    this.set(KEYS.ADHERENCE, records);
  },

  // Record an action (Taken, Skipped, Missed) preventing accidental duplicates
  recordAdherence(
    scheduleId: string,
    medicationId: string,
    status: 'taken' | 'skipped' | 'missed',
    recordedBy: 'elder' | 'caregiver' = 'elder'
  ): AdherenceRecord[] {
    const todayStr = new Date().toISOString().split('T')[0];
    const records = this.getAdherenceRecords();

    const existingIndex = records.findIndex(
      (r) => r.scheduleId === scheduleId && r.scheduledDate === todayStr
    );

    const nowISO = new Date().toISOString();

    if (existingIndex >= 0) {
      records[existingIndex] = {
        ...records[existingIndex],
        status,
        recordedAt: nowISO,
        recordedBy,
      };
    } else {
      records.unshift({
        id: `adh-${Date.now()}-${scheduleId}`,
        medicationId,
        scheduleId,
        scheduledDate: todayStr,
        scheduledTime: null,
        status,
        recordedAt: nowISO,
        recordedBy,
      });
    }

    this.saveAdherenceRecords(records);
    return records;
  },

  // Observations
  getObservations(): CaregiverObservation[] {
    return this.get<CaregiverObservation[]>(KEYS.OBSERVATIONS, INITIAL_OBSERVATIONS);
  },

  addObservation(note: string, category: CaregiverObservation['category'] = 'adherence'): CaregiverObservation[] {
    const current = this.getObservations();
    const newObs: CaregiverObservation = {
      id: `obs-${Date.now()}`,
      date: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date().toISOString(),
      title: 'Caregiver Observation Logged',
      category,
      note: note.trim(),
      disclaimer: 'Observation recorded — discuss with your healthcare professional if concerning.',
    };
    const updated = [newObs, ...current];
    this.set(KEYS.OBSERVATIONS, updated);
    return updated;
  },

  // Settings
  getSettings(): ReminderSettings {
    return this.get<ReminderSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
  },

  saveSettings(settings: ReminderSettings): void {
    this.set(KEYS.SETTINGS, settings);
  },

  // Safety Review Required flag
  getSafetyReviewRequired(): boolean {
    return this.get<boolean>(KEYS.SAFETY_REVIEW_REQUIRED, false);
  },

  setSafetyReviewRequired(required: boolean): void {
    this.set(KEYS.SAFETY_REVIEW_REQUIRED, required);
  },

  // Confirm schedule timing for items marked as needs_confirmation
  confirmScheduleTiming(
    scheduleId: string,
    timeSlot: ScheduleTimeSlot,
    clockTime?: string | null
  ): MedicationSchedule[] {
    const schedules = this.getSchedules();
    const index = schedules.findIndex((s) => s.id === scheduleId);
    if (index >= 0) {
      schedules[index] = {
        ...schedules[index],
        timeSlot,
        scheduledTime: clockTime || null,
        confirmationStatus: 'confirmed',
        timingConfirmed: true,
        frequencyLabel: clockTime ? `Confirmed for ${clockTime}` : `Confirmed for ${timeSlot}`,
      };
      this.saveSchedules(schedules);
    }
    return schedules;
  },

  // Synchronize schedules when medications change
  syncSchedulesWithMedications(medications: Medication[]): MedicationSchedule[] {
    const existingSchedules = this.getSchedules();
    const activeMeds = medications.filter((m) => m.verificationStatus === 'confirmed');

    // Retain existing schedules for existing meds, generate for newly added meds
    const existingMedIds = new Set(existingSchedules.map((s) => s.medicationId));
    const newMeds = activeMeds.filter((m) => !existingMedIds.has(m.id));

    const newSchedules: MedicationSchedule[] = newMeds.flatMap((m) =>
      normalizeMedicationToSchedules(m)
    );

    // Filter out schedules for deleted medications
    const currentMedIds = new Set(medications.map((m) => m.id));
    const retainedSchedules = existingSchedules.filter((s) => currentMedIds.has(s.medicationId));

    const combined = [...retainedSchedules, ...newSchedules];
    this.saveSchedules(combined);
    return combined;
  },

  // Comprehensive adherence analytics
  getAdherenceStats() {
    const records = this.getAdherenceRecords();
    const todayStr = new Date().toISOString().split('T')[0];

    // Build list of last 7 dates (YYYY-MM-DD)
    const last7Dates: string[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyBreakdown: { day: string; dateStr: string; taken: number; total: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      last7Dates.push(str);
      const dayName = i === 0 ? 'Today' : dayNames[d.getDay()];

      // Daily evaluated records (taken + missed + skipped)
      const dayRecords = records.filter((r) => r.scheduledDate === str);
      const dayTaken = dayRecords.filter((r) => r.status === 'taken').length;
      // For daily breakdown: evaluated total
      const dayEvaluated = dayRecords.filter(
        (r) => r.status === 'taken' || r.status === 'missed' || r.status === 'skipped'
      ).length;

      dailyBreakdown.push({
        day: dayName,
        dateStr: str,
        taken: dayTaken,
        total: dayEvaluated,
      });
    }

    // Filter records in the 7-day window
    const windowRecords = records.filter((r) => last7Dates.includes(r.scheduledDate));
    const todayRecords = records.filter((r) => r.scheduledDate === todayStr);

    const todayTaken = todayRecords.filter((r) => r.status === 'taken').length;
    const todayPending = todayRecords.filter((r) => r.status === 'pending').length;
    const todaySkipped = todayRecords.filter((r) => r.status === 'skipped').length;
    const todayMissed = todayRecords.filter((r) => r.status === 'missed').length;
    const todayEvaluated = todayTaken + todaySkipped + todayMissed;
    const todayPercentage = todayEvaluated > 0 ? Math.round((todayTaken / todayEvaluated) * 100) : null;

    const last7Taken = windowRecords.filter((r) => r.status === 'taken').length;
    const last7Skipped = windowRecords.filter((r) => r.status === 'skipped').length;
    const last7Missed = windowRecords.filter((r) => r.status === 'missed').length;
    const last7Pending = windowRecords.filter((r) => r.status === 'pending').length;
    const last7Evaluated = last7Taken + last7Skipped + last7Missed;

    const sevenDayPercentage = last7Evaluated > 0 ? Math.round((last7Taken / last7Evaluated) * 100) : null;

    return {
      today: {
        taken: todayTaken,
        pending: todayPending,
        skipped: todaySkipped,
        missed: todayMissed,
        evaluatedTotal: todayEvaluated,
        percentage: todayPercentage,
      },
      last7Days: {
        taken: last7Taken,
        pending: last7Pending,
        skipped: last7Skipped,
        missed: last7Missed,
        evaluatedTotal: last7Evaluated,
        percentage: sevenDayPercentage,
      },
      dailyBreakdown,
    };
  },

  // Get recent missed or skipped doses
  getRecentMissedOrSkipped(): AdherenceRecord[] {
    const records = this.getAdherenceRecords();
    return records
      .filter((r) => r.status === 'missed' || r.status === 'skipped')
      .slice(0, 5);
  },

  // Deterministic Doctor Visit Summary data builder
  getDoctorVisitData() {
    const meds = this.getMedications();
    const confirmedMeds = meds.filter((m) => m.verificationStatus === 'confirmed');
    const pendingMeds = meds.filter((m) => m.verificationStatus === 'pending_review');
    const schedules = this.getSchedules();
    const stats = this.getAdherenceStats();
    const missedSkipped = this.getRecentMissedOrSkipped();
    const observations = this.getObservations();
    const safetyReviewNeeded = this.getSafetyReviewRequired();
    const needsTimingConfirmation = schedules.filter((s) => !s.timingConfirmed);

    return {
      patient: {
        name: 'Arthur Miller',
        age: 78,
        caregiver: 'Elena Miller (Daughter)',
        profile: 'Geriatric Polypharmacy Patient',
      },
      confirmedMedications: confirmedMeds,
      pendingMedications: pendingMeds,
      schedules,
      adherence: stats,
      recentMissedSkipped: missedSkipped,
      observations,
      unresolvedTimingIssues: needsTimingConfirmation,
      safetyStatus: {
        status: safetyReviewNeeded ? 'Safety review needed' : 'Safety check completed',
        isReviewNeeded: safetyReviewNeeded,
        lastCheckedDate: 'Today at 7:00 AM (FDA Grounded)',
      },
      generatedAt: new Date().toLocaleString(),
      disclaimer: 'Generated from recorded medication and adherence data. Review with your healthcare professional.',
    };
  },

  // Reset demo state
  resetAll(): void {
    localStorage.removeItem(KEYS.SCHEDULES);
    localStorage.removeItem(KEYS.ADHERENCE);
    localStorage.removeItem(KEYS.OBSERVATIONS);
    localStorage.removeItem(KEYS.SETTINGS);
    localStorage.removeItem(KEYS.MEDICATIONS);
    localStorage.removeItem(KEYS.SAFETY_REVIEW_REQUIRED);
  },
};
