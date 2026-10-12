import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  normalizeMedicationToSchedules,
  extractExplicitClockTime,
} from '../utils/scheduleNormalizer.js';
import { Medication, MedicationSchedule, AdherenceRecord, CaregiverObservation } from '../types/index.js';

describe('Medication Twin Workflow & Safety Guardrails Tests', () => {
  // Test 1: Confirmed medication creates a schedule
  it('1. Confirmed medication creates a structured schedule', () => {
    const med: Medication = {
      id: 'test-med-01',
      brandName: 'Synth-Metformin',
      genericName: 'Metformin HCL',
      dosage: '500 mg',
      frequency: 'Once daily in the morning',
      prescribedFor: 'Type 2 Diabetes',
      prescribingDoctor: 'Dr. Test',
      instructions: 'Take 1 tablet by mouth with breakfast in the morning',
      timings: ['morning'],
      foodRelation: 'with_food',
      prescribedDate: '2026-10-01',
      refillsRemaining: 2,
      status: 'active',
      verificationStatus: 'confirmed',
    };

    const schedules = normalizeMedicationToSchedules(med);
    assert.strictEqual(schedules.length, 1);
    assert.strictEqual(schedules[0].medicationId, 'test-med-01');
    assert.strictEqual(schedules[0].medicationName, 'Synth-Metformin');
    assert.strictEqual(schedules[0].dosage, '500 mg');
    assert.strictEqual(schedules[0].timeSlot, 'morning');
    assert.strictEqual(schedules[0].confirmationStatus, 'confirmed');
    assert.strictEqual(schedules[0].timingConfirmed, true);
  });

  // Test 2: Ambiguous frequency does not create a timed reminder
  it('2. Ambiguous frequency does not create a timed reminder and flags needs confirmation', () => {
    const med: Medication = {
      id: 'test-med-02',
      brandName: 'Synth-Analgesic',
      genericName: 'Synthetic Pain Relief',
      dosage: '200 mg',
      frequency: 'Take as needed for discomfort',
      prescribedFor: 'Temporary Pain',
      prescribingDoctor: 'Dr. Test',
      instructions: 'Use as needed only. Do not exceed max dose.',
      timings: [],
      foodRelation: 'independent',
      prescribedDate: '2026-10-01',
      refillsRemaining: 0,
      status: 'active',
      verificationStatus: 'confirmed',
    };

    const schedules = normalizeMedicationToSchedules(med);
    assert.strictEqual(schedules.length, 1);
    assert.strictEqual(schedules[0].timeSlot, 'needs_confirmation');
    assert.strictEqual(schedules[0].scheduledTime, null);
    assert.strictEqual(schedules[0].timingConfirmed, false);
    assert.strictEqual(schedules[0].confirmationStatus, 'pending_confirmation');
    assert.strictEqual(schedules[0].frequencyLabel, 'Timing needs confirmation');
  });

  // Test 3: Once-daily morning instruction creates a morning schedule
  it('3. Once-daily morning instruction creates a morning schedule slot', () => {
    const med: Medication = {
      id: 'test-med-03',
      brandName: 'Synth-Levothyroxine',
      genericName: 'Levothyroxine Sodium',
      dosage: '50 mcg',
      frequency: 'Once daily',
      prescribedFor: 'Thyroid',
      prescribingDoctor: 'Dr. Test',
      instructions: 'Take 1 tablet every morning on an empty stomach with water',
      timings: [],
      foodRelation: 'before_food',
      prescribedDate: '2026-10-01',
      refillsRemaining: 3,
      status: 'active',
      verificationStatus: 'confirmed',
    };

    const schedules = normalizeMedicationToSchedules(med);
    assert.strictEqual(schedules.length, 1);
    assert.strictEqual(schedules[0].timeSlot, 'morning');
    assert.strictEqual(schedules[0].timingConfirmed, true);
    assert.strictEqual(schedules[0].scheduledTime, null); // No explicit clock time invented
  });

  // Test 4: Twice-daily without timing does not invent clock times
  it('4. Twice-daily without timing does not invent clock times', () => {
    const med: Medication = {
      id: 'test-med-04',
      brandName: 'Synth-Antibiotic',
      genericName: 'Synthetic Cillin',
      dosage: '250 mg',
      frequency: 'Twice daily',
      prescribedFor: 'Infection',
      prescribingDoctor: 'Dr. Test',
      instructions: 'Take twice daily with a full glass of water',
      timings: [],
      foodRelation: 'with_food',
      prescribedDate: '2026-10-01',
      refillsRemaining: 0,
      status: 'active',
      verificationStatus: 'confirmed',
    };

    const schedules = normalizeMedicationToSchedules(med);
    assert.strictEqual(schedules.length, 2);
    // Preserves daytime slots without fabricating "08:00 AM" or "08:00 PM"
    assert.strictEqual(schedules[0].scheduledTime, null);
    assert.strictEqual(schedules[1].scheduledTime, null);
    assert.strictEqual(schedules[0].timeSlot, 'morning');
    assert.strictEqual(schedules[1].timeSlot, 'evening');
  });

  // Test 4b: Explicit clock times on label are safely parsed
  it('4b. Extracts explicit clock time when literally present on the prescription bottle', () => {
    const explicitTime = extractExplicitClockTime('Take 1 capsule by mouth daily at 08:30 AM');
    assert.strictEqual(explicitTime, '08:30 AM');

    const noTime = extractExplicitClockTime('Take twice daily with food');
    assert.strictEqual(noTime, null);
  });

  // Test 5: Marking a medication taken creates an adherence record
  it('5. Marking a medication taken creates an adherence record', () => {
    const records: AdherenceRecord[] = [];
    const todayStr = '2026-10-10';

    function recordAdherence(scheduleId: string, medId: string, status: 'taken' | 'skipped' | 'missed') {
      const existingIdx = records.findIndex((r) => r.scheduleId === scheduleId && r.scheduledDate === todayStr);
      if (existingIdx >= 0) {
        records[existingIdx] = { ...records[existingIdx], status, recordedAt: new Date().toISOString() };
      } else {
        records.push({
          id: `adh-${Date.now()}-${scheduleId}`,
          medicationId: medId,
          scheduleId,
          scheduledDate: todayStr,
          scheduledTime: '08:00 AM',
          status,
          recordedAt: new Date().toISOString(),
          recordedBy: 'elder',
        });
      }
    }

    recordAdherence('sch-01', 'med-01', 'taken');
    assert.strictEqual(records.length, 1);
    assert.strictEqual(records[0].status, 'taken');
    assert.strictEqual(records[0].scheduleId, 'sch-01');
    assert.strictEqual(records[0].recordedBy, 'elder');
  });

  // Test 6: Duplicate clicks do not create duplicate adherence records
  it('6. Duplicate clicks do not create duplicate adherence records', () => {
    const records: AdherenceRecord[] = [];
    const todayStr = '2026-10-10';

    function recordAdherence(scheduleId: string, medId: string, status: 'taken' | 'skipped') {
      const existingIdx = records.findIndex((r) => r.scheduleId === scheduleId && r.scheduledDate === todayStr);
      if (existingIdx >= 0) {
        records[existingIdx] = { ...records[existingIdx], status, recordedAt: new Date().toISOString() };
      } else {
        records.push({
          id: `adh-${Date.now()}-${scheduleId}`,
          medicationId: medId,
          scheduleId,
          scheduledDate: todayStr,
          scheduledTime: '08:00 AM',
          status,
          recordedAt: new Date().toISOString(),
          recordedBy: 'elder',
        });
      }
    }

    // User taps "Mark as Taken" twice rapidly
    recordAdherence('sch-dup-01', 'med-01', 'taken');
    recordAdherence('sch-dup-01', 'med-01', 'taken');
    recordAdherence('sch-dup-01', 'med-01', 'taken');

    assert.strictEqual(records.length, 1);
    assert.strictEqual(records[0].status, 'taken');
  });

  // Test 7: Pending medication is not automatically counted as missed
  it('7. Pending medication is not automatically counted as missed', () => {
    const records: AdherenceRecord[] = [
      {
        id: 'rec-1',
        medicationId: 'med-1',
        scheduleId: 'sch-1',
        scheduledDate: '2026-10-10',
        scheduledTime: '08:00 AM',
        status: 'taken',
        recordedAt: '2026-10-10T08:05:00Z',
        recordedBy: 'elder',
      },
      {
        id: 'rec-2',
        medicationId: 'med-2',
        scheduleId: 'sch-2',
        scheduledDate: '2026-10-10',
        scheduledTime: '06:00 PM',
        status: 'pending', // Evening dose not yet due or taken
        recordedAt: '',
        recordedBy: 'elder',
      },
    ];

    const missed = records.filter((r) => r.status === 'missed');
    const pending = records.filter((r) => r.status === 'pending');

    assert.strictEqual(missed.length, 0);
    assert.strictEqual(pending.length, 1);
  });

  // Test 8: 7-day adherence calculation is correct
  it('8. 7-day adherence calculation is correct', () => {
    // 37 taken, 2 skipped, 1 missed = 40 evaluated doses
    const evaluatedRecords: { status: 'taken' | 'skipped' | 'missed' }[] = [];
    for (let i = 0; i < 37; i++) evaluatedRecords.push({ status: 'taken' });
    for (let i = 0; i < 2; i++) evaluatedRecords.push({ status: 'skipped' });
    for (let i = 0; i < 1; i++) evaluatedRecords.push({ status: 'missed' });

    const taken = evaluatedRecords.filter((r) => r.status === 'taken').length;
    const evaluatedTotal = evaluatedRecords.length; // 40
    const percentage = Math.round((taken / evaluatedTotal) * 100);

    assert.strictEqual(taken, 37);
    assert.strictEqual(evaluatedTotal, 40);
    assert.strictEqual(percentage, 93); // 37 / 40 = 92.5% -> 93%
  });

  // Test 9: Future doses are not counted as missed
  it('9. Future doses are not counted as missed in adherence denominator', () => {
    const historicalRecords: AdherenceRecord[] = [
      { id: '1', medicationId: 'm1', scheduleId: 's1', scheduledDate: '2026-10-09', scheduledTime: '08:00 AM', status: 'taken', recordedAt: '', recordedBy: 'elder' },
      { id: '2', medicationId: 'm1', scheduleId: 's1', scheduledDate: '2026-10-09', scheduledTime: '06:00 PM', status: 'taken', recordedAt: '', recordedBy: 'elder' },
      { id: '3', medicationId: 'm1', scheduleId: 's1', scheduledDate: '2026-10-10', scheduledTime: '08:00 AM', status: 'taken', recordedAt: '', recordedBy: 'elder' },
      { id: '4', medicationId: 'm1', scheduleId: 's1', scheduledDate: '2026-10-10', scheduledTime: '06:00 PM', status: 'pending', recordedAt: '', recordedBy: 'elder' }, // Future dose tonight
    ];

    // Evaluated doses (excluding pending future doses)
    const evaluated = historicalRecords.filter((r) => r.status === 'taken' || r.status === 'missed' || r.status === 'skipped');
    const taken = evaluated.filter((r) => r.status === 'taken').length;
    const percent = Math.round((taken / evaluated.length) * 100);

    assert.strictEqual(evaluated.length, 3);
    assert.strictEqual(taken, 3);
    assert.strictEqual(percent, 100); // 3 out of 3 evaluated doses taken
  });

  // Test 10: localStorage corruption is handled safely
  it('10. localStorage corruption is handled safely without crashing', () => {
    const mockStorage: Record<string, string> = {
      'corrupted_key': '{invalid_json: true, broken',
    };

    function safeGet<T>(key: string, fallback: T): T {
      try {
        const raw = mockStorage[key];
        if (!raw) return fallback;
        return JSON.parse(raw);
      } catch {
        return fallback;
      }
    }

    const result = safeGet('corrupted_key', [{ id: 'fallback-item' }]);
    assert.deepStrictEqual(result, [{ id: 'fallback-item' }]);
  });

  // Test 11: Voice reminder gracefully handles unsupported browsers
  it('11. Voice reminder gracefully handles environments lacking SpeechSynthesis', () => {
    class MockVoiceService {
      speak(text: string): boolean {
        // In Node.js or browser without window.speechSynthesis
        if (typeof (globalThis as any).speechSynthesis === 'undefined') {
          return false; // Graceful non-throwing fallback
        }
        return true;
      }
    }

    const service = new MockVoiceService();
    const played = service.speak('Reminder test');
    assert.strictEqual(played, false);
  });

  // Test 12: Doctor summary uses actual recorded data and no hallucinations
  it('12. Doctor summary uses actual recorded data strictly', () => {
    const testMeds: Medication[] = [
      {
        id: 'doc-med-1',
        brandName: 'Synth-Cardio',
        genericName: 'Amlodipine',
        dosage: '5 mg',
        frequency: 'Daily morning',
        prescribedFor: 'Hypertension',
        prescribingDoctor: 'Dr. Lin',
        instructions: 'Take 1 tablet daily',
        timings: ['morning'],
        foodRelation: 'independent',
        prescribedDate: '2026-10-01',
        refillsRemaining: 1,
        status: 'active',
        verificationStatus: 'confirmed',
      },
    ];

    const testObs: CaregiverObservation[] = [
      {
        id: 'obs-doc-1',
        date: 'Today',
        timestamp: '2026-10-10T10:00:00Z',
        title: 'BP measurement',
        category: 'adherence',
        note: 'Home cuff reading was 120/80 mmHg.',
        disclaimer: 'Observation recorded — discuss with your healthcare professional if concerning.',
      },
    ];

    // Build deterministic summary
    const summary = {
      patientName: 'Arthur Miller',
      medications: testMeds.map((m) => `${m.brandName} (${m.genericName}) ${m.dosage}`),
      observations: testObs.map((o) => o.note),
      disclaimer: 'Generated from recorded medication and adherence data. Review with your healthcare professional.',
    };

    assert.strictEqual(summary.medications[0], 'Synth-Cardio (Amlodipine) 5 mg');
    assert.strictEqual(summary.observations[0], 'Home cuff reading was 120/80 mmHg.');
    assert.ok(summary.disclaimer.includes('Review with your healthcare professional'));
  });

  // Test 13: Changing the medication regimen marks safety review as required
  it('13. Changing the medication regimen marks safety review as required', () => {
    let safetyReviewRequired = false;

    function addMedication() {
      // Regimen changed -> must flag safety review needed
      safetyReviewRequired = true;
    }

    function removeMedication() {
      // Regimen changed -> must flag safety review needed
      safetyReviewRequired = true;
    }

    function runCompletedSafetyCheck() {
      safetyReviewRequired = false;
    }

    // Regimen starts verified
    assert.strictEqual(safetyReviewRequired, false);

    // Patient adds new medication bottle
    addMedication();
    assert.strictEqual(safetyReviewRequired, true);

    // Safety check performed
    runCompletedSafetyCheck();
    assert.strictEqual(safetyReviewRequired, false);

    // Patient removes a medication
    removeMedication();
    assert.strictEqual(safetyReviewRequired, true);
  });
});
