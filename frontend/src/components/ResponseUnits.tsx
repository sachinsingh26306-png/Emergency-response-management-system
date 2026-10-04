import React from 'react';
import { Truck, Flame, HeartPulse, ShieldAlert } from 'lucide-react';
import type { ResponseUnit } from '../api/client';

interface ResponseUnitsProps {
  units: ResponseUnit[];
}

export const ResponseUnits: React.FC<ResponseUnitsProps> = ({ units }) => {
  const getUnitIcon = (type: string) => {
    if (type.includes('Fire')) return <Flame className="w-4 h-4 text-orange-400" />;
    if (type.includes('Ambulance') || type.includes('Medical')) return <HeartPulse className="w-4 h-4 text-emerald-400" />;
    if (type.includes('Police')) return <ShieldAlert className="w-4 h-4 text-sky-400" />;
    return <Truck className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <div className="bg-[#111622] border border-gray-800 rounded-lg p-4 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-gray-800/80 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-bold font-mono tracking-wider text-gray-200 uppercase">
            Response Units Fleet
          </h2>
        </div>
        <span className="text-[11px] font-mono text-gray-400">
          C++ Fixed Unit Registry ({units.length})
        </span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[260px] flex flex-col gap-2">
        {units.length === 0 ? (
          <div className="py-8 text-center text-gray-500 font-mono text-xs">
            No response units registered
          </div>
        ) : (
          units.map((unit) => {
            const isAvail = unit.available || unit.status === 'AVAILABLE';
            return (
              <div
                key={unit.id}
                className={`p-2.5 rounded border font-mono text-xs flex items-center justify-between transition-colors ${
                  isAvail
                    ? 'bg-gray-900/40 border-gray-800/70 hover:border-gray-700'
                    : 'bg-sky-950/30 border-sky-700/60 shadow-[0_0_8px_rgba(56,189,248,0.1)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-gray-800/80 rounded">
                    {getUnitIcon(unit.type)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-200">
                      {unit.type} #{unit.id}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Position: ({unit.gridX ?? unit.gridPos?.[0] ?? '?'}, {unit.gridY ?? unit.gridPos?.[1] ?? '?'})
                      {!isAvail && unit.assignedEmergency && unit.assignedEmergency !== 'None' && (
                        <span className="text-sky-300 ml-1">
                          · {unit.assignedEmergency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                      isAvail
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                        : 'bg-sky-950 text-sky-300 border border-sky-600/70 animate-pulse'
                    }`}
                  >
                    {isAvail ? 'AVAILABLE' : 'DISPATCHED'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ResponseUnits;
