import type { ResponseUnit } from '../api/client';

interface ResponseFleetProps {
  units: ResponseUnit[];
  selectedUnit: ResponseUnit | null;
  onSelectUnit: (u: ResponseUnit) => void;
}

export const ResponseFleet: React.FC<ResponseFleetProps> = ({
  units = [],
  selectedUnit,
  onSelectUnit,
}) => {
  if (units.length === 0) {
    return (
      <div>
        <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-3">
          Response units
        </h2>
        <p className="text-[13px] text-[var(--color-text-tertiary)] py-4">
          No response units registered.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-3">
        Response units
      </h2>

      <div className="flex flex-col gap-0.5">
        {units.map((unit) => {
          const isAvail = unit.available || unit.status === 'AVAILABLE';
          const isSelected = selectedUnit?.id === unit.id;
          const uX = unit.gridX ?? unit.gridPos?.[0] ?? '?';
          const uY = unit.gridY ?? unit.gridPos?.[1] ?? '?';

          return (
            <div key={unit.id} className="flex flex-col">
              <button
                onClick={() => onSelectUnit(unit)}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-white border border-[var(--color-border)] shadow-sm rounded-b-none border-b-0'
                    : 'hover:bg-white/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[12px] text-[var(--color-text-tertiary)] w-10">
                    {String(unit.id).padStart(2, '0')}
                  </span>
                  <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                    {unit.type}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[12px] font-medium ${
                      isAvail
                        ? 'text-[var(--color-green)]'
                        : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {isAvail ? 'Available' : 'Deployed'}
                  </span>
                </div>
              </button>

              {isSelected && (
                <div className="px-4 pb-3 pt-1 bg-white border border-t-0 border-[var(--color-border)] rounded-b-lg text-[13px] flex flex-col gap-1.5 shadow-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-tertiary)]">Position</span>
                    <span className="font-mono text-[var(--color-text-secondary)]">[{uX}, {uY}]</span>
                  </div>
                  {!isAvail && (
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-tertiary)]">Assigned incident</span>
                      <span className="text-[var(--color-text-primary)] font-medium">#{unit.assignedEmergencyId}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResponseFleet;
