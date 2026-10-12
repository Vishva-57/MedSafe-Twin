import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  ShieldCheck,
  Info,
  X,
  FileText,
  CheckSquare,
  Square,
  ArrowRight,
  ExternalLink,
  Pill,
} from 'lucide-react';
import { apiService, ApiError } from '../services/api';
import {
  ExtractedMedicine,
  PrescriptionExtractionResponse,
  PageId,
  Medication,
  TimingSlot,
  FoodRelation,
} from '../types/index';

interface PrescriptionScannerPageProps {
  onNavigate: (page: PageId) => void;
  onSaveConfirmedMedication?: (med: Omit<Medication, 'id'>) => void;
}

export const PrescriptionScannerPage: React.FC<PrescriptionScannerPageProps> = ({
  onNavigate,
  onSaveConfirmedMedication,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [geminiConfigError, setGeminiConfigError] = useState<{
    message: string;
    instructions?: string;
  } | null>(null);

  // Extracted data state for human review
  const [extractionResult, setExtractionResult] = useState<PrescriptionExtractionResponse | null>(null);
  const [editableMedicines, setEditableMedicines] = useState<
    (ExtractedMedicine & {
      timings: TimingSlot[];
      foodRelation: FoodRelation;
    })[]
  >([]);

  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Handle client-side file selection and validation
  const handleFileChange = (file: File | null) => {
    setErrorMessage(null);
    setGeminiConfigError(null);
    setExtractionResult(null);
    setSaveSuccessMessage(null);

    if (!file) return;

    // Validate size (max 5 MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMessage(
        `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum permitted size is 5 MB.`
      );
      return;
    }

    // Validate MIME type (JPEG, PNG, WebP)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(
        'Unsupported image type. Please select a JPEG, PNG, or WebP image.'
      );
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setExtractionResult(null);
    setEditableMedicines([]);
    setErrorMessage(null);
    setGeminiConfigError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Helper to create a realistic test prescription image blob for immediate evaluation
  const handleLoadSampleBottle = (type: 'metformin' | 'omeprazole' | 'ambiguous') => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw prescription bottle mockup label
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 600, 400);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(40, 30, 520, 340, 16);
    ctx.fill();
    ctx.stroke();

    // Rx Header
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('ST. JUDE HEALTH PHARMACY #401', 60, 75);

    ctx.fillStyle = '#475569';
    ctx.font = '14px sans-serif';
    ctx.fillText('Rx #774921-A • Tel: (555) 019-2831', 60, 100);

    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(60, 115);
    ctx.lineTo(540, 115);
    ctx.stroke();

    if (type === 'metformin') {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('METFORMIN HCL 500 MG', 60, 150);

      ctx.fillStyle = '#334155';
      ctx.font = '16px sans-serif';
      ctx.fillText('Generic for: GLUCOPHAGE', 60, 180);
      ctx.fillText('DIRECTIONS: TAKE 1 TABLET TWICE DAILY WITH MEALS', 60, 215);
      ctx.fillText('FOR TYPE 2 DIABETES', 60, 245);

      ctx.fillStyle = '#0f172a';
      ctx.font = '14px sans-serif';
      ctx.fillText('PATIENT: ARTHUR MILLER (AGE 78)', 60, 285);
      ctx.fillText('PRESCRIBER: DR. ROBERT CHEN (ENDOCRINOLOGY)', 60, 310);
      ctx.fillText('DISPENSED: 2026-09-20 • REFILLS: 1', 60, 335);

      // Warning pill badge
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(380, 130, 150, 45);
      ctx.fillStyle = '#92400e';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('TAKE WITH MEALS', 395, 158);
    } else if (type === 'omeprazole') {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('OMEPRAZOLE 20 MG DR', 60, 150);

      ctx.fillStyle = '#334155';
      ctx.font = '16px sans-serif';
      ctx.fillText('Generic for: PRILOSEC', 60, 180);
      ctx.fillText('DIRECTIONS: TAKE 1 CAPSULE 30 MIN BEFORE BREAKFAST', 60, 215);
      ctx.fillText('FOR 30 DAYS FOR ACID REFLUX', 60, 245);

      ctx.fillStyle = '#0f172a';
      ctx.font = '14px sans-serif';
      ctx.fillText('PATIENT: ARTHUR MILLER (AGE 78)', 60, 285);
      ctx.fillText('PRESCRIBER: DR. EMILY VANCE (PRIMARY CARE)', 60, 310);
      ctx.fillText('DISPENSED: 2026-10-02 • REFILLS: 0 (SHORT-TERM)', 60, 335);

      ctx.fillStyle = '#fee2e2';
      ctx.fillRect(380, 130, 150, 45);
      ctx.fillStyle = '#991b1b';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('30-DAY COURSE', 405, 158);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('SYNTH-ANALGESIC 200 MG', 60, 150);

      ctx.fillStyle = '#334155';
      ctx.font = '16px sans-serif';
      ctx.fillText('Generic for: ACETAMINOPHEN EXTRA', 60, 180);
      ctx.fillText('DIRECTIONS: TAKE AS NEEDED FOR DISCOMFORT', 60, 215);
      ctx.fillText('FOR MILD ARTHRITIC DISCOMFORT', 60, 245);

      ctx.fillStyle = '#0f172a';
      ctx.font = '14px sans-serif';
      ctx.fillText('PATIENT: ARTHUR MILLER (AGE 78)', 60, 285);
      ctx.fillText('PRESCRIBER: DR. SARAH LIN (CARDIOLOGY)', 60, 310);
      ctx.fillText('DISPENSED: 2026-10-05 • REFILLS: 0', 60, 335);

      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(360, 130, 175, 45);
      ctx.fillStyle = '#92400e';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('AS NEEDED / AMBIGUOUS', 370, 158);
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File(
        [blob],
        type === 'metformin'
          ? 'metformin_500mg_label.png'
          : type === 'omeprazole'
          ? 'omeprazole_20mg_label.png'
          : 'synth_analgesic_as_needed_label.png',
        { type: 'image/png' }
      );
      handleFileChange(file);
    }, 'image/png');
  };

  // Perform real extraction with Gemini API via backend
  const handleExtractWithGemini = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select or photograph a prescription image first.');
      return;
    }

    setIsExtracting(true);
    setErrorMessage(null);
    setGeminiConfigError(null);
    setSaveSuccessMessage(null);

    try {
      const result = await apiService.extractPrescriptionImage(selectedFile);

      setExtractionResult(result);

      // Initialize editable fields with sensible defaults
      const editable = result.extractedMedicines.map((m) => {
        let defaultTimings: TimingSlot[] = ['morning'];
        const lowerSig = (m.dosageInstructions || '').toLowerCase();
        if (lowerSig.includes('bedtime') || lowerSig.includes('at night')) {
          defaultTimings = ['bedtime'];
        } else if (lowerSig.includes('twice') || lowerSig.includes('bid')) {
          defaultTimings = ['morning', 'evening'];
        } else if (lowerSig.includes('three') || lowerSig.includes('tid')) {
          defaultTimings = ['morning', 'afternoon', 'evening'];
        }

        let defaultFood: FoodRelation = 'independent';
        if (lowerSig.includes('with food') || lowerSig.includes('with meals')) {
          defaultFood = 'with_food';
        } else if (lowerSig.includes('before food') || lowerSig.includes('before breakfast') || lowerSig.includes('empty stomach')) {
          defaultFood = 'before_food';
        }

        return {
          ...m,
          timings: defaultTimings,
          foodRelation: defaultFood,
          isConfirmedByHuman: false, // Must be explicitly confirmed
        };
      });

      setEditableMedicines(editable);
    } catch (err: any) {
      const apiErr = err as ApiError;
      if (apiErr.code === 'GEMINI_NOT_CONFIGURED') {
        setGeminiConfigError({
          message: apiErr.message || 'Gemini API key is not configured.',
          instructions:
            apiErr.instructions ||
            'Set GEMINI_API_KEY in server/.env to enable live Google Gemini multimodal vision extraction.',
        });
      } else {
        setErrorMessage(apiErr.message || 'Prescription extraction failed.');
      }
    } finally {
      setIsExtracting(false);
    }
  };

  // Field edit handler for human-in-the-loop adjustments
  const handleUpdateMedicineField = (
    index: number,
    field: keyof ExtractedMedicine | 'foodRelation',
    value: any
  ) => {
    setEditableMedicines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleToggleTiming = (medIndex: number, slot: TimingSlot) => {
    setEditableMedicines((prev) => {
      const updated = [...prev];
      const cur = updated[medIndex].timings;
      const next = cur.includes(slot) ? cur.filter((t) => t !== slot) : [...cur, slot];
      updated[medIndex] = {
        ...updated[medIndex],
        timings: next.length > 0 ? next : ['morning'],
      };
      return updated;
    });
  };

  const handleToggleConfirmMedicine = (index: number) => {
    setEditableMedicines((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        isConfirmedByHuman: !updated[index].isConfirmedByHuman,
      };
      return updated;
    });
  };

  // Confirm and Save action: only saves explicitly confirmed medicines
  const handleConfirmAndSaveAll = async () => {
    const confirmedMeds = editableMedicines.filter((m) => m.isConfirmedByHuman);

    if (confirmedMeds.length === 0) {
      setErrorMessage(
        'Safety rule: You must check "I verify this extracted medicine" for at least one medication before saving.'
      );
      return;
    }

    // Verify critical fields are not empty
    for (const med of confirmedMeds) {
      if (!med.medicineName.trim()) {
        setErrorMessage('Safety rule: Medication name cannot be empty.');
        return;
      }
      if (!med.strength || !med.strength.trim()) {
        setErrorMessage(
          `Safety rule: [${med.medicineName}] requires a confirmed strength (e.g., "500 mg") before saving.`
        );
        return;
      }
    }

    // Add each confirmed medication to active regimen
    for (const med of confirmedMeds) {
      const newMedData: Omit<Medication, 'id'> = {
        brandName: med.medicineName.trim(),
        genericName: med.genericName ? med.genericName.trim() : med.medicineName.trim(),
        dosage: med.strength ? med.strength.trim() : 'As directed',
        frequency: med.frequency ? med.frequency.trim() : 'As directed on label',
        prescribedFor: 'Scanned Prescription (Caregiver Verified)',
        prescribingDoctor: med.prescriber || 'Prescribing Doctor',
        instructions: med.dosageInstructions.trim(),
        timings: med.timings,
        foodRelation: med.foodRelation,
        prescribedDate: med.prescriptionDate || new Date().toISOString().split('T')[0],
        refillsRemaining: 1,
        status: 'active',
        verificationStatus: 'confirmed', // Confirmed by human reviewer!
        recordOrigin: 'extracted_session',
        isSynthetic: true,
      };

      if (onSaveConfirmedMedication) {
        onSaveConfirmedMedication(newMedData);
      } else {
        await apiService.addMedication(newMedData);
      }
    }

    setSaveSuccessMessage(
      `Successfully added ${confirmedMeds.length} verified medication(s) to Arthur's active regimen!`
    );

    // Clear extraction after save
    setTimeout(() => {
      onNavigate('medications');
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Page Title & Subtitle */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-100 text-teal-800 rounded-2xl">
            <Camera className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Prescription Bottle Scanner
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              Photograph or upload a prescription label to read medication details.
            </p>
          </div>
        </div>
      </div>

      {/* Mandatory Safety Notice */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
        <ShieldCheck className="w-6 h-6 text-sky-700 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-sky-950 space-y-1">
          <p className="font-bold">Patient & Caregiver Safety Review:</p>
          <p className="text-slate-700 leading-relaxed">
            The scanner reads the label for you. You will always review the name and directions before adding it to Arthur's schedule.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccessMessage && (
        <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-2xl flex items-center gap-3 text-emerald-900 font-bold text-sm sm:text-base animate-in fade-in-50">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage} Redirecting to My Medications...</span>
        </div>
      )}

      {/* Error Notifications */}
      {errorMessage && (
        <div className="bg-rose-50 border-2 border-rose-300 p-4 rounded-2xl flex items-start gap-3 text-rose-900 text-xs sm:text-sm animate-in fade-in-50">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Extraction Notice</p>
            <p>{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 text-rose-500 hover:text-rose-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Gemini Configuration Guidance Banner (Shown if API key is missing) */}
      {geminiConfigError && (
        <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-3xl text-amber-950 space-y-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="font-extrabold text-base sm:text-lg text-amber-900">
                Google Gemini API Key Setup Required
              </h2>
              <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed">
                {geminiConfigError.message}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-200 text-xs sm:text-sm space-y-2">
            <p className="font-bold text-slate-900">How to enable real multimodal vision analysis:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
              <li>
                Obtain a Gemini API key from{' '}
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-700 font-bold underline inline-flex items-center gap-1"
                >
                  <span>Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                Set <code className="bg-slate-100 px-1.5 py-0.5 rounded text-amber-800 font-mono">GEMINI_API_KEY=your_key</code> in{' '}
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">server/.env</code>.
              </li>
              <li>Restart the server and click "Extract with Gemini" again.</li>
            </ol>
          </div>
        </div>
      )}

      {/* SECTION 1: Image Upload & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Dropzone */}
        <div className="lg:col-span-7 space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-dashed border-slate-300 hover:border-sky-400 transition-all text-center shadow-xs"
          >
            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Upload className="w-8 h-8" />
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              Select or Drop Prescription Image
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Supports JPEG, PNG, and WebP (up to 5 MB). Upload a prescription bottle label, box, or paper doctor script.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 transition-colors shadow-2xs inline-flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <span>Browse / Capture</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />
              </label>

              {selectedFile && (
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-colors"
                >
                  Clear Image
                </button>
              )}
            </div>
          </div>

          {/* Quick Sample Bottles */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Try a Sample Bottle (Quick Test)
              </span>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                1-Click Test
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleLoadSampleBottle('metformin')}
                className="text-left p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-sky-50/70 hover:border-sky-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                  <p className="font-bold text-xs text-slate-900 truncate">
                    Metformin 500 mg
                  </p>
                </div>
                <p className="text-2xs text-slate-500 mt-1">Twice daily with meals</p>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSampleBottle('omeprazole')}
                className="text-left p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-sky-50/70 hover:border-sky-300 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-600 shrink-0" />
                  <p className="font-bold text-xs text-slate-900 truncate">
                    Omeprazole 20 mg
                  </p>
                </div>
                <p className="text-2xs text-slate-500 mt-1">Before morning meal</p>
              </button>

              <button
                type="button"
                onClick={() => handleLoadSampleBottle('ambiguous')}
                className="text-left p-3 rounded-2xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 hover:border-amber-400 transition-all cursor-pointer"
                title="Tests as-needed timing confirmation"
              >
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="font-bold text-xs text-amber-950 truncate">
                    As-Needed Pain Relief
                  </p>
                </div>
                <p className="text-2xs text-amber-800 mt-1">Tests timing confirmation</p>
              </button>
            </div>
          </div>
        </div>

        {/* Real Image Preview & Action */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between min-h-[280px]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs text-slate-500">
                <span className="font-bold uppercase tracking-wider">Image Preview</span>
                {selectedFile && (
                  <span className="font-mono text-slate-600">
                    {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>

              {previewUrl ? (
                <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center max-h-56">
                  <img
                    src={previewUrl}
                    alt="Prescription Bottle Preview"
                    className="max-h-56 w-auto object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="mt-6 text-center py-12 text-slate-400 space-y-2">
                  <Eye className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">No image selected for preview yet.</p>
                </div>
              )}
            </div>

            {/* Primary Extraction Button */}
            <div className="pt-4">
              <button
                type="button"
                disabled={!selectedFile || isExtracting}
                onClick={handleExtractWithGemini}
                className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {isExtracting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Analyzing with Google Gemini Multimodal Vision...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Extract with Gemini (Multimodal Vision)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Structured Human-in-the-Loop Review Drawer & Form */}
      {extractionResult && (
        <section
          aria-labelledby="review-drawer-heading"
          className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-teal-500 shadow-lg space-y-6 animate-in fade-in-50"
        >
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>AI-Extracted Data — Unverified Draft</span>
              </div>
              <h2 id="review-drawer-heading" className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Human Review & Confirmation Required
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Extracted via <strong>{extractionResult.modelUsed}</strong> on{' '}
                {new Date(extractionResult.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                Verify each field against the physical bottle before confirming.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-500">Image Readability:</span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  extractionResult.imageReadability === 'clear'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : extractionResult.imageReadability === 'partially_readable'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                {extractionResult.imageReadability.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Review Issues or Warnings from Gemini */}
          {extractionResult.reviewIssues.length > 0 && (
            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-1.5 text-xs sm:text-sm text-amber-950">
              <p className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-600" />
                <span>Identified Issues & Clarification Flags:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                {extractionResult.reviewIssues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Medicines Review Form */}
          {editableMedicines.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-slate-600 font-bold">
                No distinct medications could be read from this image.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Please retake a sharper, high-contrast photo of the prescription label.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {editableMedicines.map((med, index) => (
                <div
                  key={med.id}
                  className={`p-6 rounded-3xl border-2 transition-all space-y-4 ${
                    med.isConfirmedByHuman
                      ? 'bg-emerald-50/40 border-emerald-400 ring-2 ring-emerald-100'
                      : 'bg-slate-50/80 border-slate-300'
                  }`}
                >
                  {/* Top card bar with confirmation status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-sky-100 text-sky-800 font-extrabold text-sm flex items-center justify-center">
                        {index + 1}
                      </span>
                      <h3 className="font-extrabold text-lg text-slate-900">
                        {med.medicineName || 'Medicine Review'}
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                        Confidence: {med.confidenceAssessment}
                      </span>
                    </div>

                    {/* Checkbox for Human Confirmation */}
                    <button
                      type="button"
                      onClick={() => handleToggleConfirmMedicine(index)}
                      className={`px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors ${
                        med.isConfirmedByHuman
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white border-2 border-slate-300 hover:border-slate-400 text-slate-700'
                      }`}
                    >
                      {med.isConfirmedByHuman ? (
                        <CheckSquare className="w-4 h-4 text-white" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      <span>
                        {med.isConfirmedByHuman
                          ? 'Verified by Human Reviewer'
                          : 'Click to Verify This Medicine'}
                      </span>
                    </button>
                  </div>

                  {/* Supporting text excerpt quote */}
                  {med.supportingTextExcerpt && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
                      <strong className="text-slate-800">Label Text Excerpt:</strong> "
                      {med.supportingTextExcerpt}"
                    </div>
                  )}

                  {/* Uncertain or unreadable fields callout */}
                  {med.uncertainOrUnreadableFields.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-bold text-amber-800 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Uncertain on label:
                      </span>
                      {med.uncertainOrUnreadableFields.map((field, fIdx) => (
                        <span
                          key={fIdx}
                          className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-semibold"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Editable Form Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Medicine / Brand Name *
                      </label>
                      <input
                        type="text"
                        value={med.medicineName}
                        onChange={(e) =>
                          handleUpdateMedicineField(index, 'medicineName', e.target.value)
                        }
                        className="mt-1 w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Generic Name
                      </label>
                      <input
                        type="text"
                        value={med.genericName || ''}
                        placeholder="Explicit active ingredient"
                        onChange={(e) =>
                          handleUpdateMedicineField(
                            index,
                            'genericName',
                            e.target.value || null
                          )
                        }
                        className="mt-1 w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Strength & Unit *
                      </label>
                      <input
                        type="text"
                        value={med.strength || ''}
                        placeholder="e.g. 500 mg, 20 mg"
                        onChange={(e) =>
                          handleUpdateMedicineField(
                            index,
                            'strength',
                            e.target.value || null
                          )
                        }
                        className={`mt-1 w-full px-3.5 py-2 bg-white border rounded-xl text-sm font-semibold focus:outline-none ${
                          !med.strength
                            ? 'border-amber-400 bg-amber-50/50'
                            : 'border-slate-200 focus:border-sky-500'
                        }`}
                      />
                      {!med.strength && (
                        <span className="text-2xs text-amber-700 font-bold">
                          Required: Confirm strength before saving
                        </span>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Dosage Instructions (Exact Label SIG) *
                      </label>
                      <input
                        type="text"
                        value={med.dosageInstructions}
                        onChange={(e) =>
                          handleUpdateMedicineField(
                            index,
                            'dosageInstructions',
                            e.target.value
                          )
                        }
                        className="mt-1 w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Frequency
                      </label>
                      <input
                        type="text"
                        value={med.frequency || ''}
                        placeholder="e.g. Twice daily"
                        onChange={(e) =>
                          handleUpdateMedicineField(
                            index,
                            'frequency',
                            e.target.value || null
                          )
                        }
                        className="mt-1 w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Food Relation
                      </label>
                      <select
                        value={med.foodRelation}
                        onChange={(e) =>
                          handleUpdateMedicineField(
                            index,
                            'foodRelation',
                            e.target.value as FoodRelation
                          )
                        }
                        className="mt-1 w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                      >
                        <option value="with_food">With Food</option>
                        <option value="before_food">Before Food</option>
                        <option value="after_food">After Food</option>
                        <option value="independent">Independent of Food</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Prescribing Doctor
                      </label>
                      <input
                        type="text"
                        value={med.prescriber || ''}
                        placeholder="e.g. Dr. Robert Chen"
                        onChange={(e) =>
                          handleUpdateMedicineField(
                            index,
                            'prescriber',
                            e.target.value || null
                          )
                        }
                        className="mt-1 w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Schedule Time Slots
                      </label>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {(['morning', 'afternoon', 'evening', 'bedtime'] as TimingSlot[]).map(
                          (slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => handleToggleTiming(index, slot)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                                med.timings.includes(slot)
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              {slot}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Final Human Confirmation & Save Actions */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-sm transition-colors"
                >
                  Cancel & Discard Extraction
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAndSaveAll}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Confirm and Save to Regimen ({editableMedicines.filter((m) => m.isConfirmedByHuman).length} of {editableMedicines.length})</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
