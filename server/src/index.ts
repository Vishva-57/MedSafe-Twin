import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import {
  mockMedications,
  mockTodaySchedule,
  mockSafetyStatus,
  mockCaregiverSummary,
} from './data/mockData.js';
import { Medication, ScheduleItem } from './types/index.js';
import { validateImageBuffer } from './utils/imageValidation.js';
import {
  extractPrescriptionWithGemini,
  GeminiNotConfiguredError,
  GeminiExtractionError,
} from './services/geminiService.js';
import { runSafetyCheck } from './services/safetyCheckerService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Multer in-memory storage — images are never persisted to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB maximum
  },
});

// In-memory state for initial demo interactive prototype
let medications: Medication[] = [...mockMedications];
let todaySchedule: ScheduleItem[] = [...mockTodaySchedule];

app.use(cors());
app.use(express.json());

// Persistent Educational Prototype Disclaimer Header
app.use((_req, res, next) => {
  res.setHeader(
    'X-Medical-Disclaimer',
    'Educational prototype - not a substitute for professional medical advice.'
  );
  next();
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const hasGeminiKey = Boolean(
    process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  );

  res.json({
    status: 'healthy',
    app: 'MedSafe Twin — Polypharmacy Guardian for Elders',
    disclaimer: 'Educational prototype — not a substitute for professional medical advice.',
    geminiConfigured: hasGeminiKey,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    timestamp: new Date().toISOString(),
  });
});

// Medications endpoints
app.get('/api/medications', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: medications,
    total: medications.length,
    disclaimer: 'Educational prototype — not a substitute for professional medical advice.',
  });
});

app.post('/api/medications', (req: Request, res: Response) => {
  const {
    brandName,
    genericName,
    dosage,
    frequency,
    prescribedFor,
    prescribingDoctor,
    instructions,
    timings,
    foodRelation,
    prescribedDate,
    refillsRemaining,
    status,
    verificationStatus,
  } = req.body;

  if (!brandName || !dosage) {
    res.status(400).json({
      success: false,
      message: 'Medication brandName and dosage are required.',
    });
    return;
  }

  const newMed: Medication = {
    id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    brandName: String(brandName).trim(),
    genericName: genericName ? String(genericName).trim() : String(brandName).trim(),
    dosage: String(dosage).trim(),
    frequency: frequency ? String(frequency).trim() : 'As directed on label',
    prescribedFor: prescribedFor ? String(prescribedFor).trim() : 'Prescription Review',
    prescribingDoctor: prescribingDoctor ? String(prescribingDoctor).trim() : 'Prescribing Clinician',
    instructions: instructions ? String(instructions).trim() : 'Take as directed.',
    timings: Array.isArray(timings) && timings.length > 0 ? timings : ['morning'],
    foodRelation: foodRelation || 'independent',
    prescribedDate: prescribedDate || new Date().toISOString().split('T')[0],
    refillsRemaining: typeof refillsRemaining === 'number' ? refillsRemaining : 1,
    status: status || 'active',
    verificationStatus: verificationStatus || 'confirmed',
  };

  medications.unshift(newMed);

  res.status(201).json({
    success: true,
    data: newMed,
    message: 'Medication confirmed and added to active regimen.',
  });
});

app.delete('/api/medications/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLength = medications.length;
  medications = medications.filter((m) => m.id !== id);
  if (medications.length === initialLength) {
    res.status(404).json({ success: false, message: 'Medication not found.' });
    return;
  }
  res.json({ success: true, message: 'Medication removed.' });
});

// Schedule endpoints
app.get('/api/schedule', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: todaySchedule,
    total: todaySchedule.length,
    completed: todaySchedule.filter((s) => s.taken).length,
  });
});

app.patch('/api/schedule/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const item = todaySchedule.find((s) => s.id === id);
  if (!item) {
    res.status(404).json({ success: false, message: 'Schedule item not found.' });
    return;
  }
  item.taken = !item.taken;
  item.takenAt = item.taken
    ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : undefined;

  res.json({
    success: true,
    data: item,
  });
});

// Safety Review Status endpoint
app.get('/api/safety/status', (_req: Request, res: Response) => {
  const pendingCount = medications.filter((m) => m.verificationStatus === 'pending_review').length;
  res.json({
    success: true,
    data: {
      ...mockSafetyStatus,
      totalMedications: medications.length,
      pendingConfirmationsCount: pendingCount,
    },
  });
});

// Caregiver summary endpoint
app.get('/api/caregiver/summary', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockCaregiverSummary,
  });
});

// =========================================================================
// Evidence-Grounded Medication Safety Checking Endpoints
// =========================================================================
app.post('/api/safety/check', async (req: Request, res: Response) => {
  try {
    const candidateMeds =
      Array.isArray(req.body?.medications) && req.body.medications.length > 0
        ? req.body.medications
        : medications;

    const safetyResult = await runSafetyCheck(candidateMeds);
    res.json(safetyResult);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      status: 'unable_to_check',
      statusLabel: 'Safety Evaluation Error',
      statusDescription: 'An unexpected error occurred during safety evaluation.',
      error: err?.message || 'Internal server error',
    });
  }
});

// =========================================================================
// Real Multimodal Prescription Extraction Route with Google Gemini API
// =========================================================================
app.post(
  '/api/prescriptions/extract',
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file || !req.file.buffer) {
        res.status(400).json({
          success: false,
          error: 'No image file provided. Please attach a prescription image using multipart/form-data with field name "image".',
        });
        return;
      }

      // 1. Validate real binary magic bytes and size
      let mimeType;
      try {
        mimeType = validateImageBuffer(req.file.buffer);
      } catch (valErr: any) {
        res.status(400).json({
          success: false,
          error: valErr.message || 'Invalid image file.',
        });
        return;
      }

      // 2. Perform multimodal extraction with Gemini
      const extractionResult = await extractPrescriptionWithGemini(
        req.file.buffer,
        mimeType
      );

      res.json(extractionResult);
    } catch (err: any) {
      if (err instanceof GeminiNotConfiguredError) {
        res.status(503).json({
          success: false,
          code: err.code,
          error: err.message,
          instructions:
            'To enable live Gemini vision extraction: 1. Create an API key at https://aistudio.google.com/ 2. Set GEMINI_API_KEY in server/.env 3. Restart the server.',
        });
        return;
      }

      if (err instanceof GeminiExtractionError) {
        res.status(502).json({
          success: false,
          code: err.code,
          error: err.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'An unexpected internal server error occurred during prescription analysis.',
      });
    }
  }
);

// Backward-compatible upload placeholder
app.post('/api/prescriptions/upload-placeholder', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Prescription image staged for processing (AI extraction placeholder).',
    details: {
      fileName: req.body?.fileName || 'prescription_sample.jpg',
      receivedAt: new Date().toISOString(),
      responsibleAiNotice:
        'Multimodal extraction requires human-in-the-loop clinical review prior to regimen update.',
      extractedPlaceholder: {
        detectedDoctor: 'Pending Vision Model Processing',
        detectedMedications: [],
        confidenceScore: null,
      },
    },
  });
});

// Multer error handling middleware
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        error: 'File size too large. Maximum permitted image size is 5 MB.',
      });
      return;
    }
    res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`,
    });
    return;
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`[MedSafe Twin Server] Listening on port ${PORT}`);
  console.log(`[Notice] Educational prototype — not a substitute for professional medical advice.`);
});
