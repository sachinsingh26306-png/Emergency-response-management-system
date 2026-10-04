import { useState, useMemo } from 'react';
import type { Emergency, ResponseUnit } from '../api/client';

interface CityGridProps {
  grid?: string[][];
  emergencies: Emergency[];
  units: ResponseUnit[];
  selectedEmergency: Emergency | null;
  selectedUnit: ResponseUnit | null;
  onSelectEmergency: (e: Emergency) => void;
  onSelectUnit: (u: ResponseUnit) => void;
}

export const CityGrid: React.FC<CityGridProps> = ({
  grid,
  emergencies,
  units,
  selectedEmergency,
  selectedUnit,
  onSelectEmergency,
  onSelectUnit,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);

  const emergencyMap = useMemo(() => {
    const map = new Map<string, Emergency>();
    emergencies.forEach((e) => {
      if (e.status === 'Resolved') return;
      const r = e.gridX ?? e.gridPos?.[0] ?? 0;
      const c = e.gridY ?? e.gridPos?.[1] ?? 0;
      map.set(`${r},${c}`, e);
    });
    return map;
  }, [emergencies]);

  const unitMap = useMemo(() => {
    const map = new Map<string, ResponseUnit>();
    units.forEach((u) => {
      const r = u.gridX ?? u.gridPos?.[0] ?? 0;
      const c = u.gridY ?? u.gridPos?.[1] ?? 0;
      map.set(`${r},${c}`, u);
    });
    return map;
  }, [units]);

  // Dispatch paths
  const pathCells = useMemo(() => {
    const paths = new Set<string>();
    units.forEach((u) => {
      if (!u.available && u.assignedEmergencyId && u.assignedEmergencyId !== -1) {
        const em = emergencies.find((e) => e.id === u.assignedEmergencyId);
        if (em && em.status !== 'Resolved') {
          const uR = u.gridX ?? u.gridPos?.[0] ?? 0;
          const uC = u.gridY ?? u.gridPos?.[1] ?? 0;
          const eR = em.gridX ?? em.gridPos?.[0] ?? 0;
          const eC = em.gridY ?? em.gridPos?.[1] ?? 0;
          let r = uR, c = uC;
          while (r !== eR) { r += eR > r ? 1 : -1; paths.add(`${r},${c}`); }
          while (c !== eC) { c += eC > c ? 1 : -1; paths.add(`${r},${c}`); }
        }
      }
    });
    return paths;
  }, [units, emergencies]);

  const selectedCoords = useMemo(() => {
    if (selectedEmergency && selectedEmergency.status !== 'Resolved') {
      return { r: selectedEmergency.gridX ?? selectedEmergency.gridPos?.[0] ?? -1, c: selectedEmergency.gridY ?? selectedEmergency.gridPos?.[1] ?? -1 };
    }
    if (selectedUnit) {
      return { r: selectedUnit.gridX ?? selectedUnit.gridPos?.[0] ?? -1, c: selectedUnit.gridY ?? selectedUnit.gridPos?.[1] ?? -1 };
    }
    return null;
  }, [selectedEmergency, selectedUnit]);

  const handleClick = (r: number, c: number) => {
    const key = `${r},${c}`;
    const em = emergencyMap.get(key);
    if (em) { onSelectEmergency(em); return; }
    const un = unitMap.get(key);
    if (un) {
      onSelectUnit(un);
      if (un.assignedEmergencyId && un.assignedEmergencyId !== -1) {
        const rel = emergencies.find((e) => e.id === un.assignedEmergencyId);
        if (rel) onSelectEmergency(rel);
      }
    }
  };

  const hoveredInfo = useMemo(() => {
    if (!hoveredCell) return null;
    const key = `${hoveredCell.r},${hoveredCell.c}`;
    const em = emergencyMap.get(key);
    const un = unitMap.get(key);
    const ch = grid?.[hoveredCell.r]?.[hoveredCell.c] || '.';
    if (em) return `Emergency #${em.id} · ${em.type} · Severity ${em.severity}/10`;
    if (un) return `Unit ${un.id} · ${un.type} · ${un.available ? 'Available' : 'Deployed'}`;
    if (ch === 'H') return 'Hospital';
    if (ch === 'S') return 'Station';
    if (ch === '#') return 'Building';
    return null;
  }, [hoveredCell, emergencyMap, unitMap, grid]);

  const getCellContent = (r: number, c: number, ch: string) => {
    const key = `${r},${c}`;
    const em = emergencyMap.get(key);
    const un = unitMap.get(key);
    const isSelected = selectedCoords?.r === r && selectedCoords?.c === c;
    const isPath = pathCells.has(key);

    // Emergency cell
    if (em) {
      return (
        <div
          className={`w-full h-full rounded-[3px] flex items-center justify-center text-white text-[11px] font-semibold cursor-pointer transition-shadow ${
            em.severity >= 8 ? 'bg-[var(--color-red)]' : 'bg-[#D97755]'
          } ${isSelected ? 'ring-2 ring-[var(--color-text-primary)] ring-offset-2 ring-offset-[var(--color-bg)]' : ''}`}
        >
          {em.id}
        </div>
      );
    }

    // Unit cell
    if (un) {
      return (
        <div
          className={`w-full h-full rounded-[3px] flex items-center justify-center text-[11px] font-semibold cursor-pointer transition-shadow ${
            un.available
              ? 'bg-[#E8E5E0] text-[var(--color-text-secondary)]'
              : 'bg-[var(--color-text-primary)] text-white'
          } ${isSelected ? 'ring-2 ring-[var(--color-text-primary)] ring-offset-2 ring-offset-[var(--color-bg)]' : ''}`}
        >
          U{un.id}
        </div>
      );
    }

    // Hospital
    if (ch === 'H') {
      return (
        <div className="w-full h-full rounded-[4px] bg-white border border-[var(--color-border)] flex items-center justify-center text-[11px] text-[var(--color-text-tertiary)] font-medium">
          H
        </div>
      );
    }

    // Station
    if (ch === 'S') {
      return (
        <div className="w-full h-full rounded-[4px] bg-white border border-[var(--color-border)] flex items-center justify-center text-[11px] text-[var(--color-text-tertiary)] font-medium">
          S
        </div>
      );
    }

    // Building
    if (ch === '#') {
      return (
        <div className="w-full h-full rounded-[4px] bg-[#D5D0C8]" />
      );
    }

    // Road — dispatch path or empty
    return (
      <div
        className={`w-full h-full rounded-[4px] ${
          isPath ? 'bg-[#C2BCB4]' : 'bg-[#F0EDE8]'
        }`}
      />
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Grid header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          City grid
        </h2>
        {selectedCoords && selectedCoords.r >= 0 && (
          <span className="text-[12px] font-mono text-[var(--color-text-tertiary)]">
            [{selectedCoords.r}, {selectedCoords.c}]
          </span>
        )}
      </div>

      {/* Grid */}
      {grid && grid.length > 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-xl border border-[var(--color-border)] py-8 px-4 relative">
          <div className="inline-flex flex-col gap-[3px]">
            {/* Column headers */}
            <div className="flex gap-[3px] ml-6 mb-1">
              {Array.from({ length: 10 }).map((_, c) => (
                <div
                  key={c}
                  className={`w-10 sm:w-12 lg:w-14 h-4 text-center text-[11px] font-mono ${
                    selectedCoords?.c === c
                      ? 'text-[var(--color-text-primary)] font-semibold'
                      : 'text-[var(--color-text-tertiary)]'
                  }`}
                >
                  {c}
                </div>
              ))}
            </div>

            {grid.map((row, r) => (
              <div key={r} className="flex items-center gap-[3px]">
                {/* Row header */}
                <div
                  className={`w-5 text-right text-[11px] font-mono mr-1 ${
                    selectedCoords?.r === r
                      ? 'text-[var(--color-text-primary)] font-semibold'
                      : 'text-[var(--color-text-tertiary)]'
                  }`}
                >
                  {r}
                </div>

                {row.map((ch, c) => {
                  const key = `${r},${c}`;
                  const isClickable = emergencyMap.has(key) || unitMap.has(key) || ch === 'H' || ch === 'S';
                  
                  return (
                    <div
                      key={c}
                      className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 flex-shrink-0 ${isClickable ? 'cursor-pointer hover:ring-2 hover:ring-[var(--color-border)] hover:ring-offset-1 rounded-[4px]' : ''}`}
                      onMouseEnter={() => setHoveredCell({ r, c })}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => isClickable && handleClick(r, c)}
                    >
                      {getCellContent(r, c, ch)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Hover tooltip */}
          <div className="h-6 mt-4 text-[12px] text-[var(--color-text-tertiary)]">
            {hoveredInfo ? (
              <span>
                <span className="font-mono text-[var(--color-text-secondary)]">
                  [{hoveredCell?.r}, {hoveredCell?.c}]
                </span>{' '}
                {hoveredInfo}
              </span>
            ) : (
              <span>Hover to inspect a sector</span>
            )}
          </div>
          
          {/* Legend */}
          <div className="absolute bottom-4 right-4 flex items-center gap-4 text-[11px] text-[var(--color-text-tertiary)]">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-[2px] bg-[#D97755]" />
              <span>Emergency</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-[2px] bg-[#E8E5E0]" />
              <span>Unit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-[2px] bg-[#D5D0C8]" />
              <span>Building</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-[2px] bg-white border border-[var(--color-border)] flex items-center justify-center text-[8px]">H</div>
              <span>Hospital/Station</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[13px] text-[var(--color-text-tertiary)]">
            Waiting for grid data from backend…
          </p>
        </div>
      )}
    </div>
  );
};

export default CityGrid;
