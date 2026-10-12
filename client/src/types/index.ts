export type PageId = 'dashboard' | 'medications' | 'scanner' | 'safety' | 'caregiver';

export type TimingSlot = 'morning' | 'afternoon' | 'evening' | 'bedtime';
export type FoodRelation = 'with_food' | 'before_food' | 'after_food' | 'independent';
export type MedicationStatus = 'active' | 'paused' | 'discontinued';
export type VerificationStatus = 'confirmed' | 'pending_review';

export interface Medication {
  id: string;
  brandName: string;
  genericName: string;
  dosage: string;
  frequency: string;
  prescribedFor: string;
  prescribingDoctor: string;
  instructions: string;
  timings: TimingSlot[];
  foodRelation: FoodRelation;
  prescribedDate: string;
  refillsRemaining: number;
  status: MedicationStatus;
  verificationStatus: VerificationStatus;
  recordOrigin?: 'preloaded_demo' | 'extracted_session' | 'manual_session';
  isSynthetic?: boolean;
}

export interface ScheduleItem {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  timeSlot: string;
  timeSlotKey: TimingSlot;
  instructions: string;
  taken: boolean;
  takenAt?: string;
}

// ==========================================
// Medication Twin & Adherence Workflow Types
// ==========================================

export type ScheduleTimeSlot =
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'bedtime'
  | 'needs_confirmation';

export type AdherenceStatus = 'taken' | 'missed' | 'skipped' | 'pending';
export type ScheduleConfirmationStatus = 'confirmed' | 'pending_confirmation';
export type ScheduleSource = 'confirmed_prescription' | 'caregiver_manual' | 'demo_seed';

export interface MedicationSchedule {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  instruction: string;
  route: string;
  scheduledTime: string | null; // e.g. "08:00 AM" if explicitly confirmed, or null
  timeSlot: ScheduleTimeSlot;
  frequencyLabel: string;
  source: ScheduleSource;
  confirmationStatus: ScheduleConfirmationStatus;
  timingConfirmed: boolean;
}

export interface AdherenceRecord {
  id: string;
  medicationId: string;
  scheduleId: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string | null;
  status: AdherenceStatus;
  recordedAt: string; // ISO timestamp
  recordedBy: 'elder' | 'caregiver';
  notes?: string;
}

export interface CaregiverObservation {
  id: string;
  date: string;
  timestamp: string;
  title: string;
  category: 'adherence' | 'symptom' | 'confirmation' | 'general';
  note: string;
  disclaimer: string;
}

export interface ReminderSettings {
  voiceEnabled: boolean;
  soundEnabled: boolean;
  leadTimeMinutes: number;
  voiceRate: number;
}


export interface SafetyReviewStatus {
  lastChecked: string;
  totalMedications: number;
  activeAlertsCount: number;
  pendingConfirmationsCount: number;
  status: 'Review Needed' | 'Up to Date';
  responsibleAiNote: string;
}

export interface DoctorVisit {
  doctor: string;
  specialty: string;
  date: string;
  location: string;
  purpose: string;
  questionsForDoctor: string[];
}

export interface AdherenceDay {
  day: string;
  taken: number;
  total: number;
}

export interface CaregiverSummary {
  elderName: string;
  age: number;
  primaryCaregiver: string;
  adherenceRatePercent: number;
  adherenceLast7Days: AdherenceDay[];
  upcomingDoctorVisit: DoctorVisit;
  doctorVisitSummaryNotes: string[];
  recentObservations: {
    id: string;
    date: string;
    title: string;
    category: 'adherence' | 'symptom' | 'confirmation';
    note: string;
  }[];
}

// ==========================================
// Multimodal Extraction Types (Gemini API)
// ==========================================

export type ImageReadability = 'clear' | 'partially_readable' | 'blurry_or_unreadable';

export interface ExtractedMedicine {
  id: string;
  medicineName: string;
  genericName: string | null;
  strength: string | null;
  dosageInstructions: string;
  frequency: string | null;
  route: string | null;
  duration: string | null;
  prescriptionDate: string | null;
  prescriber: string | null;
  pharmacyInfo: string | null;
  supportingTextExcerpt: string;
  uncertainOrUnreadableFields: string[];
  confidenceAssessment: 'high' | 'medium' | 'low';
  isConfirmedByHuman?: boolean;
}

export interface PrescriptionExtractionResponse {
  success: boolean;
  imageReadability: ImageReadability;
  extractedMedicines: ExtractedMedicine[];
  reviewIssues: string[];
  modelUsed: string;
  analyzedAt: string;
  aiNotice: string;
  code?: string;
  error?: string;
}

// ==========================================
// Safety Checker & Evidence Types
// ==========================================

export type ClinicalSignificance = 'major' | 'moderate' | 'minor';

export type SafetyCheckStatus =
  | 'matches_found'
  | 'no_matches_in_dataset'
  | 'unable_to_check'
  | 'needs_review';

export interface InteractionEvidence {
  evidenceId: string;
  drugA: string;
  drugB: string;
  knownAliases: string[];
  knownAliasesA?: string[];
  knownAliasesB?: string[];
  interactionDescription: string;
  evidenceExplanation: string;
  clinicalSignificance: ClinicalSignificance;
  recommendedAction: string;
  sourceTitle: string;
  sourceUrl: string;
  supportingExcerpt: string;
  verificationStatus: string;
  reviewDate: string;
}

export interface DailyMedLookupResult {
  drugName: string;
  lookupStatus: 'success' | 'not_found' | 'failed' | 'timeout';
  title?: string;
  setId?: string;
  dailyMedUrl?: string;
  publishedDate?: string;
}

export interface MatchedInteraction {
  evidence: InteractionEvidence;
  medicationA: {
    id: string;
    brandName: string;
    genericName: string;
    dosage: string;
  };
  medicationB: {
    id: string;
    brandName: string;
    genericName: string;
    dosage: string;
  };
  plainLanguageExplanation: string;
  explanationSource: 'gemini_grounded' | 'deterministic_fallback';
  dailyMedLookups: DailyMedLookupResult[];
}

export interface UnresolvedIssue {
  type: 'duplicate_medication' | 'ambiguous_name' | 'missing_fields';
  medicationName: string;
  message: string;
}

export interface SafetyCheckResponse {
  success: boolean;
  status: SafetyCheckStatus;
  statusLabel: string;
  statusDescription: string;
  totalMedicationsChecked: number;
  matchedInteractions: MatchedInteraction[];
  unmatchedMedications: string[];
  unresolvedIssues: UnresolvedIssue[];
  datasetCoverageNotice: string;
  checkedAt: string;
  disclaimer: string;
}

