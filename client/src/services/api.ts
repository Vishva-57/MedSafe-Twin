import {
  Medication,
  ScheduleItem,
  SafetyReviewStatus,
  CaregiverSummary,
  PrescriptionExtractionResponse,
} from '../types/index';

// Base API configuration (configurable for deployed production backend, defaults to /api)
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export interface ApiError extends Error {
  code?: string;
  instructions?: string;
}

export const apiService = {
  // Check backend health
  async getHealth(): Promise<{
    status: string;
    app: string;
    disclaimer: string;
    geminiConfigured?: boolean;
    geminiModel?: string;
  }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch backend health status');
    return res.json();
  },

  // Medications
  async getMedications(): Promise<Medication[]> {
    const res = await fetch(`${API_BASE}/medications`);
    if (!res.ok) throw new Error('Failed to fetch medications');
    const json = await res.json();
    return json.data;
  },

  async addMedication(medication: Omit<Medication, 'id'>): Promise<Medication> {
    const res = await fetch(`${API_BASE}/medications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medication),
    });
    if (!res.ok) throw new Error('Failed to add medication');
    const json = await res.json();
    return json.data;
  },

  async deleteMedication(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/medications/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete medication');
    return true;
  },

  // Today's schedule
  async getSchedule(): Promise<ScheduleItem[]> {
    const res = await fetch(`${API_BASE}/schedule`);
    if (!res.ok) throw new Error('Failed to fetch schedule');
    const json = await res.json();
    return json.data;
  },

  async toggleScheduleItem(id: string): Promise<ScheduleItem> {
    const res = await fetch(`${API_BASE}/schedule/${id}/toggle`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to toggle schedule item');
    const json = await res.json();
    return json.data;
  },

  // Safety Status
  async getSafetyStatus(): Promise<SafetyReviewStatus> {
    const res = await fetch(`${API_BASE}/safety/status`);
    if (!res.ok) throw new Error('Failed to fetch safety status');
    const json = await res.json();
    return json.data;
  },

  // Caregiver Summary
  async getCaregiverSummary(): Promise<CaregiverSummary> {
    const res = await fetch(`${API_BASE}/caregiver/summary`);
    if (!res.ok) throw new Error('Failed to fetch caregiver summary');
    const json = await res.json();
    return json.data;
  },

  // Real Multimodal Extraction with Gemini API
  async extractPrescriptionImage(file: File): Promise<PrescriptionExtractionResponse> {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_BASE}/prescriptions/extract`, {
      method: 'POST',
      body: formData,
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(json.error || `Server extraction error (${res.status})`) as ApiError;
      err.code = json.code;
      err.instructions = json.instructions;
      throw err;
    }

    return json;
  },

  // Evidence-Grounded Safety Check
  async checkSafety(medications?: Medication[]): Promise<import('../types/index').SafetyCheckResponse> {
    const res = await fetch(`${API_BASE}/safety/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medications ? { medications } : {}),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.error || `Safety check failed (${res.status})`);
    }

    return json;
  },

  // Backward-compatible prescription placeholder
  async uploadPrescriptionPlaceholder(fileName: string): Promise<any> {
    const res = await fetch(`${API_BASE}/prescriptions/upload-placeholder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName }),
    });
    if (!res.ok) throw new Error('Failed to submit prescription placeholder');
    return res.json();
  },
};

