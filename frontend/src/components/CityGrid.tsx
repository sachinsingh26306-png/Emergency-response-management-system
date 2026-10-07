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

/* ──────────────────── tiny inline SVG icons ──────────────────── */

const HospitalIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const StationIcon = () => (
  <svg viewBox="0 0 24 24" className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2 L22 8.5 V22 H2 V8.5 Z" />
    <rect x="8" y="14" width="8" height="8" />
    <line x1="12" y1="14" x2="12" y2="22" />
  </svg>
);

const unitIcons: Record<string, (color: string) => React.ReactNode> = {
  'Fire Truck': (c) => (
    <svg viewBox="0 0 20 20" className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px]">
      <rect x="2" y="6" width="16" height="8" rx="2" fill={c} />
      <rect x="12" y="4" width="5" height="4" rx="1" fill={c} opacity="0.7" />
      <circle cx="6" cy="16" r="2" fill={c} />
      <circle cx="14" cy="16" r="2" fill={c} />
    </svg>
  ),
  'Ambulance': (c) => (
    <svg viewBox="0 0 20 20" className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px]">
      <rect x="1" y="6" width="18" height="8" rx="2" fill={c} />
      <line x1="10" y1="7" x2="10" y2="13" stroke="white" strokeWidth="1.5" />
      <line x1="7" y1="10" x2="13" y2="10" stroke="white" strokeWidth="1.5" />
      <circle cx="5" cy="16" r="2" fill={c} />
      <circle cx="15" cy="16" r="2" fill={c} />
    </svg>
  ),
  'Police Car': (c) => (
    <svg viewBox="0 0 20 20" className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px]">
      <rect x="2" y="7" width="16" height="7" rx="2" fill={c} />
      <rect x="5" y="4" width="10" height="5" rx="2" fill={c} opacity="0.7" />
      <rect x="8" y="3" width="4" height="2" rx="1" fill="#5B8BD4" />
      <circle cx="6" cy="16" r="2" fill={c} />
      <circle cx="14" cy="16" r="2" fill={c} />
    </svg>
  ),
  'Rescue Team': (c) => (
    <svg viewBox="0 0 20 20" className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px]">
      <circle cx="10" cy="7" r="3" fill={c} />
      <path d="M4 18 Q4 12 10 12 Q16 12 16 18" fill={c} />
    </svg>
  ),
  'Hazmat Unit': (c) => (
    <svg viewBox="0 0 20 20" className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px]">
      <polygon points="10,2 18,18 2,18" fill="none" stroke={c} strokeWidth="2" />
      <text x="10" y="15" textAnchor="middle" fill={c} fontSize="9" fontWeight="bold">!</text>
    </svg>
  ),
};

const getUnitIcon = (type: string, color: string) => {
  const renderer = unitIcons[type];
  if (renderer) return renderer(color);
  // Fallback generic
  return (
    <svg viewBox="0 0 20 20" className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px]">
      <rect x="2" y="6" width="16" height="8" rx="2" fill={color} />
      <circle cx="6" cy="16" r="2" fill={color} />
      <circle cx="14" cy="16" r="2" fill={color} />
    </svg>
  );
};

/* ──────────────── Emergency type → emoji glyph ──────────────── */
const emergencyGlyph: Record<string, string> = {
  Fire: '🔥',
  Medical: '🚑',
  Crime: '🚨',
  Accident: '💥',
  Hazmat: '☣',
  Rescue: '🆘',
};

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
    const map = new Map<string, Emergency[]>();
    emergencies.forEach((e) => {
      if (e.status === 'Resolved') return;
      const r = e.gridX ?? e.gridPos?.[0] ?? 0;
      const c = e.gridY ?? e.gridPos?.[1] ?? 0;
      const key = `${r},${c}`;
      const arr = map.get(key) || [];
      arr.push(e);
      map.set(key, arr);
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
    const emArr = emergencyMap.get(key);
    if (emArr && emArr.length > 0) {
      // Cycle through stacked emergencies on repeated clicks
      if (emArr.length === 1) {
        onSelectEmergency(emArr[0]);
      } else {
        const currentIdx = selectedEmergency
          ? emArr.findIndex((e) => e.id === selectedEmergency.id)
          : -1;
        const nextIdx = (currentIdx + 1) % emArr.length;
        onSelectEmergency(emArr[nextIdx]);
      }
      return;
    }
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
    const emArr = emergencyMap.get(key);
    const un = unitMap.get(key);
    const ch = grid?.[hoveredCell.r]?.[hoveredCell.c] || '.';
    if (emArr && emArr.length > 0) {
      const em = emArr[0];
      const base = `Emergency #${em.id} · ${em.type} · Severity ${em.severity}/10`;
      return emArr.length > 1 ? `${base} (+${emArr.length - 1} more)` : base;
    }
    if (un) return `Unit ${un.id} · ${un.type} · ${un.available ? 'Available' : 'Deployed'}`;
    if (ch === 'H') return 'Hospital';
    if (ch === 'S') return 'Station';
    if (ch === '#') return 'Building';
    return null;
  }, [hoveredCell, emergencyMap, unitMap, grid]);

  const getCellContent = (r: number, c: number, ch: string) => {
    const key = `${r},${c}`;
    const emArr = emergencyMap.get(key);
    const un = unitMap.get(key);
    const isSelected = selectedCoords?.r === r && selectedCoords?.c === c;
    const isPath = pathCells.has(key);

    // ── Emergency cell ──
    if (emArr && emArr.length > 0) {
      const em = emArr[0];
      const isCritical = em.severity >= 8;
      const glyph = emergencyGlyph[em.type] || '⚠';
      const hasStack = emArr.length > 1;
      return (
        <div
          className={`city-cell city-cell--emergency ${isCritical ? 'city-cell--critical' : ''} ${isSelected ? 'city-cell--selected' : ''}`}
          style={{
            background: isCritical
              ? 'linear-gradient(135deg, #C43333 0%, #A82828 100%)'
              : 'linear-gradient(135deg, #D97755 0%, #C46842 100%)',
          }}
        >
          <span className="city-cell__glyph">{glyph}</span>
          <span className="city-cell__label city-cell__label--light">{em.id}</span>
          {hasStack && (
            <span className="city-cell__stack-badge">+{emArr.length - 1}</span>
          )}
        </div>
      );
    }

    // ── Unit cell ──
    if (un) {
      const deployed = !un.available;
      const iconColor = deployed ? '#fff' : '#6B6B6B';
      return (
        <div
          className={`city-cell city-cell--unit ${deployed ? 'city-cell--deployed' : ''} ${isSelected ? 'city-cell--selected' : ''}`}
          style={{
            background: deployed
              ? 'linear-gradient(135deg, #2D3A4E 0%, #1A2636 100%)'
              : 'linear-gradient(135deg, #F0EDE8 0%, #E8E5E0 100%)',
          }}
        >
          {getUnitIcon(un.type, iconColor)}
          <span className={`city-cell__label ${deployed ? 'city-cell__label--light' : 'city-cell__label--dark'}`}>
            {un.id}
          </span>
        </div>
      );
    }

    // ── Hospital ──
    if (ch === 'H') {
      return (
        <div className={`city-cell city-cell--hospital ${isSelected ? 'city-cell--selected' : ''}`}>
          <HospitalIcon />
          <span className="city-cell__label city-cell__label--accent">H</span>
        </div>
      );
    }

    // ── Station ──
    if (ch === 'S') {
      return (
        <div className={`city-cell city-cell--station ${isSelected ? 'city-cell--selected' : ''}`}>
          <StationIcon />
          <span className="city-cell__label city-cell__label--accent">S</span>
        </div>
      );
    }

    // ── Building ──
    if (ch === '#') {
      return (
        <div className="city-cell city-cell--building">
          <div className="city-cell__building-inner" />
        </div>
      );
    }

    // ── Road — dispatch path or empty ──
    return (
      <div className={`city-cell city-cell--road ${isPath ? 'city-cell--path' : ''}`}>
        {/* Subtle road marking */}
        <div className="city-cell__road-line" />
      </div>
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
        <div className="flex-1 flex flex-col items-center justify-center city-grid-container py-8 px-4 relative">
          <div className="inline-flex flex-col gap-[2px]">
            {/* Column headers */}
            <div className="flex gap-[2px] ml-6 mb-1">
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
              <div key={r} className="flex items-center gap-[2px]">
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
                  const emArrAtCell = emergencyMap.get(key);
                  const isClickable = (emArrAtCell && emArrAtCell.length > 0) || unitMap.has(key) || ch === 'H' || ch === 'S';
                  
                  return (
                    <div
                      key={c}
                      className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 flex-shrink-0 transition-transform duration-150 ${
                        isClickable ? 'cursor-pointer hover:scale-[1.08] hover:z-10' : ''
                      }`}
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
          <div className="absolute bottom-3 right-4 flex items-center gap-3 text-[10px] text-[var(--color-text-tertiary)]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-[3px]" style={{ background: 'linear-gradient(135deg, #D97755, #C46842)' }} />
              <span>Emergency</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-[3px]" style={{ background: 'linear-gradient(135deg, #F0EDE8, #E8E5E0)' }} />
              <span>Unit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-[3px] city-cell--building-swatch" />
              <span>Building</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-[3px] bg-white border border-[#B8D4C8] flex items-center justify-center text-[7px] text-[#2D7A4F] font-bold">+</div>
              <span>Hospital</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-[3px] bg-white border border-[#C2B8A3] flex items-center justify-center text-[7px] text-[#92400E] font-bold">▲</div>
              <span>Station</span>
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
