# MedSafe Twin — System Architecture & Workflow Pipeline

> **Academic Prototype Notice**: This document details the end-to-end system architecture for *MedSafe Twin — Polypharmacy Guardian for Elders*. The system demonstrates multimodal generative perception, grounded deterministic safety checking, human-in-the-loop verification gates, and Responsible AI design boundaries.

---

## 1. High-Level Architecture Flowchart

```mermaid
flowchart TD
    %% Styling Classes
    classDef multimodal fill:#e0f2fe,stroke:#0284c7,stroke-width:2px,color:#0369a1;
    classDef humanGate fill:#fef3c7,stroke:#d97706,stroke-width:3px,color:#92400e;
    classDef deterministic fill:#ecfdf5,stroke:#059669,stroke-width:2px,color:#065f46;
    classDef externalEvidence fill:#f3e8ff,stroke:#7e22ce,stroke-width:2px,color:#581c87;
    classDef userUI fill:#ffffff,stroke:#475569,stroke-width:2px,color:#0f172a;

    subgraph PerceptionLayer ["1. Perception Layer (Multimodal Vision)"]
        A["Prescription Bottle Photo / Synthetic Image"]:::userUI --> B["MIME Validation & Buffer Sanitization (Server)"]:::deterministic
        B --> C["Google Gemini Multimodal Vision API\n(gemini-3.8-flash)"]:::multimodal
        C --> D["Structured JSON Schema Validation\n(Extracted Medicine Candidates)"]:::deterministic
    end

    subgraph VerificationGate ["2. Human-in-the-Loop Gate (Responsible AI)"]
        D --> E{"Human Review Gate\n(Elder / Caregiver Checkbox)"}:::humanGate
        E -- "Reject / Edit" --> F["Inline Field Correction"]:::userUI
        F --> E
        E -- "Explicitly Confirmed" --> G["Confirmed Medication Regimen\n(Active Patient Twin)"]:::deterministic
    end

    subgraph SafetyEngine ["3. Grounded Safety & Interaction Engine"]
        G --> H["Drug Identity Normalization\n(strip salts, lowercase, token matching)"]:::deterministic
        H --> I{"Deterministic Evidence Matcher\n(Curated Interaction Dataset)"}:::deterministic
        
        subgraph EvidenceSources ["Authoritative Reference Data"]
            J[("Verified Pair Interaction DB\n(traceable citations, excerpts)")]:::externalEvidence
            K["DailyMed REST API\n(Official FDA Package Inserts)"]:::externalEvidence
        end
        
        J -.-> I
        K -.-> I
        
        I --> L{"Matches Found?"}:::deterministic
        L -- "Yes: Matched Evidence" --> M["Gemini Grounded Explainer\n(Bounded to Retrieved Excerpt Only)"]:::multimodal
        L -- "No Match Found" --> N["'No Matches in Dataset'\n(Explicit Disclaimer: Absence != Safety)"]:::deterministic
        M --> O["Evidence-Grounded Safety Report\n(Source URLs + Significance Badge)"]:::userUI
        N --> O
    end

    subgraph MedicationTwin ["4. Daily Medication Twin & Timeline"]
        G --> P["Safe Schedule Normalization Layer\n(Never invents clock times)"]:::deterministic
        P --> Q{"Ambiguous or Missing Frequency?"}:::deterministic
        Q -- "Yes (e.g. As Needed)" --> R["'Timing Needs Confirmation' Slot\n(No reminders triggered)"]:::humanGate
        Q -- "No (Unambiguous / Explicit Clock)" --> S["Today's Medication Timeline\n(Morning, Afternoon, Evening, Bedtime)"]:::userUI
        R -.->|Caregiver Explicit Timing| S
        
        S --> T["Web Speech API Voice Reminders\n(Elder Cadence 0.9x, Confirmed info only)"]:::userUI
        S --> U{"Elder Action"}:::userUI
        U -- "Mark as Taken" --> V["Adherence Record: TAKEN"]:::deterministic
        U -- "Explicit Skip" --> W["Adherence Record: SKIPPED"]:::deterministic
        U -- "Awaiting Scheduled Window" --> X["Adherence Record: PENDING\n(Not penalized as missed)"]:::deterministic
    end

    subgraph CaregiverDoctorCoordination ["5. Caregiver Dashboard & Doctor Prep"]
        V --> Y["Local Persistence Store\n(Versioned keys, no secret leakage)"]:::deterministic
        W --> Y
        X --> Y
        Y --> Z["7-Day Adherence Analytics\n(Evaluated doses denominator only)"]:::deterministic
        
        AA["Caregiver Observation Log\n(Recorded factually, no auto-diagnosis)"]:::userUI --> Y
        
        Z --> AB["Caregiver Real-Time Dashboard"]:::userUI
        O -.-> AC["Regimen Change Trigger\n('Safety review needed' flag)"]:::deterministic
        AC --> AB
        
        Y --> AD["Deterministic Doctor Visit Summary\n(Arthur Miller, Active Rx, Adherence, Notes)"]:::deterministic
        AD --> AE["Printable Clinical Reconciliation Brief\n(window.print ready)"]:::userUI
    end
```

---

## 2. Layer-by-Layer Architectural Separation

The system maintains a strict **four-tier architectural taxonomy**:

| Tier | Component | Technological Role | Safety & Integrity Boundary |
| :--- | :--- | :--- | :--- |
| **Model-Generated Perception** | Gemini 3.8 Flash Vision (`server/src/services/geminiService.ts`) | Extracts label text, drug name, dosage, prescriber from bottle image. | Output is untrusted candidate data. Stored in staging only; **never** added directly to the active medical twin. |
| **Human-in-the-Loop Gate** | Review Table (`client/src/pages/PrescriptionScannerPage.tsx`) | Allows elder/caregiver to verify and adjust dosage, route, food rules. | Requires explicit checkbox confirmation before writing to regimen. |
| **Deterministic Engine** | Normalizer & Matcher (`server/src/services/safetyCheckerService.ts`, `server/src/utils/scheduleNormalizer.ts`) | Performs exact token matching against evidence; creates daily schedule slots without inventing hours. | **Zero hallucination risk**: 100% rule-based and traceable. Cannot invent drugs, doses, or interactions. |
| **Grounded LLM Explainer** | Gemini Explanation (`server/src/services/geminiService.ts`) | Translates retrieved excerpts into plain, calm 8th-grade reading level text. | Strict system prompt: **Forbidden** to declare interactions that are not present in the retrieved excerpt. |
| **External Evidence** | NIH DailyMed API & Curated Evidence | Provides official FDA package insert excerpts and peer-reviewed citations. | Ground truth reference source. If missing, the app explicitly states coverage is limited. |

---

## 3. DailyMed Integration Path

```mermaid
sequenceDiagram
    autonumber
    actor User as Elder / Caregiver
    participant UI as SafetyCheckerPage (React)
    participant API as Express Server (:5000)
    participant Engine as Deterministic Safety Checker
    participant DailyMed as NIH DailyMed REST API
    participant Gemini as Google Gemini (gemini-3.8-flash)

    User->>UI: Clicks "Run Safety Check"
    UI->>API: POST /api/safety/check (medications[])
    API->>Engine: runSafetyCheck(medications, dataset)
    
    loop For each drug in regimen
        Engine->>DailyMed: GET /services/rest/spls.json?drug_name={name}
        DailyMed-->>Engine: Official SPL Excerpt & Drug Class
    end
    
    Engine->>Engine: Match pairs against verified evidence dataset
    
    alt Verified Interaction Matched
        Engine->>Gemini: generateSafetyExplanation(evidenceExcerpt, drugA, drugB)
        Gemini-->>Engine: Elder-accessible plain language explanation
        Engine-->>API: Status: 'matches_found' + Evidence + Explanation
    else No Verified Interaction Matched
        Engine-->>API: Status: 'no_matches_in_dataset' + Absence Disclaimer
    end
    
    API-->>UI: 200 OK (SafetyCheckResponse)
    UI-->>User: Displays FDA Grounded Cards + Source URL Links
```

---

## 4. Medication Schedule & Adherence State Machine

```mermaid
stateDiagram-v2
    [*] --> CandidateExtracted: Gemini Bottle Scan
    CandidateExtracted --> UnconfirmedStaging: Candidate Review
    UnconfirmedStaging --> ConfirmedRegimen: Caregiver Confirms
    
    state ConfirmedRegimen {
        [*] --> CheckTiming
        CheckTiming --> TimingAmbiguous: Unclear frequency / as needed
        CheckTiming --> TimingUnambiguous: Explicit timing or daypart
        
        TimingAmbiguous --> NeedsConfirmation: Flagged 'Timing needs confirmation'
        NeedsConfirmation --> TimingUnambiguous: Caregiver selects slot
        
        TimingUnambiguous --> PendingToday: Scheduled slot initialized
        PendingToday --> Taken: Elder clicks [Mark as Taken]
        PendingToday --> Skipped: Elder clicks [Skip]
        PendingToday --> Missed: Caregiver marks missed / cutoff passed
        
        Taken --> [*]
        Skipped --> [*]
        Missed --> [*]
    }
```

---

## 5. Persistence & Secret Isolation Architecture

- **Browser Storage Isolation**:
  - Keys use versioned namespace: `medsafe_twin_v1_schedules`, `medsafe_twin_v1_adherence`, `medsafe_twin_v1_observations`, `medsafe_twin_v1_settings`, `medsafe_twin_v1_medications`.
  - **Zero Secret Exposure**: No API keys, credentials, or prescription raw images are stored in `localStorage`.
  - **Graceful Fallback**: Corrupted JSON entries are caught by `try/catch` and fall back to initial synthetic demo state without throwing.
- **Server Environment Protection**:
  - `GEMINI_API_KEY` is loaded strictly on the backend (`server/src/index.ts`) via `dotenv`.
  - All responses strip internal configuration details.
  - The client communicates only with `/api/` endpoints over HTTP/JSON.
