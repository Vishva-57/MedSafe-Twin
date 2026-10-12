import React, { useState, useEffect } from 'react';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { MyMedicationsPage } from './pages/MyMedicationsPage';
import { PrescriptionScannerPage } from './pages/PrescriptionScannerPage';
import { SafetyCheckerPage } from './pages/SafetyCheckerPage';
import { CaregiverViewPage } from './pages/CaregiverViewPage';
import { apiService } from './services/api';
import { storageService } from './services/storageService';
import { ResetDemoModal } from './components/ResetDemoModal';
import {
  PageId,
  Medication,
  ScheduleItem,
  SafetyReviewStatus,
  CaregiverSummary,
  MedicationSchedule,
  AdherenceRecord,
  ScheduleTimeSlot,
} from './types/index';

// Initial fallback mock data if server isn't running yet during startup
import {
  mockMedications,
  mockTodaySchedule,
  mockSafetyStatus,
  mockCaregiverSummary,
} from './data/mockData';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [showGlobalResetModal, setShowGlobalResetModal] = useState<boolean>(false);

  // Core application state with local persistence
  const [medications, setMedications] = useState<Medication[]>(() =>
    storageService.getMedications()
  );
  const [schedule, setSchedule] = useState<ScheduleItem[]>(mockTodaySchedule);
  const [medSchedules, setMedSchedules] = useState<MedicationSchedule[]>(() =>
    storageService.getSchedules()
  );
  const [adherenceRecords, setAdherenceRecords] = useState<AdherenceRecord[]>(() =>
    storageService.getAdherenceRecords()
  );
  const [safetyReviewRequired, setSafetyReviewRequired] = useState<boolean>(() =>
    storageService.getSafetyReviewRequired()
  );
  const [safetyStatus, setSafetyStatus] = useState<SafetyReviewStatus | null>(mockSafetyStatus);
  const [caregiverSummary, setCaregiverSummary] = useState<CaregiverSummary | null>(mockCaregiverSummary);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);

  // Fetch initial data from backend API
  useEffect(() => {
    const loadBackendData = async () => {
      try {
        const [meds, sched, safety, caregiver] = await Promise.all([
          apiService.getMedications(),
          apiService.getSchedule(),
          apiService.getSafetyStatus(),
          apiService.getCaregiverSummary(),
        ]);
        if (meds && meds.length > 0) {
          setMedications(meds);
          storageService.saveMedications(meds);
          const synced = storageService.syncSchedulesWithMedications(meds);
          setMedSchedules(synced);
        }
        setSchedule(sched);
        setSafetyStatus(safety);
        setCaregiverSummary(caregiver);
        setBackendConnected(true);
      } catch (err) {
        // Fallback to local demo state if server is loading
        console.warn('Backend currently reaching fallback demo store:', err);
        setBackendConnected(false);
      }
    };

    loadBackendData();
  }, []);

  // Adherence recording (Step 4 & Step 5)
  const handleRecordAdherence = (
    scheduleId: string,
    medicationId: string,
    status: 'taken' | 'skipped'
  ) => {
    const updated = storageService.recordAdherence(scheduleId, medicationId, status, 'elder');
    setAdherenceRecords([...updated]);

    // Update legacy schedule item in parallel
    setSchedule((prev) =>
      prev.map((item) =>
        item.id === scheduleId
          ? {
              ...item,
              taken: status === 'taken',
              takenAt: status === 'taken'
                ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : undefined,
            }
          : item
      )
    );

    // Call server API if connected
    apiService.toggleScheduleItem(scheduleId).catch(() => {});
  };

  // Confirm schedule timing for items marked needs_confirmation
  const handleConfirmScheduleTiming = (
    scheduleId: string,
    slot: ScheduleTimeSlot,
    clockTime?: string
  ) => {
    const updated = storageService.confirmScheduleTiming(scheduleId, slot, clockTime);
    setMedSchedules([...updated]);
  };

  // Toggle dose taken in schedule (Legacy bridge)
  const handleToggleSchedule = async (id: string) => {
    const target = medSchedules.find((s) => s.id === id);
    const todayStr = new Date().toISOString().split('T')[0];
    const existingRec = adherenceRecords.find(
      (r) => r.scheduleId === id && r.scheduledDate === todayStr
    );
    const nextStatus = existingRec?.status === 'taken' ? 'skipped' : 'taken';
    handleRecordAdherence(id, target?.medicationId || id, nextStatus);
  };

  // Add new medication (Step 11: marks safety review as required!)
  const handleAddMedication = async (newMedData: Omit<Medication, 'id'>) => {
    const tempMed: Medication = {
      ...newMedData,
      id: `med-${Date.now()}`,
    };
    const updatedMeds = [tempMed, ...medications];
    setMedications(updatedMeds);
    storageService.saveMedications(updatedMeds);

    // Re-sync schedules
    const updatedSchedules = storageService.syncSchedulesWithMedications(updatedMeds);
    setMedSchedules(updatedSchedules);

    // Step 11: Mark safety review as recommended!
    storageService.setSafetyReviewRequired(true);
    setSafetyReviewRequired(true);

    try {
      await apiService.addMedication(newMedData);
    } catch {
      // Handled in local state
    }
  };

  // Delete medication (Step 11: marks safety review as required!)
  const handleDeleteMedication = async (id: string) => {
    const updatedMeds = medications.filter((m) => m.id !== id);
    setMedications(updatedMeds);
    storageService.saveMedications(updatedMeds);

    // Re-sync schedules
    const updatedSchedules = storageService.syncSchedulesWithMedications(updatedMeds);
    setMedSchedules(updatedSchedules);

    // Step 11: Regimen changed -> mark review required
    storageService.setSafetyReviewRequired(true);
    setSafetyReviewRequired(true);

    try {
      await apiService.deleteMedication(id);
    } catch {
      // Handled in local state
    }
  };

  // Reset demo medications
  const handleResetDemoData = () => {
    storageService.resetAll();
    setMedications(mockMedications);
    storageService.saveMedications(mockMedications);
    const synced = storageService.syncSchedulesWithMedications(mockMedications);
    setMedSchedules(synced);
    setAdherenceRecords(storageService.getAdherenceRecords());
    setSafetyReviewRequired(false);
    storageService.setSafetyReviewRequired(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      {/* 1. Mandatory Prototype Disclaimer */}
      <DisclaimerBanner onTriggerResetDemo={() => setShowGlobalResetModal(true)} />

      {/* 2. Top Navigation Bar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        medicationCount={medications.length}
      />

      {/* 3. Main Full-Stack Application Layout */}
      <div className="flex-1 flex flex-row">
        {/* Desktop Sidebar Navigation */}
        <div className="hidden lg:block shrink-0">
          <Sidebar
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            medicationCount={medications.length}
            pendingConfirmationsCount={
              medications.filter((m) => m.verificationStatus === 'pending_review').length
            }
          />
        </div>

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Active Page View */}
          {currentPage === 'dashboard' && (
            <DashboardPage
              medications={medications}
              schedule={schedule}
              medSchedules={medSchedules}
              adherenceRecords={adherenceRecords}
              safetyStatus={safetyStatus}
              safetyReviewRequired={safetyReviewRequired}
              onToggleSchedule={handleToggleSchedule}
              onRecordAdherence={handleRecordAdherence}
              onConfirmScheduleTiming={handleConfirmScheduleTiming}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'medications' && (
            <MyMedicationsPage
              medications={medications}
              onAddMedication={handleAddMedication}
              onDeleteMedication={handleDeleteMedication}
              onResetDemoData={handleResetDemoData}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'scanner' && (
            <PrescriptionScannerPage
              onNavigate={setCurrentPage}
              onSaveConfirmedMedication={handleAddMedication}
            />
          )}

          {currentPage === 'safety' && (
            <SafetyCheckerPage
              medications={medications}
              onSafetyCheckComplete={() => setSafetyReviewRequired(false)}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'caregiver' && (
            <CaregiverViewPage
              summary={caregiverSummary}
              onNavigate={setCurrentPage}
            />
          )}
        </main>
      </div>

      {/* Persistent Academic & Accessibility Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            <strong>MedSafe Twin</strong> — Polypharmacy Guardian for Elders • Academic Prototype
          </p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendConnected ? 'bg-emerald-500' : 'bg-sky-500'
                }`}
              />
              <span>{backendConnected ? 'Backend Connected (Express :5000)' : 'Client Local Simulated Store'}</span>
            </span>
            <span>•</span>
            <span>Responsible AI & Human-in-the-Loop</span>
          </div>
        </div>
      </footer>

      {/* Global Reset Demo Scenario Modal */}
      <ResetDemoModal
        isOpen={showGlobalResetModal}
        onClose={() => setShowGlobalResetModal(false)}
        onConfirmReset={handleResetDemoData}
      />
    </div>
  );
};

export default App;
