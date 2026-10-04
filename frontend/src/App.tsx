import './App.css';
import { useState, useEffect } from 'react';
import type { DashboardState, Emergency, ResponseUnit } from './api/client';
import {
  fetchState,
  dispatchNext,
  simulateStep,
  resolveEmergency,
} from './api/client';
import Header from './components/Header';
import TopTelemetryRibbon from './components/TopTelemetryRibbon';
import CityGrid from './components/CityGrid';
import TriagePipeline from './components/TriagePipeline';
import IncidentIntelligence from './components/IncidentIntelligence';
import LiveResponseStatus from './components/LiveResponseStatus';
import PriorityQueue from './components/PriorityQueue';
import ResponseFleet from './components/ResponseFleet';
import EngineTelemetry from './components/EngineTelemetry';
import ActivityStream from './components/ActivityStream';
import AiReportModal from './components/AiReportModal';

export function App() {
  const [state, setState] = useState<DashboardState | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<ResponseUnit | null>(null);

  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [autoSimulate, setAutoSimulate] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast((prev) => (prev?.text === text ? null : prev)), 3500);
  };

  const loadState = async () => {
    try {
      const data = await fetchState();
      setState(data);
      setConnected(true);
      setErrorMsg(null);

      setSelectedEmergency((prev) => {
        if (!prev) return data.priorityQueue?.[0] || data.emergencies?.[0] || null;
        const refreshed = data.emergencies?.find((e) => e.id === prev.id);
        return refreshed || data.priorityQueue?.[0] || data.emergencies?.[0] || null;
      });

      setSelectedUnit((prev) => {
        if (!prev) return null;
        return data.units?.find((u) => u.id === prev.id) || null;
      });
    } catch (err: any) {
      setConnected(false);
      setErrorMsg(err.message || 'Cannot reach backend');
    }
  };

  useEffect(() => {
    loadState();
    const id = setInterval(loadState, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!autoSimulate) return;
    const id = setInterval(async () => {
      try {
        const res = await simulateStep();
        if (res.movedCount > 0) loadState();
      } catch { /* silent */ }
    }, 2500);
    return () => clearInterval(id);
  }, [autoSimulate]);

  const handleDispatchTop = async () => {
    setIsDispatching(true);
    try {
      const res = await dispatchNext();
      if (res.success && res.dispatchedEmergency) {
        showToast(
          `${res.assignedUnit?.type} #${res.assignedUnit?.id} dispatched to Emergency #${res.dispatchedEmergency.id}`,
          'success'
        );
        setSelectedEmergency(res.dispatchedEmergency);
        if (res.assignedUnit) setSelectedUnit(res.assignedUnit);
        await loadState();
      }
    } catch (err: any) {
      showToast(err.message || 'Dispatch failed', 'info');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleSimulateStep = async () => {
    setIsSimulating(true);
    try {
      const res = await simulateStep();
      if (res.success) {
        showToast(
          res.movedCount > 0
            ? `${res.movedCount} unit${res.movedCount > 1 ? 's' : ''} advanced`
            : 'All units on scene',
          'info'
        );
        await loadState();
      }
    } catch (err: any) {
      showToast(err.message || 'Simulation failed', 'info');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResolveEmergency = async (id: number) => {
    try {
      const res = await resolveEmergency(id);
      if (res.success) {
        showToast(`Emergency #${id} resolved`, 'success');
        await loadState();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to resolve', 'info');
    }
  };

  const handleNewEmergencyReported = async (newEm: Emergency) => {
    setSelectedEmergency(newEm);
    showToast(`Emergency #${newEm.id} registered`, 'success');
    await loadState();
  };

  const assignedUnitForSelected =
    selectedEmergency?.assignedUnitId !== -1
      ? state?.units?.find((u) => u.id === selectedEmergency?.assignedUnitId)
      : null;

  const queuePos = state?.priorityQueue?.findIndex((e) => e.id === selectedEmergency?.id);

  const pendingCount = state?.priorityQueue?.length || state?.triageQueue?.length || 0;
  const activeDispatchesCount =
    state?.units?.filter((u) => !u.available || u.status === 'BUSY' || u.status === 'DISPATCHED')
      .length || 0;

  const hasActiveEmergencies = (state?.emergencies?.filter(e => e.status !== 'Resolved').length ?? 0) > 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-white rounded-lg shadow-lg border border-[var(--color-border)] text-[13px] text-[var(--color-text-primary)] animate-fade-in">
          {toast.text}
        </div>
      )}

      {/* Header */}
      <Header
        connected={connected}
        onOpenReportModal={() => setReportModalOpen(true)}
        onDispatchNext={handleDispatchTop}
        onSimulateStep={handleSimulateStep}
        autoSimulate={autoSimulate}
        onToggleAutoSimulate={() => setAutoSimulate(!autoSimulate)}
        isDispatching={isDispatching}
        isSimulating={isSimulating}
        pendingQueueCount={pendingCount}
        activeDispatchesCount={activeDispatchesCount}
      />

      {/* Offline banner */}
      {!connected && (
        <div className="mx-6 mt-4 px-4 py-3 bg-[var(--color-red-soft)] border border-[var(--color-red-border)] rounded-lg flex items-center justify-between">
          <p className="text-[13px] text-[var(--color-red)]">
            Cannot connect to C++ backend at localhost:8080
            {errorMsg && <span className="text-[var(--color-text-tertiary)] ml-1">— {errorMsg}</span>}
          </p>
          <button
            onClick={loadState}
            className="text-[13px] font-medium text-[var(--color-red)] hover:text-[#A02A2A] cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary stats */}
      <TopTelemetryRibbon state={state} />

      <div className="flex-1 px-6 pb-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* LEFT COLUMN - CITY GRID & LISTS */}
          <div className="xl:col-span-7 flex flex-col gap-8">
            <CityGrid
              grid={state?.grid}
              emergencies={state?.emergencies || []}
              units={state?.units || []}
              selectedEmergency={selectedEmergency}
              selectedUnit={selectedUnit}
              onSelectEmergency={(em) => setSelectedEmergency(em)}
              onSelectUnit={(un) => setSelectedUnit(un)}
            />
            
            <PriorityQueue
              queue={state?.priorityQueue || state?.triageQueue || []}
              selectedEmergency={selectedEmergency}
              onSelectEmergency={(em) => setSelectedEmergency(em)}
              onDispatchNext={handleDispatchTop}
              isDispatching={isDispatching}
            />

            <ActivityStream actions={state?.recentActions || state?.eventLog || []} />
          </div>

          {/* RIGHT COLUMN - DETAILS & UNITS */}
          <div className="xl:col-span-5 flex flex-col gap-8">
            {hasActiveEmergencies ? (
              <div className="flex flex-col gap-4">
                <TriagePipeline emergency={selectedEmergency} />
                <IncidentIntelligence
                  emergency={selectedEmergency}
                  assignedUnit={assignedUnitForSelected}
                  queuePosition={queuePos !== undefined && queuePos !== -1 ? queuePos : null}
                  onDispatch={handleDispatchTop}
                  onSimulate={handleSimulateStep}
                  onResolve={handleResolveEmergency}
                  isDispatching={isDispatching}
                  autoSimulate={autoSimulate}
                  onToggleAutoSimulate={() => setAutoSimulate(!autoSimulate)}
                />
                <LiveResponseStatus
                  units={state?.units || []}
                  emergencies={state?.emergencies || []}
                  selectedUnit={selectedUnit}
                  onSelectUnit={(u) => setSelectedUnit(u)}
                  onSimulateStep={handleSimulateStep}
                  onResolveEmergency={handleResolveEmergency}
                  isSimulating={isSimulating}
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[var(--color-border)] p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-10 h-10 rounded-full bg-[var(--color-green-soft)] flex items-center justify-center mb-4">
                  <span className="text-[var(--color-green)] text-lg">✓</span>
                </div>
                <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-1">
                  No active incidents
                </h3>
                <p className="text-[13px] text-[var(--color-text-tertiary)] mb-5 max-w-[280px]">
                  All response units are currently available.
                </p>
                <button
                  onClick={() => setReportModalOpen(true)}
                  className="px-4 py-2 text-[13px] font-semibold text-white bg-[var(--color-red)] hover:bg-[#B02D2D] rounded-lg transition-colors cursor-pointer"
                >
                  Report an emergency
                </button>
              </div>
            )}

            <ResponseFleet
              units={state?.units || []}
              selectedUnit={selectedUnit}
              onSelectUnit={(un) => {
                setSelectedUnit(un);
                if (un.assignedEmergencyId && un.assignedEmergencyId !== -1) {
                  const em = state?.emergencies?.find((e) => e.id === un.assignedEmergencyId);
                  if (em) setSelectedEmergency(em);
                }
              }}
            />

            <EngineTelemetry state={state} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[12px] text-[var(--color-text-tertiary)]">
        <span>Emergency Response Command Center</span>
        <span className="font-mono">C++ DSA Engine · Port 8080 · Poll 2s</span>
      </footer>

      {/* Report modal */}
      <AiReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSuccess={handleNewEmergencyReported}
      />
    </div>
  );
}

export default App;
