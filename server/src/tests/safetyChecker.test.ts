import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  runSafetyCheck,
  normalizeDrugString,
  matchesDrugIdentity,
} from '../services/safetyCheckerService.js';
import {
  syntheticTestEvidenceDataset,
  syntheticValidMeds,
} from './fixtures/syntheticSafetyFixtures.js';
import { Medication } from '../types/index.js';

describe('Deterministic Safety Checker Unit Tests', () => {
  it('normalizes drug names correctly by stripping salts and punctuation', () => {
    assert.strictEqual(normalizeDrugString('Amlodipine Besylate 5mg'), 'amlodipine 5mg');
    assert.strictEqual(normalizeDrugString('Metformin Hydrochloride (Glucophage)'), 'metformin glucophage');
    assert.strictEqual(normalizeDrugString('Prilosec OTC Delayed-Release Tablets'), 'prilosec');
  });

  it('matches drug identity accurately using token boundaries', () => {
    const isMatch = matchesDrugIdentity('Norvasc Amlodipine Besylate', 'amlodipine', ['norvasc']);
    assert.strictEqual(isMatch, true);

    const isNonMatch = matchesDrugIdentity('Atorvastatin Calcium', 'amlodipine', ['norvasc']);
    assert.strictEqual(isNonMatch, false);

    // Empty or bogus names should never match
    assert.strictEqual(matchesDrugIdentity('', 'amlodipine', []), false);
    assert.strictEqual(matchesDrugIdentity('pill', '', []), false);
  });

  it('detects a verified interaction match using a synthetic test fixture', async () => {
    const response = await runSafetyCheck(syntheticValidMeds, syntheticTestEvidenceDataset);

    assert.strictEqual(response.success, true);
    assert.strictEqual(response.status, 'matches_found');
    assert.strictEqual(response.matchedInteractions.length, 1);

    const match = response.matchedInteractions[0];
    assert.strictEqual(match.evidence.evidenceId, 'SYNTH-MOCK-DRUG-PAIR-01');
    assert.strictEqual(match.medicationA.brandName, 'Alpha-Pill');
    assert.strictEqual(match.medicationB.brandName, 'Beta-Tablet');
  });

  it('preserves exact authoritative source links and supporting excerpts', async () => {
    const response = await runSafetyCheck(syntheticValidMeds, syntheticTestEvidenceDataset);

    const match = response.matchedInteractions[0];
    assert.strictEqual(match.evidence.sourceUrl, 'https://example.org/synthetic-test-spec');
    assert.strictEqual(match.evidence.sourceTitle, 'Mock Automated Testing Reference Specification 2026');
    assert.ok(match.evidence.supportingExcerpt.includes('interact under test conditions'));
  });

  it('correctly reports no_matches_in_dataset without ever claiming regimen is safe', async () => {
    const safeLookingMeds: Medication[] = [
      {
        id: 'med-unk-1',
        brandName: 'Vitamin C',
        genericName: 'Ascorbic Acid',
        dosage: '500 mg',
        frequency: 'Daily',
        prescribedFor: 'General Health',
        prescribingDoctor: 'Dr. Self',
        instructions: 'Take daily',
        timings: ['morning'],
        foodRelation: 'independent',
        prescribedDate: '2026-01-01',
        refillsRemaining: 0,
        status: 'active',
        verificationStatus: 'confirmed',
      },
      {
        id: 'med-unk-2',
        brandName: 'Vitamin D3',
        genericName: 'Cholecalciferol',
        dosage: '1000 IU',
        frequency: 'Daily',
        prescribedFor: 'Bone Health',
        prescribingDoctor: 'Dr. Self',
        instructions: 'Take daily',
        timings: ['morning'],
        foodRelation: 'independent',
        prescribedDate: '2026-01-01',
        refillsRemaining: 0,
        status: 'active',
        verificationStatus: 'confirmed',
      },
    ];

    const response = await runSafetyCheck(safeLookingMeds, syntheticTestEvidenceDataset);

    assert.strictEqual(response.status, 'no_matches_in_dataset');
    assert.notStrictEqual(response.status, 'safe');
    assert.ok(response.statusLabel.includes('No Matches in Current Curated Dataset'));
    assert.ok(response.statusDescription.includes('does NOT verify safety'));
    assert.strictEqual(response.matchedInteractions.length, 0);
    assert.strictEqual(response.unmatchedMedications.length, 2);
  });

  it('identifies unknown medications as unmatched items', async () => {
    const mixedMeds: Medication[] = [
      syntheticValidMeds[0], // Alpha-Pill
      {
        id: 'med-mystery',
        brandName: 'UnknownHerbalExtract',
        genericName: 'BotanicalBlend',
        dosage: '250 mg',
        frequency: 'Once daily',
        prescribedFor: 'Supplements',
        prescribingDoctor: 'N/A',
        instructions: 'Take with food',
        timings: ['morning'],
        foodRelation: 'with_food',
        prescribedDate: '2026-01-01',
        refillsRemaining: 0,
        status: 'active',
        verificationStatus: 'pending_review',
      },
    ];

    const response = await runSafetyCheck(mixedMeds, syntheticTestEvidenceDataset);

    // Alpha-Pill + UnknownHerbalExtract has no matching pair in synthetic dataset
    assert.strictEqual(response.status, 'no_matches_in_dataset');
    assert.strictEqual(response.matchedInteractions.length, 0);
    assert.strictEqual(response.unmatchedMedications.length, 2);
  });

  it('detects duplicate medication entries', async () => {
    const duplicateMeds: Medication[] = [
      syntheticValidMeds[0],
      {
        ...syntheticValidMeds[0],
        id: 'test-med-01-dup',
        brandName: 'Alpha-Pill Generic',
      },
    ];

    const response = await runSafetyCheck(duplicateMeds, syntheticTestEvidenceDataset);

    assert.strictEqual(response.status, 'needs_review');
    const duplicateIssue = response.unresolvedIssues.find((i) => i.type === 'duplicate_medication');
    assert.ok(duplicateIssue, 'Must flag duplicate medication entry');
    assert.ok(duplicateIssue.message.includes('Potential duplicate'));
  });

  it('flags ambiguous medication identity with missing brand and generic names', async () => {
    const ambiguousMeds: Medication[] = [
      {
        id: 'ambig-01',
        brandName: '',
        genericName: '',
        dosage: '10 mg',
        frequency: 'Daily',
        prescribedFor: 'Unknown',
        prescribingDoctor: 'Unknown',
        instructions: 'Take daily',
        timings: ['morning'],
        foodRelation: 'independent',
        prescribedDate: '2026-01-01',
        refillsRemaining: 0,
        status: 'active',
        verificationStatus: 'pending_review',
      },
    ];

    const response = await runSafetyCheck(ambiguousMeds, syntheticTestEvidenceDataset);

    assert.strictEqual(response.status, 'needs_review');
    const issue = response.unresolvedIssues.find((i) => i.type === 'ambiguous_name');
    assert.ok(issue, 'Must flag missing drug identity names');
  });

  it('handles empty or invalid medication input safely', async () => {
    const response = await runSafetyCheck([]);

    assert.strictEqual(response.status, 'unable_to_check');
    assert.strictEqual(response.totalMedicationsChecked, 0);
    assert.ok(response.statusLabel.includes('Unable to Check'));
  });

  it('safely provides deterministic fallback when Gemini explanation is unavailable', async () => {
    // When environment variable is unconfigured or in offline fallback mode
    const origKey = process.env.GEMINI_API_KEY;
    try {
      process.env.GEMINI_API_KEY = '';
      const response = await runSafetyCheck(syntheticValidMeds, syntheticTestEvidenceDataset);

      assert.strictEqual(response.matchedInteractions.length, 1);
      const match = response.matchedInteractions[0];
      assert.strictEqual(match.explanationSource, 'deterministic_fallback');
      assert.ok(match.plainLanguageExplanation.includes('Synthetic pharmacological explanation'));
      assert.ok(match.plainLanguageExplanation.includes('evaluate test pairing'));
    } finally {
      process.env.GEMINI_API_KEY = origKey;
    }
  });
});
