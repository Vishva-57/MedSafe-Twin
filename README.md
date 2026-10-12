# MedSafe Twin — Polypharmacy Guardian for Elders

[![Repository](https://img.shields.io/badge/GitHub-Vishva--57%2FMedSafe--Twin-181717?style=flat&logo=github)](https://github.com/Vishva-57/MedSafe-Twin)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B%20%7C%20v24%20LTS-green.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%206-646CFF.svg)](https://vitejs.dev/)
[![Gemini](https://img.shields.io/badge/Google%20AI-Gemini%203.8%20Flash-4285F4.svg)](https://aistudio.google.com/)
[![Security: Clean Secrets](https://img.shields.io/badge/Security-Protected%20ENV-success.svg)](#14-environment-variable-setup--security-isolation)

> **Academic Prototype Notice & Non-Clinical Disclaimer:**  
> *Educational prototype — not a substitute for professional medical advice.*  
> This system is an academic prototype created to demonstrate Generative AI, multimodal vision extraction, prompt engineering, clinical evidence grounding, and Responsible AI human-in-the-loop review for elderly patients and caregivers. It is **NOT** clinically validated, **NOT** production-ready, and makes **NO claim** to prevent hospitalizations or adverse clinical events.

---

## 1. Project Title & Overview

**MedSafe Twin** is an intelligent medication safety companion and polypharmacy management system designed for geriatric patients and their family caregivers. The platform combines Google's Gemini multimodal vision models (`gemini-3.8-flash`) with strict deterministic safety guardrails. Rather than allowing Generative AI to hallucinate drug interactions or invent dosing times, MedSafe Twin establishes a clear boundary: Generative AI handles visual perception and plain-language explanation, while deterministic engines handle drug matching, safety verification, and schedule mathematics.

---

## 2. Problem Statement & Intended Users

### Problem Statement
Elderly individuals managing polypharmacy (5 or more concurrent daily prescriptions) face severe risks of adverse drug-drug interactions, confusing instructions, and missed doses. When patients or caregivers seek information online, conversational AI chatbots often hallucinate plausible-sounding interactions or invent specific clock times that conflict with medical reality.

### Intended Users
1. **Elderly Patients (e.g., Arthur Miller, Age 78)**: Seniors with visual impairment, mild cognitive fatigue, or chronic conditions needing clear, high-contrast, large-button daily timelines.
2. **Family Caregivers (e.g., Elena Miller)**: Adult children and proxies needing visibility into daily adherence, observation logging, and doctor appointment preparation.
3. **Healthcare Providers (Review Context)**: Physicians and pharmacists receiving structured, factual reconciliation summaries at clinic visits.

---

## 3. Project Objectives

- **Safe Multimodal Perception**: Parse physical prescription bottle labels into structured candidate records using Google Gemini multimodal vision.
- **Human-in-the-Loop Verification**: Require explicit human confirmation before any extracted medicine enters the active Medication Twin.
- **Deterministic Evidence Matching**: Screen for drug interactions exclusively against curated reference datasets cross-referenced with NIH DailyMed.
- **Zero Clock-Time Invention**: Normalize directions into general daytime slots without guessing exact hours, routing ambiguous directions to a "Timing needs confirmation" queue.
- **Transparent Adherence Tracking**: Track taken, skipped, and pending doses without unfairly penalizing future doses as missed.
- **Responsible AI Transparency**: Provide an interactive 10-pillar architecture guide explaining every safety boundary to faculty and clinical reviewers.

---

## 4. Features Implemented

- **Multimodal Prescription Scanner**: Upload JPEG/PNG/WebP bottle photos or 1-click synthetic test bottles (Metformin 500mg, Omeprazole 20mg, Ambiguous As-Needed).
- **Human-in-the-Loop Staging Review**: Editable candidate table with validation checks and verification checkboxes.
- **Today's Medication Timeline**: Grouped into Morning, Afternoon, Evening, Bedtime, and Needs Confirmation slots with 48px+ touch controls.
- **Real-Time Adherence Tracking**: Instant status updates (`taken`, `skipped`, `pending`, `missed`) with duplicate click prevention.
- **In-Browser Web Speech Reminders**: Voice reminders via Web Speech API (`SpeechSynthesis`) at an elder-accessible 0.9x cadence with audio test controls.
- **Deterministic Safety Checker**: Drug identity normalization, FDA DailyMed package insert excerpts, and Gemini plain-language explanations.
- **Regimen Change Detection**: Adding or removing prescriptions automatically flags safety status as *"Safety review needed"*.
- **Caregiver Dashboard**: Real-time adherence statistics, 7-day bar chart breakdown, and observation logging with mandatory non-clinical disclaimers.
- **Doctor Visit Reconciliation Brief**: Printable structured summary with active prescriptions, adherence history, and caregiver notes.
- **Accessibility Suite**: High-contrast mode, text scaling (A / A+ / A++), keyboard navigation, and distinct icon/text status indicators.
- **Safe Demo Mode**: Visible synthetic demo badge with a confirmed non-destructive reset dialog.

---

## 5. Technology Stack

### Frontend (`client/`)
- **Core**: React 18, TypeScript, Vite 6
- **Styling**: Tailwind CSS (calm blue, soft teal, accessible amber)
- **Icons**: Lucide React
- **Audio**: Web Speech API (`SpeechSynthesis`)
- **Storage**: Versioned local storage (`medsafe_twin_v1_*`) with defensive fallback parsing

### Backend (`server/`)
- **Runtime**: Node.js (v24+), Express (v4.21+), TypeScript (`tsx`)
- **Generative AI SDK**: Official Google Gen AI SDK (`@google/genai` v1.38.0)
- **Model**: `gemini-3.8-flash`
- **Security**: Buffer magic-byte inspection (JPEG, PNG, WebP), 5 MB upload limits
- **External Integration**: NIH DailyMed REST API for official FDA drug labels

---

## 6. System Architecture

For a comprehensive architectural breakdown and Mermaid sequence diagrams, see [`docs/architecture.md`](docs/architecture.md).

```text
Physical Prescription Bottle
       │
       ▼ (Google Gemini 3.8 Flash Multimodal Vision)
Staged Candidate Data (Untrusted)
       │
       ▼ (Human-in-the-Loop Verification Gate)
Confirmed Medication Regimen (Active Patient Twin)
   ├───► Deterministic Schedule Normalizer ──► Today's Timeline ──► Adherence Logs
   └───► Deterministic Evidence Matcher   ──► DailyMed Lookup  ──► Grounded Gemini Explainer
```

---

## 7. Data Flow: From Prescription Image to Caregiver Summary

1. **Capture & Upload**: User uploads an authentic bottle photo or clicks a synthetic test bottle canvas.
2. **Server Validation**: Backend validates file buffer magic bytes and streams image to Gemini.
3. **Structured Extraction**: Gemini returns a JSON object strictly matching `PrescriptionExtractionResponse`.
4. **Human Review**: Elder or caregiver reviews medicine name, dosage, and instructions. Checked items are committed.
5. **Schedule Normalization**: Direction text is parsed for daytime slots (morning, afternoon, evening, bedtime). Ambiguous directions enter "Timing needs confirmation".
6. **Safety Trigger**: Regimen modification flags the safety engine as "Safety review needed".
7. **Adherence Logging**: Elder clicks `[Mark as Taken]` or `[Skip]`. Today's adherence record updates in place.
8. **Caregiver Aggregation**: Dashboard computes 7-day adherence rate using only evaluated doses in the denominator.
9. **Doctor Summary Export**: Structured facts compile into a printable reconciliation report.

---

## 8. Gemini API Integration & Structured Extraction

- **Official SDK**: Employs `@google/genai` installed exclusively on the server.
- **Structured Schema (`responseSchema`)**: Enforces JSON schema adherence:
  - `extractedMedicines`: array of `{ medicineName, genericName, strength, dosageInstructions, frequency, prescriber, prescriptionDate, confidenceLevel, notes }`.
  - `warningLabels`: array of packaging warning strings.
  - `needsHumanReview`: boolean flag.
- **Security Isolation**: `GEMINI_API_KEY` is loaded strictly from server environment variables and never exposed to the frontend.

---

## 9. Prompt Engineering Approach

### Multimodal Vision Prompt (`server/src/services/geminiService.ts`)
- **Role Constraint**: Senior clinical pharmacy technician transcribing physical labels.
- **Safety Directive**: Transcribe printed text with strict observational accuracy. If information is obscured or missing, return `null`—**NEVER guess or invent unstated clinical frequencies**.
- **Output Format**: Pure JSON object adhering to schema.

### Grounded Explanation Prompt (`server/src/services/geminiService.ts`)
- **Constraint**: Explain the *provided clinical excerpt* in calm, 8th-grade reading level English.
- **Negative Constraint**: **Forbidden** to declare interactions that are not present in the retrieved excerpt or suggest dosage changes.

---

## 10. Grounded Evidence Retrieval & Deterministic Safety Checking

1. **Normalization**: Medication strings are lowercased and stripped of pharmaceutical salts (e.g., *"Amlodipine Besylate 5mg"* $\rightarrow$ *"amlodipine"*).
2. **Deterministic Matching**: Exact token boundary matching against a verified interaction dataset containing peer-reviewed citations.
3. **DailyMed Grounding**: Queries NIH DailyMed (`https://dailymed.nlm.nih.gov/dailymed/services/rest/spls.json`) for official FDA package insert excerpts.
4. **Absence of Evidence**: If no match is found, the engine reports *"No verified matches in current dataset"*, accompanied by the mandatory disclaimer that absence of evidence does not establish safety.

---

## 11. Human-in-the-Loop Design

- **Staging Isolation**: No extracted prescription can directly enter the active regimen.
- **Verification Gate**: Each candidate medicine requires an active checkbox selection (*"I verify this extracted medicine"*).
- **Inline Editing**: Users can adjust any field (brand, dosage, food relation, route) prior to saving.
- **Schedule Confirmation**: Ambiguous instructions cannot trigger reminders until a caregiver explicitly selects a timing slot.

---

## 12. Responsible AI Safeguards

1. **Multimodal Extraction Boundary**: Model output is treated as observational and unconfirmed.
2. **Extracted Data Error Safeguard**: System warns that OCR can misread glare or curved bottles.
3. **Deterministic Safety Firewall**: LLM cannot invent drug interactions.
4. **DailyMed Scope Clarification**: Package inserts provide context but are not an exhaustive interaction checker.
5. **Grounded Explanations**: Gemini only explains verified evidence.
6. **Absence of Evidence Disclaimer**: Clear warnings that unlisted drugs may still have risks.
7. **Non-Verification of Ingestion**: Logging a dose does not verify physical swallowing.
8. **Zero Treatment Alteration**: System never prescribes or adjusts doses.
9. **Mandatory Clinical Escalation**: Directs users to pharmacists and physicians.
10. **Synthetic Labeling**: All demo records are clearly labeled as synthetic test scenarios.

---

## 13. Getting Started & Installation Prerequisites

### Prerequisites
- **Node.js**: v18.0.0 or higher (v24 LTS recommended)
- **npm**: v9.0.0 or higher
- **Git**: Installed and configured
- **Operating System**: Windows, macOS, or Linux
- **Google Gemini API Key**: Free API key from [Google AI Studio](https://aistudio.google.com/)

### Clone the Repository
```bash
git clone https://github.com/Vishva-57/MedSafe-Twin.git
cd MedSafe-Twin
```

---

## 14. Environment Variable Setup & Security Isolation

> 🔒 **Security First**: Real API keys must never be committed to source control. The repository includes strict `.gitignore` rules across root, client, and server workspaces to block all `.env` files while preserving `.env.example` templates.

1. **Create the environment file** from the template:
   ```bash
   # In the root directory:
   cp .env.example .env

   # Or in the server directory:
   cp server/.env.example server/.env
   ```

2. **Configure your Gemini API key** in `server/.env` (or root `.env`):
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   
   # Google Gemini Multimodal Vision API Key
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   GEMINI_MODEL=gemini-3.8-flash
   ```
   *(Note: The client application requires no `.env` file; it connects automatically to the backend on `http://localhost:5000`).*

---

## 15. Startup Commands

### Option A: Run Both Services Concurrently
From the root directory:
```bash
npm run dev
```

### Option B: Run Services Separately
**Terminal 1 (Backend):**
```bash
cd server
npm install
npm run dev
# Server listening on http://localhost:5000
```

**Terminal 2 (Frontend):**
```bash
cd client
npm install
npm run dev
# Vite dev server running on http://localhost:5173
```

---

## 16. API Endpoint Documentation

### `POST /api/prescriptions/extract`
Uploads a prescription bottle image for Gemini multimodal analysis.
- **Request**: `multipart/form-data` with `prescriptionImage` (JPEG, PNG, WebP up to 5 MB).
- **Sample Response**:
  ```json
  {
    "success": true,
    "extractedMedicines": [
      {
        "medicineName": "Metformin HCL",
        "genericName": "Metformin Hydrochloride",
        "strength": "500 mg",
        "dosageInstructions": "Take 1 tablet twice daily with meals",
        "frequency": "Twice daily",
        "prescriber": "Dr. Robert Chen",
        "prescriptionDate": "2026-09-20",
        "confidenceLevel": "high"
      }
    ],
    "warningLabels": ["Take with meals"],
    "needsHumanReview": true
  }
  ```

### `POST /api/safety/check`
Performs deterministic evidence checking against the regimen.
- **Request Body**:
  ```json
  {
    "medications": [
      { "id": "1", "brandName": "Norvasc", "genericName": "Amlodipine" },
      { "id": "2", "brandName": "Lipitor", "genericName": "Atorvastatin" }
    ]
  }
  ```
- **Sample Response**:
  ```json
  {
    "success": true,
    "status": "matches_found",
    "matchedInteractions": [
      {
        "medicationA": { "brandName": "Norvasc" },
        "medicationB": { "brandName": "Lipitor" },
        "evidence": {
          "significance": "moderate",
          "summary": "Co-administration may increase atorvastatin systemic exposure.",
          "sourceTitle": "FDA Label: Lipitor (atorvastatin calcium)",
          "sourceUrl": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=2f9b8705-...",
          "supportingExcerpt": "Amlodipine increases atorvastatin AUC by approximately 18%..."
        },
        "geminiExplanation": "Amlodipine can slightly increase atorvastatin levels in your blood. Watch for muscle soreness."
      }
    ]
  }
  ```

### Additional Endpoints
- `GET /api/medications` — Retrieves current active medications.
- `POST /api/medications` — Adds a confirmed medication.
- `GET /api/schedule` — Retrieves daily schedule items.
- `POST /api/schedule/:id/toggle` — Toggles dose taken status.
- `GET /api/caregiver/summary` — Retrieves caregiver adherence metrics.

---

## 17. Testing Instructions

The project includes **38 automated unit tests** across 5 test suites covering safe demo reset, multimodal extraction validation, deterministic interaction checking, schedule normalization, and adherence math.

Run all tests from the `server/` directory:
```bash
cd server
npm test
```

### Type Checking & Production Build Validation
```bash
# Server TypeScript check
cd server
npx tsc --noEmit

# Client TypeScript check and production build
cd ../client
npx tsc --noEmit
npm run build
```

---

## 18. Demonstration Workflow (Reproducible 5-Minute Scenario)

1. **Dashboard**: View Arthur Miller's synthetic polypharmacy profile (5 prescriptions) and 10 Responsible AI principles.
2. **Timeline Interaction**: Mark a morning dose as taken; observe instant progress bar update.
3. **Prescription Scanner**: Click **"As-Needed / Ambiguous"** synthetic test bottle. Click **Extract with Gemini**. Show that extraction requires human confirmation.
4. **Confirmation Gate**: Verify fields and check *"I verify this extracted medicine"*. Click **Confirm & Add**.
5. **Safety Trigger**: Return to Dashboard; observe that status immediately updates to **"Safety review needed: Regimen updated"**.
6. **Safety Check**: Open Safety Checker and click **Run Safety Check**. Observe verified FDA excerpts and bounded Gemini explanation.
7. **Caregiver View**: Review 7-day adherence rate ($38 / 40$ confirmed doses, 95%). Log a caregiver observation note.
8. **Doctor Summary**: Review the deterministic clinical visit brief. Click **Print Doctor Summary**.
9. **Demo Reset**: Click **Reset Demo Scenario** in top banner; confirm dialog to restore baseline scenario.

---

## 19. Known Limitations

- **Storage**: Uses browser `localStorage` (`medsafe_twin_v1_*`) rather than a HIPAA-compliant cloud database.
- **Evidence Dataset**: Screens against a curated prototype interaction set rather than an exhaustive commercial database (e.g., First Databank).
- **Speech Synthesis**: Relies on browser Web Speech API engines; voice cadence varies by OS.
- **Authentication**: Single demo patient context without multi-tenant role-based login.

---

## 20. Future Improvements

- **FHIR / HL7 EHR Integration**: Direct synchronization with electronic health records.
- **Caregiver Push Notifications**: Real-time SMS and push alerts for missed critical doses.
- **Smart Speaker Integration**: Hands-free voice check-ins via Google Assistant / Nest devices.
- **Physical Pill Dispenser IoT Sync**: Hardware weight-sensor verification of physical pill removal.
- **Multi-Center Clinical Validation**: Geriatric pharmacology trials evaluating cognitive load reduction.
