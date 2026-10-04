import type { ResponseUnit, Emergency } from '../api/client';

interface LiveResponseStatusProps {
  units: ResponseUnit[];
  emergencies: Emergency[];
  selectedUnit: ResponseUnit | null;
  onSelectUnit: (u: ResponseUnit) => void;
  onSimulateStep: () => void;
  onResolveEmergency: (id: number) => void;
  isSimulating?: boolean;
}

export const LiveResponseStatus: React.FC<LiveResponseStatusProps> = ({
  units,
  emergencies,
  selectedUnit,
  onSelectUnit: _onSelectUnit,
  onSimulateStep,
  onResolveEmergency,
  isSimulating = false,
}) => {
  const deployedUnits = units.filter(
    (u) => !u.available || u.status === 'BUSY' || u.status === 'DISPATCHED'
  );

  if (deployedUnits.length === 0) return null;

  const activeUnit =
    selectedUnit && (!selectedUnit.available || selectedUnit.status === 'DISPATCHED')
      ? selectedUnit
      : deployedUnits[0];

  if (!activeUnit) return null;

  const targetEmergency =
    activeUnit.assignedEmergencyId !== -1
      ? emergencies.find((e) => e.id === activeUnit.assignedEmergencyId)
      : null;

  const uX = activeUnit.gridX ?? activeUnit.gridPos?.[0] ?? 0;
  const uY = activeUnit.gridY ?? activeUnit.gridPos?.[1] ?? 0;
  let distance = 0;

  if (targetEmergency) {
    const tX = targetEmergency.gridX ?? targetEmergency.gridPos?.[0] ?? 0;
    const tY = targetEmergency.gridY ?? targetEmergency.gridPos?.[1] ?? 0;
    distance = Math.abs(uX - tX) + Math.abs(uY - tY);
  }

  const isArrived = !activeUnit.available && distance === 0;

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] p-5">
      <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-4">
        Active deployment
      </h3>

      {/* Unit info */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
            {activeUnit.type} #{activeUnit.id}
          </span>
          <span className="text-[12px] text-[var(--color-text-tertiary)] ml-2 font-mono">
            [{uX}, {uY}]
          </span>
        </div>
        <span className={`text-[12px] font-medium ${isArrived ? 'text-[var(--color-green)]' : 'text-[var(--color-text-secondary)]'}`}>
          {isArrived ? 'On scene' : 'En route'}
        </span>
      </div>

      {/* Progress bar */}
      {targetEmergency && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-[12px] text-[var(--color-text-tertiary)] mb-1.5">
            <span>
              Responding to Emergency #{targetEmergency.id}
            </span>
            <span className="font-mono">
              {distance} blocks
            </span>
          </div>
          <div className="w-full h-1.5 bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                distance === 0 ? 'bg-[var(--color-green)]' : 'bg-[var(--color-text-primary)]'
              }`}
              style={{ width: `${Math.max(8, Math.min(100, 100 - distance * 10))}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSimulateStep}
          disabled={isSimulating}
          className="px-3 py-1.5 text-[13px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg)] hover:bg-[#EFECE7] border border-[var(--color-border)] rounded-lg transition-colors cursor-pointer disabled:opacity-40"
        >
          Advance step
        </button>
        {targetEmergency && (
          <button
            onClick={() => onResolveEmergency(targetEmergency.id)}
            className="px-3 py-1.5 text-[13px] font-medium text-[var(--color-green)] bg-[var(--color-green-soft)] hover:bg-[#E5FAF0] rounded-lg transition-colors cursor-pointer"
          >
            Resolve
          </button>
        )}
      </div>
    </div>
  );
};

export default LiveResponseStatus;
