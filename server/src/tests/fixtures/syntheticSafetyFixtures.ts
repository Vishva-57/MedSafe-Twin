import { InteractionEvidence, Medication } from '../../types/index.js';

/**
 * SYNTHETIC TEST FIXTURES ONLY
 * Notice: These test fixtures are purely synthetic mock records created for unit testing the
 * deterministic matching engine and data validation rules. They MUST NEVER be presented
 * as verified clinical evidence.
 */

export const syntheticTestEvidenceDataset: InteractionEvidence[] = [
  {
    evidenceId: 'SYNTH-MOCK-DRUG-PAIR-01',
    drugA: 'testdrugalpha',
    drugB: 'testdrugbeta',
    knownAliases: ['alpha-pill', 'beta-tablet'],
    knownAliasesA: ['alpha-pill'],
    knownAliasesB: ['beta-tablet'],
    interactionDescription: 'Synthetic test interaction description for automated unit tests.',
    evidenceExplanation: 'Synthetic pharmacological explanation for test verification.',
    clinicalSignificance: 'major',
    recommendedAction: 'Synthetic test clinical action: evaluate test pairing.',
    sourceTitle: 'Mock Automated Testing Reference Specification 2026',
    sourceUrl: 'https://example.org/synthetic-test-spec',
    supportingExcerpt: 'Synthetic test excerpt: drug alpha and drug beta interact under test conditions.',
    verificationStatus: 'synthetic_test_fixture',
    reviewDate: '2026-01-01',
  },
];

export const syntheticValidMeds: Medication[] = [
  {
    id: 'test-med-01',
    brandName: 'Alpha-Pill',
    genericName: 'TestDrugAlpha',
    dosage: '10 mg',
    frequency: 'Once daily',
    prescribedFor: 'Test Condition',
    prescribingDoctor: 'Dr. Test',
    instructions: 'Take with water',
    timings: ['morning'],
    foodRelation: 'independent',
    prescribedDate: '2026-01-01',
    refillsRemaining: 1,
    status: 'active',
    verificationStatus: 'confirmed',
  },
  {
    id: 'test-med-02',
    brandName: 'Beta-Tablet',
    genericName: 'TestDrugBeta',
    dosage: '25 mg',
    frequency: 'Once daily',
    prescribedFor: 'Test Condition',
    prescribingDoctor: 'Dr. Test',
    instructions: 'Take at night',
    timings: ['bedtime'],
    foodRelation: 'independent',
    prescribedDate: '2026-01-01',
    refillsRemaining: 1,
    status: 'active',
    verificationStatus: 'confirmed',
  },
];
