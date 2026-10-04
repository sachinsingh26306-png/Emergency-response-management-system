import type { Emergency, ResponseUnit } from '../api/client';

interface IncidentIntelligenceProps {
  emergency: Emergency | null;
  assignedUnit?: ResponseUnit | null;
  queuePosition?: number | null;
  onDispatch?: (emergency: Emergency) => void;
  onSimulate?: () => void;
  onResolve?: (id: number) => void;
  isDispatching?: boolean;
  autoSimulate?: boolean;
  onToggleAutoSimulate?: () => void;
}

export const IncidentIntelligence: React.FC<IncidentIntelligenceProps> = ({
  emergency,
  assignedUnit,
  queuePosition,
  onDispatch,
  onSimulate,
  onResolve,
  isDispatching = false,
  autoSimulate,
  onToggleAutoSimulate,
}) => {
  if (!emergency) {
    return (
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-1">
          Select an incident
        </h3>
        <p className="text-[13px] text-[var(--color-text-tertiary)] max-w-[280px]">
          Report a new emergency, or choose an existing incident from the city grid or priority queue to manage its response.
        </p>
      </div>
    );
  }

  const urgency =
    emergency.urgency ||
    (emergency.severity >= 8 ? 'Critical' : emergency.severity >= 5 ? 'High' : 'Moderate');
  const location = emergency.locationName || emergency.location || 'Unknown';
  const gridCoords = `${emergency.gridX ?? emergency.gridPos?.[0] ?? '?'}, ${emergency.gridY ?? emergency.gridPos?.[1] ?? '?'}`;
  const priority = emergency.priorityScore || emergency.priority || 0;

  // Compute distance if unit assigned
  let distance: number | null = null;
  if (assignedUnit) {
    const uR = assignedUnit.gridX ?? assignedUnit.gridPos?.[0] ?? 0;
    const uC = assignedUnit.gridY ?? assignedUnit.gridPos?.[1] ?? 0;
    const eR = emergency.gridX ?? emergency.gridPos?.[0] ?? 0;
    const eC = emergency.gridY ?? emergency.gridPos?.[1] ?? 0;
    distance = Math.abs(uR - eR) + Math.abs(uC - eC);
  }

  // Workflow progress
  let activeStage = 0;
  if (emergency.status === 'Reported' || emergency.status === 'Waiting') activeStage = 3; // Dispatch
  else if (emergency.status === 'Dispatched' && distance !== null && distance > 0) activeStage = 4; // Simulate
  else if (emergency.status === 'Dispatched' && distance === 0) activeStage = 5; // Resolve
  else if (emergency.status === 'Resolved') activeStage = 6; // Done

  const stages = ['Report', 'Analyze', 'Prioritize', 'Dispatch', 'Simulate', 'Resolve'];

  return (
    <div className="bg-white rounded-xl border border-[var(--color-border)] p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
            Incident details
          </h3>
          <p className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5">
            Emergency #{emergency.id}
          </p>
        </div>
        <span
          className={`text-[12px] font-medium px-2 py-0.5 rounded-md ${
            emergency.status === 'Resolved'
              ? 'bg-[var(--color-green-soft)] text-[var(--color-green)]'
              : emergency.status === 'Dispatched'
              ? 'bg-[var(--color-bg)] text-[var(--color-text-secondary)]'
              : 'bg-[var(--color-red-soft)] text-[var(--color-red)]'
          }`}
        >
          {emergency.status}
        </span>
      </div>

      {/* Workflow Timeline */}
      <div className="flex items-center justify-between mb-6 border border-[var(--color-border-subtle)] rounded-lg px-3 py-2 bg-[#FBFBFA]">
        {stages.map((stage, idx) => {
          const isCompleted = idx < activeStage;
          const isActive = idx === activeStage;
          
          return (
            <div key={stage} className="flex items-center gap-1">
              <div
                className={`text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded ${
                  isActive
                    ? 'bg-[var(--color-red-soft)] text-[var(--color-red)]'
                    : isCompleted
                    ? 'text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-tertiary)] opacity-60'
                }`}
              >
                {stage}
              </div>
              {idx < stages.length - 1 && (
                <div className={`text-[10px] ${isCompleted ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-border)]'}`}>
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Original report */}
      <div className="mb-4">
        <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
          "{emergency.description || emergency.summary || `Emergency reported at ${location}`}"
        </p>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
        <DetailRow label="Type" value={emergency.type} />
        <DetailRow label="Severity" value={`${emergency.severity} / 10`} highlight={emergency.severity >= 8} />
        <DetailRow label="Affected" value={`${emergency.peopleAffected} people`} />
        <DetailRow label="Urgency" value={urgency} highlight={urgency === 'Critical'} />
        <DetailRow label="Traffic" value={emergency.traffic || 'Normal'} />
        <DetailRow label="Location" value={location} />
        <DetailRow label="Grid" value={gridCoords} mono />
        <DetailRow
          label="Queue position"
          value={
            queuePosition !== undefined && queuePosition !== null
              ? `#${queuePosition + 1}`
              : emergency.status === 'Dispatched'
              ? '—'
              : '#1'
          }
          mono
        />
      </div>

      {/* Priority */}
      <div className="flex items-center justify-between py-3 border-t border-[var(--color-border-subtle)]">
        <span className="text-[13px] text-[var(--color-text-tertiary)]">
          Response priority
        </span>
        <span className="text-xl font-semibold font-mono text-[var(--color-text-primary)]">
          {priority.toFixed(0)}
        </span>
      </div>

      {/* Assigned unit */}
      {assignedUnit && (
        <div className="flex items-center justify-between py-3 border-t border-[var(--color-border-subtle)]">
          <span className="text-[13px] text-[var(--color-text-tertiary)]">
            Assigned response
          </span>
          <span className="text-[13px] text-[var(--color-text-primary)] font-medium">
            {assignedUnit.type} #{assignedUnit.id}
            {distance !== null && (
              <span className="text-[var(--color-text-tertiary)] ml-2 font-mono text-[12px]">
                {distance} blocks
              </span>
            )}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[var(--color-border-subtle)]">
        {(emergency.status === 'Reported' || emergency.status === 'Waiting') && onDispatch && (
          <button
            onClick={() => onDispatch(emergency)}
            disabled={isDispatching}
            className="px-4 py-2.5 text-[13px] font-semibold text-white bg-[var(--color-red)] hover:bg-[#B02D2D] rounded-lg transition-colors cursor-pointer disabled:opacity-40 w-full"
          >
            Dispatch highest-priority emergency
          </button>
        )}

        {emergency.status === 'Dispatched' && distance !== null && distance > 0 && (
          <div className="flex gap-2 w-full">
            {onSimulate && (
              <button
                onClick={onSimulate}
                className="flex-1 px-4 py-2.5 text-[13px] font-semibold text-white bg-[var(--color-text-primary)] hover:bg-[#333] rounded-lg transition-colors cursor-pointer"
              >
                Simulate one step
              </button>
            )}
            {onToggleAutoSimulate && (
              <button
                onClick={onToggleAutoSimulate}
                className={`px-4 py-2.5 text-[13px] font-medium rounded-lg border transition-colors cursor-pointer ${
                  autoSimulate
                    ? 'bg-[var(--color-red-soft)] text-[var(--color-red)] border-[var(--color-red-soft)] hover:bg-[#FBE8E8]'
                    : 'text-[var(--color-text-secondary)] bg-[var(--color-bg)] border-[var(--color-border)] hover:bg-[#EFECE7]'
                }`}
              >
                Auto simulate
              </button>
            )}
          </div>
        )}

        {emergency.status === 'Dispatched' && distance === 0 && (
          <button
            onClick={() => { if(onResolve) onResolve(emergency.id); }}
            className="w-full px-4 py-2.5 text-[13px] font-semibold text-white bg-[var(--color-green)] hover:bg-[#246A44] rounded-lg transition-colors cursor-pointer"
          >
            Resolve incident
          </button>
        )}

        {emergency.status === 'Resolved' && (
          <div className="w-full bg-[var(--color-green-soft)] rounded-lg p-3 text-center border border-[#D1F0DE]">
            <div className="text-[13px] text-[var(--color-green)] font-semibold mb-0.5">
              ✓ Incident resolved
            </div>
            <div className="text-[12px] text-[#246A44]">
              Response unit returned to available status.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function DetailRow({
  label,
  value,
  highlight = false,
  mono = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[12px] text-[var(--color-text-tertiary)]">{label}</div>
      <div
        className={`text-[13px] font-medium mt-0.5 ${
          highlight
            ? 'text-[var(--color-red)]'
            : 'text-[var(--color-text-primary)]'
        } ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </div>
    </div>
  );
}

export default IncidentIntelligence;
