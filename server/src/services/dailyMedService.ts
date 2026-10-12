import { DailyMedLookupResult } from '../types/index.js';

const DAILYMED_BASE_URL = 'https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json';
const TIMEOUT_MS = 4000;

/**
 * Normalizes a drug name for DailyMed API query.
 * Extracts active chemical ingredient where possible (e.g. "Amlodipine Besylate" -> "amlodipine").
 */
export function cleanDrugNameForLookup(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b(tablets?|capsules?|solution|hcl|potassium|calcium|besylate|succinate|sodium|dr|otc|oral)\b/gi, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .split(/\s+/)[0] || '';
}

/**
 * Queries the official NIH DailyMed REST API for drug labeling metadata (SPL).
 * Fails safely with timeout and structured status without throwing errors.
 */
export async function lookupDailyMedLabel(drugName: string): Promise<DailyMedLookupResult> {
  const queryTerm = cleanDrugNameForLookup(drugName);

  if (!queryTerm || queryTerm.length < 3) {
    return {
      drugName,
      lookupStatus: 'not_found',
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${DAILYMED_BASE_URL}?drug_name=${encodeURIComponent(queryTerm)}&pagesize=1`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'MedSafeTwin-PolypharmacyGuardian/1.0',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        drugName,
        lookupStatus: 'failed',
      };
    }

    const json = (await response.json()) as any;
    if (json && Array.isArray(json.data) && json.data.length > 0) {
      const topMatch = json.data[0];
      const setId = topMatch.setid;
      const title = topMatch.title || `${drugName} Package Insert`;
      const publishedDate = topMatch.published_date || undefined;

      return {
        drugName,
        lookupStatus: 'success',
        title,
        setId,
        dailyMedUrl: `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${setId}`,
        publishedDate,
      };
    }

    return {
      drugName,
      lookupStatus: 'not_found',
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      return {
        drugName,
        lookupStatus: 'timeout',
      };
    }
    return {
      drugName,
      lookupStatus: 'failed',
    };
  }
}
