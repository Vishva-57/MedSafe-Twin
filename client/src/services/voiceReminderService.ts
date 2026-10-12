import { storageService } from './storageService';

/**
 * Browser-based Voice Reminders using the Web Speech API (SpeechSynthesis).
 *
 * SAFETY RULES:
 * 1. Never speak medical advice or clinically diagnose.
 * 2. Only speak information explicitly enabled by the user/caregiver.
 * 3. Gracefully handle unsupported browsers without throwing.
 * 4. Never claim voice reminders guarantee administration.
 */
export const voiceReminderService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  },

  isEnabled(): boolean {
    return this.isSupported() && storageService.getSettings().voiceEnabled;
  },

  speak(text: string): boolean {
    if (!this.isSupported()) {
      console.warn('[VoiceReminder] SpeechSynthesis is not supported in this browser.');
      return false;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending utterances
      const utterance = new SpeechSynthesisUtterance(text);
      const settings = storageService.getSettings();
      utterance.rate = settings.voiceRate || 0.9; // Friendly elder-accessible cadence
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      console.error('[VoiceReminder] Failed to play voice reminder:', err);
      return false;
    }
  },

  testVoiceReminder(): boolean {
    return this.speak(
      "MedSafe Twin voice reminder test. It's time to review your scheduled medication. Please check your daily timeline."
    );
  },

  speakMedicationDose(medicationName: string, dosage?: string): boolean {
    const settings = storageService.getSettings();
    if (!settings.voiceEnabled) {
      return false;
    }

    const dosagePhrase = dosage ? ` — ${dosage}` : '';
    const text = `Reminder for Arthur. It is time for your scheduled medication: ${medicationName}${dosagePhrase}. Please check your medication plan.`;
    return this.speak(text);
  },
};
