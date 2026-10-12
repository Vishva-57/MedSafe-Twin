import React, { useState } from 'react';
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Brain,
  UserCheck,
  Cpu,
  FileCheck2,
  Clock,
  Sparkles,
  Lock,
  AlertTriangle,
  BookOpen,
  Stethoscope,
  Info,
} from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const pillars = [
    {
      num: 1,
      icon: <Brain className="w-5 h-5 text-sky-600" />,
      title: 'Multimodal Prescription Image Extraction',
      desc: 'Gemini multimodal vision models extract printed text, brand names, and dosage lines from prescription bottle photographs. Extraction is purely observational and never assumed final.',
    },
    {
      num: 2,
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      title: 'Extracted Data Error Boundary',
      desc: 'Multimodal vision models can misread distorted text or lighting glare. Extracted data is always treated as an unconfirmed candidate requiring human verification.',
    },
    {
      num: 3,
      icon: <UserCheck className="w-5 h-5 text-teal-600" />,
      title: 'Human-in-the-Loop Confirmation Gate',
      desc: 'Only explicitly reviewed and confirmed medications enter the active Medication Twin. Unverified candidates remain isolated in staging.',
    },
    {
      num: 4,
      icon: <FileCheck2 className="w-5 h-5 text-indigo-600" />,
      title: 'Deterministic Interaction Matching Engine',
      desc: 'Safety checks match normalized drug identities against a curated, traceable interaction dataset. The engine is 100% deterministic and cannot fabricate interactions.',
    },
    {
      num: 5,
      icon: <BookOpen className="w-5 h-5 text-blue-600" />,
      title: 'DailyMed Drug-Label Information Lookup',
      desc: 'DailyMed integration retrieves official FDA package insert excerpts for context. DailyMed is a reference source, not an exhaustive interaction checker.',
    },
    {
      num: 6,
      icon: <Sparkles className="w-5 h-5 text-purple-600" />,
      title: 'Generative AI Explanation Boundary',
      desc: 'Gemini is restricted to translating retrieved, verified evidence into elder-friendly plain English. The model never decides whether an interaction exists.',
    },
    {
      num: 7,
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      title: 'Absence of Evidence Safeguard',
      desc: 'If no interaction matches in the dataset, the system reports "No verified matches in current dataset" and explicitly warns that absence of evidence does not establish safety.',
    },
    {
      num: 8,
      icon: <Clock className="w-5 h-5 text-orange-600" />,
      title: 'Non-Verification of Ingestion',
      desc: 'Medication reminders and timeline logs record reported adherence only. Digital reminders do not physically verify whether pills were ingested.',
    },
    {
      num: 9,
      icon: <Lock className="w-5 h-5 text-rose-600" />,
      title: 'Zero Treatment Alteration Boundary',
      desc: 'MedSafe Twin never diagnoses conditions, prescribes therapy, or alters dosages. Regimen adjustments remain strictly the province of healthcare providers.',
    },
    {
      num: 10,
      icon: <Stethoscope className="w-5 h-5 text-cyan-600" />,
      title: 'Mandatory Clinical Escalation',
      desc: 'All interaction alerts and caregiver observations direct the patient and caregiver to consult their pharmacist or prescribing physician before taking action.',
    },
  ];

  return (
    <section
      aria-label="How MedSafe Twin Works"
      className="bg-gradient-to-br from-slate-50 via-sky-50/40 to-teal-50/30 rounded-3xl border border-sky-200/80 shadow-xs overflow-hidden transition-all"
    >
      <div className="p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-600 text-white rounded-2xl shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  How MedSafe Twin Works
                </h3>
                <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  Responsible AI Architecture
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Faculty-grade breakdown of multimodal AI, deterministic evidence grounding, and safety boundaries (10 Principles).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 bg-white hover:bg-sky-50 text-sky-800 font-bold text-xs sm:text-sm rounded-xl border border-sky-300 shadow-2xs transition-all flex items-center gap-2 self-start sm:self-auto"
            aria-expanded={isExpanded}
            aria-controls="how-it-works-pillars"
          >
            <span>{isExpanded ? 'Hide Architecture' : 'Explore Architecture (10 Principles)'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isExpanded && (
          <div
            id="how-it-works-pillars"
            className="mt-6 pt-6 border-t border-sky-200/60 space-y-4 animate-fadeIn"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pillars.map((p) => (
                <div
                  key={p.num}
                  className="bg-white/90 p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-start gap-3.5 hover:border-sky-300 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs text-slate-700">
                    {p.num}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {p.icon}
                      <h4 className="font-bold text-sm text-slate-900">{p.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mandatory Academic Prototype Scope & Safeguard Disclaimer */}
            <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 text-xs text-amber-950 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Academic Prototype Scope & Non-Clinical Disclaimer</span>
              </div>
              <p className="leading-relaxed">
                MedSafe Twin is an academic prototype created for demonstrating Generative AI, prompt engineering, multimodal extraction, evidence grounding, and Responsible AI principles.
              </p>
              <p className="leading-relaxed font-semibold text-amber-900">
                This software is <strong>NOT</strong> clinically validated, <strong>NOT</strong> production-ready, and makes <strong>NO claim</strong> to prevent hospitalizations or adverse clinical events. All clinical decisions and treatment adjustments must be made exclusively by licensed healthcare professionals.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
