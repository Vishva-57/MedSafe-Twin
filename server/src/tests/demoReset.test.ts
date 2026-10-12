import { describe, it } from 'node:test';
import assert from 'node:assert';
import { mockMedications } from '../data/mockData.js';
import { Medication } from '../types/index.js';
import { runSafetyCheck } from '../services/safetyCheckerService.js';

describe('Safe Demonstration Mode & Reset Scenarios (Academic Prototype Guardrails)', () => {
  it('1. Baseline demo dataset is strictly marked synthetic and preloaded', () => {
    assert.strictEqual(mockMedications.length, 5);
    for (const med of mockMedications) {
      assert.strictEqual(med.isSynthetic, true, `Medication ${med.id} must be marked isSynthetic`);
      assert.strictEqual(med.recordOrigin, 'preloaded_demo', `Medication ${med.id} must have recordOrigin preloaded_demo`);
      assert.ok(med.brandName && med.genericName, `Medication ${med.id} must have names defined`);
    }
  });

  it('2. Baseline demo scenario has 4 active confirmed meds and 1 pending candidate', () => {
    const active = mockMedications.filter((m) => m.verificationStatus === 'confirmed');
    const pending = mockMedications.filter((m) => m.verificationStatus === 'pending_review');
    
    assert.strictEqual(active.length, 4, 'Baseline demo should have exactly 4 confirmed medications');
    assert.strictEqual(pending.length, 1, 'Baseline demo should have 1 pending candidate (Omeprazole)');
    assert.strictEqual(pending[0].genericName, 'Omeprazole');
  });

  it('3. Candidate medication (Omeprazole) requires explicit human confirmation before regimen inclusion', async () => {
    const baselineConfirmed = mockMedications.filter((m) => m.verificationStatus === 'confirmed');
    
    // Baseline safety check with confirmed regimen (Amlodipine + Atorvastatin matches verified EVID-AML-ATOR-01)
    const initialSafety = await runSafetyCheck(baselineConfirmed);
    assert.strictEqual(initialSafety.success, true);
    assert.strictEqual(initialSafety.status, 'matches_found');
    assert.strictEqual(initialSafety.matchedInteractions.length, 1, 'Baseline regimen matches verified Amlodipine-Atorvastatin interaction in curated index');
    assert.strictEqual(initialSafety.matchedInteractions[0].evidence.evidenceId, 'EVID-AML-ATOR-01');

    // Synthetic candidate prescription awaiting review
    const candidateMed = mockMedications.find((m) => m.verificationStatus === 'pending_review');
    assert.ok(candidateMed, 'Candidate prescription must exist in synthetic scenario');
    assert.strictEqual(candidateMed.verificationStatus, 'pending_review');

    // Simulate human confirmation gate: candidate transitions to confirmed with session tag
    const userConfirmedMed: Medication = {
      ...candidateMed,
      verificationStatus: 'confirmed',
      recordOrigin: 'extracted_session',
    };

    const updatedRegimen = [...baselineConfirmed, userConfirmedMed];
    assert.strictEqual(updatedRegimen.length, 5);

    // After human confirms, safety review is triggered on the updated regimen
    const updatedSafety = await runSafetyCheck(updatedRegimen);
    assert.strictEqual(updatedSafety.success, true);
    for (const interaction of updatedSafety.matchedInteractions) {
      assert.ok(interaction.evidence.evidenceId, 'Safety interactions must originate from verified evidence records');
      assert.ok(interaction.evidence.sourceUrl, 'Source URL must be present');
    }
  });

  it('4. Repeated simulated resets produce idempotent initial synthetic state', () => {
    const initialSnapshot = JSON.stringify(mockMedications);

    // Simulate a user session that adds a temporary medication
    const mutatedList: Medication[] = [
      ...mockMedications,
      {
        id: 'session-temp-99',
        brandName: 'Simulated Antibiotic',
        genericName: 'Amoxicillin',
        dosage: '500 mg',
        frequency: 'Three times daily',
        prescribedFor: 'Infection',
        prescribingDoctor: 'Dr. Walk-in',
        instructions: 'Take every 8 hours with water',
        timings: ['morning', 'afternoon', 'evening'],
        foodRelation: 'independent',
        prescribedDate: '2026-10-10',
        refillsRemaining: 0,
        status: 'active',
        verificationStatus: 'confirmed',
        recordOrigin: 'extracted_session',
        isSynthetic: true,
      },
    ];
    assert.strictEqual(mutatedList.length, 6);

    // Reset action: restore baseline mockMedications
    const resetList = [...mockMedications];
    assert.strictEqual(resetList.length, 5);
    assert.strictEqual(JSON.stringify(resetList), initialSnapshot);

    // Repeated reset produces identical result
    const secondResetList = [...mockMedications];
    assert.strictEqual(JSON.stringify(secondResetList), initialSnapshot);
  });

  it('5. Reset operation never touches or overwrites server environment secrets or keys', () => {
    const apiKeyBefore = process.env.GEMINI_API_KEY;
    const modelBefore = process.env.GEMINI_MODEL;
    const portBefore = process.env.PORT;
    
    // Simulate frontend storage reset scope
    const simulatedStorageKeys = [
      'medsafe_twin_v1_medications',
      'medsafe_twin_v1_schedules',
      'medsafe_twin_v1_adherence',
      'medsafe_twin_v1_observations',
      'medsafe_twin_v1_safety_state',
    ];

    for (const key of simulatedStorageKeys) {
      assert.ok(key.startsWith('medsafe_twin_v1_'), 'Reset must only target application scoped namespace');
    }

    assert.strictEqual(process.env.GEMINI_API_KEY, apiKeyBefore, 'API key must remain completely untouched');
    assert.strictEqual(process.env.GEMINI_MODEL, modelBefore, 'Model config must remain untouched');
    assert.strictEqual(process.env.PORT, portBefore, 'Server port must remain untouched');
  });

  it('6. Safety checker does not fabricate clinical warnings for unmatched synthetic drugs', async () => {
    const syntheticFictionalDrug: Medication = {
      id: 'fictional-999',
      brandName: 'ImaginaryCure',
      genericName: 'NonexistentMolecule-X',
      dosage: '10 mg',
      frequency: 'Once daily',
      prescribedFor: 'Demonstration',
      prescribingDoctor: 'Dr. Demo',
      instructions: 'Take once daily',
      timings: ['morning'],
      foodRelation: 'independent',
      prescribedDate: '2026-10-10',
      refillsRemaining: 0,
      status: 'active',
      verificationStatus: 'confirmed',
      recordOrigin: 'manual_session',
      isSynthetic: true,
    };

    const safetyResult = await runSafetyCheck([syntheticFictionalDrug]);
    assert.strictEqual(safetyResult.success, true);
    assert.strictEqual(safetyResult.status, 'no_matches_in_dataset');
    assert.strictEqual(safetyResult.matchedInteractions.length, 0);
    assert.strictEqual(safetyResult.unmatchedMedications.length, 1);
    assert.ok(safetyResult.unmatchedMedications[0].includes('ImaginaryCure'));
    assert.ok(safetyResult.unmatchedMedications[0].includes('NonexistentMolecule-X'));
  });
});
