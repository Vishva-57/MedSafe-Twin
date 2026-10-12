import React, { useState } from 'react';
import {
  Pill,
  Search,
  Plus,
  RotateCcw,
  UserCheck,
  Clock,
  Sparkles,
  Info,
  Calendar,
  Trash2,
  X,
  FlaskConical,
} from 'lucide-react';
import { Medication, PageId } from '../types/index';
import { ResetDemoModal } from '../components/ResetDemoModal';

interface MyMedicationsPageProps {
  medications: Medication[];
  onAddMedication: (med: Omit<Medication, 'id'>) => void;
  onDeleteMedication: (id: string) => void;
  onResetDemoData: () => void;
  onNavigate: (page: PageId) => void;
}

export const MyMedicationsPage: React.FC<MyMedicationsPageProps> = ({
  medications,
  onAddMedication,
  onDeleteMedication,
  onResetDemoData,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Form state for adding new medication
  const [formData, setFormData] = useState({
    brandName: '',
    genericName: '',
    dosage: '',
    frequency: 'Once daily in the morning',
    prescribedFor: '',
    prescribingDoctor: 'Dr. Sarah Lin (Cardiology)',
    instructions: 'Take with full glass of water.',
    foodRelation: 'independent' as const,
    prescribedDate: new Date().toISOString().split('T')[0],
    refillsRemaining: 2,
    timings: ['morning'] as any,
  });

  const displayedMeds = medications.filter((med) => {
    const matchesSearch =
      med.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.prescribedFor.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'pending') return matchesSearch && med.verificationStatus === 'pending_review';
    if (filterStatus === 'confirmed') return matchesSearch && med.verificationStatus === 'confirmed';
    return matchesSearch;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brandName || !formData.dosage) return;

    onAddMedication({
      ...formData,
      status: 'active',
      verificationStatus: 'pending_review',
      recordOrigin: 'manual_session',
      isSynthetic: true,
    });

    setShowAddModal(false);
    setFormData({
      brandName: '',
      genericName: '',
      dosage: '',
      frequency: 'Once daily in the morning',
      prescribedFor: '',
      prescribingDoctor: 'Dr. Sarah Lin (Cardiology)',
      instructions: 'Take with full glass of water.',
      foodRelation: 'independent',
      prescribedDate: new Date().toISOString().split('T')[0],
      refillsRemaining: 2,
      timings: ['morning'],
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-100 text-sky-700 rounded-2xl">
              <Pill className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                My Medications
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                {medications.length} active prescriptions on file for Arthur Miller.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors inline-flex items-center gap-1.5"
            title="Reset to baseline 5-drug synthetic scenario"
          >
            <RotateCcw className="w-4 h-4 text-amber-700" />
            <span>Reset Demo Data</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('scanner')}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Scan Bottle</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-sky-600 text-white hover:bg-sky-700 transition-colors inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medication</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by brand, generic, or condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 self-stretch sm:self-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `All (${medications.length})` },
            { id: 'confirmed', label: 'Doctor Confirmed' },
            { id: 'pending', label: 'Pending Review' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors whitespace-nowrap ${
                filterStatus === f.id
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Medication Cards List or Helpful Empty State */}
      {displayedMeds.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="list">
          {displayedMeds.map((med) => (
            <div
              key={med.id}
              role="listitem"
              className="bg-white rounded-3xl p-6 border border-slate-200 hover:border-sky-300 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                {/* Top badges */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                      {med.brandName}
                    </h2>
                    <p className="text-sm font-medium text-slate-600">
                      {med.genericName}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {med.verificationStatus === 'confirmed' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Doctor Confirmed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending Review</span>
                      </span>
                    )}

                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-sky-50 text-sky-800">
                      {med.dosage}
                    </span>
                    {med.recordOrigin === 'extracted_session' && (
                      <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                        Recently Scanned
                      </span>
                    )}
                  </div>
                </div>

                {/* Indication / condition */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <Info className="w-3.5 h-3.5 text-sky-600" />
                    <span>Prescribed For</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{med.prescribedFor}</p>
                  <p className="text-xs text-slate-500">Prescriber: {med.prescribingDoctor}</p>
                </div>

                {/* Instructions & Food relation */}
                <div className="mt-3 text-xs sm:text-sm text-slate-700 space-y-1.5">
                  <p className="font-medium">
                    <strong className="text-slate-900">Directions:</strong> {med.instructions}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {med.frequency}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200">
                      Food: {med.foodRelation.replace('_', ' ')}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Refills left: {med.refillsRemaining}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Controls */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">ID: {med.id}</span>
                <button
                  type="button"
                  onClick={() => onDeleteMedication(med.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove prescription from demo twin"
                  aria-label={`Remove ${med.brandName}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* HELPFUL EMPTY STATE REQUIRED */
        <div className="bg-white rounded-3xl p-8 sm:p-14 text-center border-2 border-dashed border-sky-200 max-w-2xl mx-auto space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto shadow-inner">
            <Pill className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">
              No Medications in this View
            </h2>
            <p className="text-base text-slate-600 max-w-md mx-auto leading-relaxed">
              Arthur currently has no active prescriptions listed in this filter, or the demo regimen has been cleared.
            </p>
          </div>

          {/* Calming, elder-friendly assistance cards */}
          <div className="bg-sky-50/70 p-4 rounded-2xl border border-sky-100 text-left space-y-2 max-w-md mx-auto text-sm text-sky-950">
            <p className="font-bold flex items-center gap-1.5 text-sky-900">
              <Sparkles className="w-4 h-4 text-sky-600" />
              What would you like to do next?
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 text-xs sm:text-sm pl-1">
              <li>Use the camera scanner to photograph a pill bottle or prescription slip.</li>
              <li>Add a medication manually for caregiver review.</li>
              <li>Or click below to restore Arthur's demonstration regimen.</li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onResetDemoData();
              }}
              className="px-5 py-3 rounded-xl bg-sky-600 text-white font-bold text-sm sm:text-base hover:bg-sky-700 transition-colors inline-flex items-center gap-2 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restore 5 Sample Medications</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('scanner')}
              className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm sm:text-base transition-colors"
            >
              Scan Bottle with Camera
            </button>
          </div>
        </div>
      )}

      {/* Add Medication Demo Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Add Medication (Demo)</h3>
                  <p className="text-xs text-slate-500">Staged for caregiver & clinical confirmation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cozaar"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    className="mt-1 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Generic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Losartan Potassium"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    className="mt-1 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Dosage *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 50 mg"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    className="mt-1 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase">Prescribed For</label>
                  <input
                    type="text"
                    placeholder="e.g. Blood Pressure"
                    value={formData.prescribedFor}
                    onChange={(e) => setFormData({ ...formData, prescribedFor: e.target.value })}
                    className="mt-1 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase">Directions / Instructions</label>
                <input
                  type="text"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="mt-1 w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-sky-500"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium">
                New medications enter the review queue with <strong>Pending Review</strong> status until confirmed by Elena or Dr. Lin.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 shadow-sm"
                >
                  Add to Review Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Demo Reset */}
      <ResetDemoModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirmReset={onResetDemoData}
      />
    </div>
  );
};
