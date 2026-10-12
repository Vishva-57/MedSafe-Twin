import {
  Medication,
  MedicationSchedule,
  ScheduleTimeSlot,
  TimingSlot,
} from '../types/index.js';

/**
 * Extracts explicit clock times if printed directly on the label/instruction (e.g., "8:00 AM", "09:30 PM").
 * Strictly returns null if no exact clock time is explicitly stated.
 */
export function extractExplicitClockTime(text: string): string | null {
  if (!text) return null;
  const match = text.match(/\b(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)\b/i);
  if (match) {
    const hours = match[1].padStart(2, '0');
    const minutes = match[2];
    const meridian = match[3].toUpperCase();
    return `${hours}:${minutes} ${meridian}`;
  }
  return null;
}

/**
 * Normalizes confirmed medication instructions into structured daily schedule entries.
 *
 * CRITICAL SAFETY RULES:
 * 1. NEVER invent or extrapolate a dosage schedule from general pharmacology.
 * 2. Only create schedule entries from information explicitly confirmed by user/caregiver.
 * 3. Never invent exact clock times unless explicitly supplied or confirmed.
 * 4. Missing or ambiguous frequencies produce "Timing needs confirmation" entries.
 */
export function normalizeMedicationToSchedules(med: Medication): MedicationSchedule[] {
  const text = `${med.instructions || ''} ${med.frequency || ''}`.toLowerCase();
  const explicitClock = extractExplicitClockTime(`${med.instructions || ''} ${med.frequency || ''}`);

  // 1. If explicit timing slots were already chosen and confirmed by caregiver/user
  if (Array.isArray(med.timings) && med.timings.length > 0) {
    return med.timings.map((slot: TimingSlot, idx: number) => ({
      id: `sched-${med.id}-${slot}-${idx}`,
      medicationId: med.id,
      medicationName: med.brandName,
      dosage: med.dosage,
      instruction: med.instructions || 'Take as confirmed on prescription label.',
      route: 'oral',
      scheduledTime: explicitClock, // null unless explicitly stated
      timeSlot: slot as ScheduleTimeSlot,
      frequencyLabel: med.frequency || `${med.timings.length}x daily`,
      source: 'confirmed_prescription',
      confirmationStatus: 'confirmed',
      timingConfirmed: true,
    }));
  }

  // 2. Deterministic text inspection for unambiguous timing indicators
  const hasBedtime = text.includes('bedtime') || text.includes('at night') || text.includes('before sleep') || text.includes('qhs');
  const hasMorning = text.includes('morning') || text.includes('breakfast') || text.includes('qam');
  const hasEvening = text.includes('evening') || text.includes('dinner') || text.includes('supper') || text.includes('qpm');
  const hasAfternoon = text.includes('afternoon') || text.includes('lunch') || text.includes('midday');

  const isTwiceDaily = text.includes('twice daily') || text.includes('twice a day') || text.includes('2 times daily') || text.includes('bid');
  const isThreeTimesDaily = text.includes('three times daily') || text.includes('3 times daily') || text.includes('tid');
  const isFourTimesDaily = text.includes('four times daily') || text.includes('4 times daily') || text.includes('qid');
  const isOnceDaily = text.includes('once daily') || text.includes('once a day') || text.includes('1 time daily') || text.includes('qd');

  const identifiedSlots: ScheduleTimeSlot[] = [];

  if (isFourTimesDaily) {
    identifiedSlots.push('morning', 'afternoon', 'evening', 'bedtime');
  } else if (isThreeTimesDaily) {
    identifiedSlots.push('morning', 'afternoon', 'evening');
  } else if (isTwiceDaily) {
    // If specific times are mentioned, respect them; otherwise standard daytime slots without clock times
    if (hasMorning && hasEvening) {
      identifiedSlots.push('morning', 'evening');
    } else if (hasMorning && hasBedtime) {
      identifiedSlots.push('morning', 'bedtime');
    } else {
      identifiedSlots.push('morning', 'evening');
    }
  } else if (isOnceDaily) {
    // Once daily with a specific time of day stated
    if (hasBedtime) {
      identifiedSlots.push('bedtime');
    } else if (hasMorning) {
      identifiedSlots.push('morning');
    } else if (hasEvening) {
      identifiedSlots.push('evening');
    } else if (hasAfternoon) {
      identifiedSlots.push('afternoon');
    } else {
      // Once daily with NO time of day specified -> AMBIGUOUS: timing needs confirmation!
      // Do not invent morning or bedtime!
      identifiedSlots.push('needs_confirmation');
    }
  } else {
    // Check individual explicit dayparts
    if (hasMorning) identifiedSlots.push('morning');
    if (hasAfternoon) identifiedSlots.push('afternoon');
    if (hasEvening) identifiedSlots.push('evening');
    if (hasBedtime) identifiedSlots.push('bedtime');
  }

  // 3. Fallback for completely ambiguous, "as needed", or unstated directions
  if (identifiedSlots.length === 0) {
    identifiedSlots.push('needs_confirmation');
  }

  return identifiedSlots.map((slot, idx) => {
    const isNeedsConfirmation = slot === 'needs_confirmation';
    return {
      id: `sched-${med.id}-${slot}-${idx}`,
      medicationId: med.id,
      medicationName: med.brandName,
      dosage: med.dosage,
      instruction: med.instructions || 'Directions need caregiver confirmation.',
      route: 'oral',
      scheduledTime: isNeedsConfirmation ? null : explicitClock,
      timeSlot: slot,
      frequencyLabel: isNeedsConfirmation ? 'Timing needs confirmation' : (med.frequency || 'Daily schedule'),
      source: 'confirmed_prescription',
      confirmationStatus: isNeedsConfirmation ? 'pending_confirmation' : 'confirmed',
      timingConfirmed: !isNeedsConfirmation,
    };
  });
}
