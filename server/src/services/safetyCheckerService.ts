import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  Medication,
  InteractionEvidence,
  MatchedInteraction,
  SafetyCheckResponse,
  SafetyCheckStatus,
  UnresolvedIssue,
  DailyMedLookupResult,
} from '../types/index.js';
import { lookupDailyMedLabel, cleanDrugNameForLookup } from './dailyMedService.js';
import { explainInteractionEvidence } from './geminiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load curated evidence index
const evidencePath = path.resolve(__dirname, '../data/interactionEvidence.json');
let curatedEvidence: InteractionEvidence[] = [];

try {
  const fileContent = fs.readFileSync(evidencePath, 'utf-8');
  const parsed = JSON.parse(fileContent);
  curatedEvidence = parsed.records || [];
} catch (err) {
  console.error('[SafetyChecker] Warning: Failed to load interactionEvidence.json:', err);
}

/**
 * Normalizes drug name strings by stripping common dosage salt forms and extra punctuation.
 */
export function normalizeDrugString(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b(hcl|hydrochloride|besylate|calcium|potassium|sodium|succinate|maleate|tartrate|fumarate|otc|dr|delayed-release|tablets?|capsules?)\b/gi, '')
    .replace(/[^a-z0-9]/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Checks if a candidate medication string matches a target normalized drug or any of its known aliases.
 * Uses exact token or multi-word boundary matching (never loose substring containment).
 */
export function matchesDrugIdentity(
  candidate: string,
  targetDrug: string,
  aliases: string[]
): boolean {
  const normCandidate = normalizeDrugString(candidate);
  const normTarget = normalizeDrugString(targetDrug);

  if (!normCandidate || !normTarget) return false;

  // Exact full string match
  if (normCandidate === normTarget) return true;

  // Distinct whole-word token match
  const candidateWords = normCandidate.split(/\s+/);
  if (candidateWords.includes(normTarget)) return true;

  // Multi-word target match (e.g. "losartan potassium")
  if (normTarget.includes(' ') && normCandidate.includes(normTarget)) return true;

  // Check aliases strictly
  for (const alias of aliases) {
    const normAlias = normalizeDrugString(alias);
    if (!normAlias) continue;
    if (normCandidate === normAlias) return true;
    if (candidateWords.includes(normAlias)) return true;
    if (normAlias.includes(' ') && normCandidate.includes(normAlias)) return true;
  }

  return false;
}

/**
 * Deterministic Safety Checking Engine.
 * Evaluates medication pairs strictly against verified evidence.
 * Gemini is NEVER used to decide whether an interaction exists.
 */
export async function runSafetyCheck(
  medications: Medication[],
  evidenceDataset: InteractionEvidence[] = curatedEvidence
): Promise<SafetyCheckResponse> {
  const checkedAt = new Date().toISOString();
  const disclaimer =
    'Academic Demonstration Only: This safety checker searches a limited, curated index of verified interaction pairs. Absence of an interaction alert does NOT indicate that your regimen is safe or free of adverse interactions. Always review your complete medication regimen with your prescribing physician or clinical pharmacist.';
  const datasetCoverageNotice =
    `Current curated dataset index contains ${evidenceDataset.length} verified interaction records based on official FDA package inserts and DailyMed documentation.`;

  // 1. Validation & Input Sanity
  if (!Array.isArray(medications) || medications.length === 0) {
    return {
      success: true,
      status: 'unable_to_check',
      statusLabel: 'Unable to Check',
      statusDescription: 'No active medications provided for evaluation.',
      totalMedicationsChecked: 0,
      matchedInteractions: [],
      unmatchedMedications: [],
      unresolvedIssues: [
        {
          type: 'missing_fields',
          medicationName: 'N/A',
          message: 'The medication regimen is empty. Please add or scan medications first.',
        },
      ],
      datasetCoverageNotice,
      checkedAt,
      disclaimer,
    };
  }

  const unresolvedIssues: UnresolvedIssue[] = [];
  const validMeds: Medication[] = [];
  const seenIdentities = new Map<string, string>(); // normName -> originalName

  // 2. Data Quality & Duplication Detection
  for (const med of medications) {
    const brand = med.brandName?.trim() || '';
    const generic = med.genericName?.trim() || '';
    const displayName = brand || generic || 'Unnamed Medication';

    if (!brand && !generic) {
      unresolvedIssues.push({
        type: 'ambiguous_name',
        medicationName: displayName,
        message: 'Medication entry is missing both brand and generic active ingredient names.',
      });
      continue;
    }

    if (!med.dosage || med.dosage.trim() === '') {
      unresolvedIssues.push({
        type: 'missing_fields',
        medicationName: displayName,
        message: 'Dosage or strength is not specified.',
      });
    }

    // Check duplicates
    const normIdentity = normalizeDrugString(generic || brand);
    if (seenIdentities.has(normIdentity)) {
      unresolvedIssues.push({
        type: 'duplicate_medication',
        medicationName: displayName,
        message: `Potential duplicate or multiple entries detected for ingredient: "${displayName}" and "${seenIdentities.get(normIdentity)}".`,
      });
    } else {
      seenIdentities.set(normIdentity, displayName);
    }

    validMeds.push(med);
  }

  // Cache DailyMed lookups during this request
  const dailyMedCache = new Map<string, DailyMedLookupResult>();
  async function getCachedDailyMed(name: string): Promise<DailyMedLookupResult> {
    const key = cleanDrugNameForLookup(name);
    if (dailyMedCache.has(key)) {
      return dailyMedCache.get(key)!;
    }
    const res = await lookupDailyMedLabel(name);
    dailyMedCache.set(key, res);
    return res;
  }

  // 3. Pairwise Deterministic Evidence Matching
  const matchedInteractions: MatchedInteraction[] = [];
  const matchedMedIds = new Set<string>();

  for (let i = 0; i < validMeds.length; i++) {
    for (let j = i + 1; j < validMeds.length; j++) {
      const medA = validMeds[i];
      const medB = validMeds[j];

      const normA = normalizeDrugString(medA.genericName || medA.brandName);
      const normB = normalizeDrugString(medB.genericName || medB.brandName);

      // Same active ingredient is a duplication issue, not an interaction pair
      if (normA === normB && normA.length > 0) {
        continue;
      }

      const nameA = `${medA.brandName || ''} ${medA.genericName || ''}`;
      const nameB = `${medB.brandName || ''} ${medB.genericName || ''}`;

      for (const evidence of evidenceDataset) {
        const aliasesA = evidence.knownAliasesA || [evidence.drugA];
        const aliasesB = evidence.knownAliasesB || [evidence.drugB];

        const aMatchesDrugA = matchesDrugIdentity(nameA, evidence.drugA, aliasesA);
        const bMatchesDrugB = matchesDrugIdentity(nameB, evidence.drugB, aliasesB);

        const aMatchesDrugB = matchesDrugIdentity(nameA, evidence.drugB, aliasesB);
        const bMatchesDrugA = matchesDrugIdentity(nameB, evidence.drugA, aliasesA);

        const isMatch = (aMatchesDrugA && bMatchesDrugB) || (aMatchesDrugB && bMatchesDrugA);

        if (isMatch) {
          matchedMedIds.add(medA.id);
          matchedMedIds.add(medB.id);

          // Lookup official DailyMed package insert for both drugs
          const [dailyMedA, dailyMedB] = await Promise.all([
            getCachedDailyMed(medA.genericName || medA.brandName),
            getCachedDailyMed(medB.genericName || medB.brandName),
          ]);

          const dailyMedLookups: DailyMedLookupResult[] = [dailyMedA, dailyMedB];

          // Use Gemini for plain-language explanation grounded in the verified evidence
          const medASummary = {
            id: medA.id,
            brandName: medA.brandName,
            genericName: medA.genericName || medA.brandName,
            dosage: medA.dosage,
          };
          const medBSummary = {
            id: medB.id,
            brandName: medB.brandName,
            genericName: medB.genericName || medB.brandName,
            dosage: medB.dosage,
          };

          const { explanation, source } = await explainInteractionEvidence(
            evidence,
            medASummary,
            medBSummary
          );

          matchedInteractions.push({
            evidence,
            medicationA: medASummary,
            medicationB: medBSummary,
            plainLanguageExplanation: explanation,
            explanationSource: source,
            dailyMedLookups,
          });
        }
      }
    }
  }

  // 4. Identify Unmatched Medications
  const unmatchedMedications: string[] = validMeds
    .filter((m) => !matchedMedIds.has(m.id))
    .map((m) => `${m.brandName}${m.genericName && m.genericName !== m.brandName ? ` (${m.genericName})` : ''} ${m.dosage || ''}`.trim());

  // 5. Determine Check Status
  let status: SafetyCheckStatus;
  let statusLabel: string;
  let statusDescription: string;

  if (matchedInteractions.length > 0) {
    status = 'matches_found';
    statusLabel = 'Potential Interaction Evidence Found';
    statusDescription =
      `Identified ${matchedInteractions.length} interaction record(s) matching verified FDA labeling and DailyMed documentation. Review with prescribing clinician recommended.`;
  } else if (unresolvedIssues.length > 0) {
    status = 'needs_review';
    statusLabel = 'Regimen Quality Issues Require Caregiver Review';
    statusDescription =
      'Duplicate medications or incomplete drug identifiers were detected in the regimen. Please resolve these entries.';
  } else {
    // CRITICAL: Never label "no match" as "safe" or "no interactions"
    status = 'no_matches_in_dataset';
    statusLabel = 'No Matches in Current Curated Dataset';
    statusDescription =
      'No interaction records matched Arthur’s regimen in the limited demonstration dataset. Notice: This does NOT verify safety. Please consult a pharmacist for a complete clinical polypharmacy review.';
  }

  return {
    success: true,
    status,
    statusLabel,
    statusDescription,
    totalMedicationsChecked: validMeds.length,
    matchedInteractions,
    unmatchedMedications,
    unresolvedIssues,
    datasetCoverageNotice,
    checkedAt,
    disclaimer,
  };
}
