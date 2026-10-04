import React from 'react';
import { AlertCircle, Info } from 'lucide-react';
import type { Emergency } from '../api/client';

interface ActiveEmergenciesProps {
  emergencies: Emergency[];
}

export const ActiveEmergencies: React.FC<ActiveEmergenciesProps> = ({ emergencies }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Reported':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 border border-amber-600/70 text-amber-400">
            REPORTED
          </span>
        );
      case 'Dispatched':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-950/80 border border-sky-500/70 text-sky-300 animate-pulse">
            DISPATCHED
          </span>
        );
      case 'Waiting':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-950/80 border border-orange-600/70 text-orange-400">
            WAITING
          </span>
        );
      case 'Resolved':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 border border-emerald-600/70 text-emerald-400">
            RESOLVED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-800 text-gray-400">
            {status.toUpperCase()}
          </span>
        );
    }
  };

  const getSeverityBadge = (severity: number) => {
    if (severity >= 8) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800/80">
          {severity}/10
        </span>
      );
    }
    if (severity >= 5) {
      return (
        <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800/80">
          {severity}/10
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-gray-800 text-gray-300 border border-gray-700">
        {severity}/10
      </span>
    );
  };

  return (
    <div className="bg-[#111622] border border-gray-800 rounded-lg p-4 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-gray-800/80 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold font-mono tracking-wider text-gray-200 uppercase">
            Active Emergencies
          </h2>
        </div>
        <span className="text-[11px] font-mono bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
          {emergencies.length} Total
        </span>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[360px]">
        {emergencies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 font-mono text-xs">
            <Info className="w-6 h-6 mb-2 text-gray-600" />
            <span>No emergencies currently registered</span>
            <span className="text-[11px] text-gray-600 mt-0.5">
              Backend telemetry standby
            </span>
          </div>
        ) : (
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-[11px] uppercase">
                <th className="pb-2 font-semibold">ID</th>
                <th className="pb-2 font-semibold">Type</th>
                <th className="pb-2 font-semibold">Severity</th>
                <th className="pb-2 font-semibold">Priority</th>
                <th className="pb-2 font-semibold">Location</th>
                <th className="pb-2 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {emergencies.map((em) => (
                <tr key={em.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="py-2.5 font-bold text-gray-300">#{em.id}</td>
                  <td className="py-2.5 font-semibold text-gray-200">{em.type}</td>
                  <td className="py-2.5">{getSeverityBadge(em.severity)}</td>
                  <td className="py-2.5 font-bold text-sky-400">
                    {em.priorityScore ? em.priorityScore.toFixed(1) : (em.priority ? em.priority.toFixed(1) : '--')}
                  </td>
                  <td className="py-2.5 text-gray-300">
                    <div>{em.locationName || em.location}</div>
                    <div className="text-[10px] text-gray-500">
                      Grid ({em.gridX ?? em.gridPos?.[0] ?? '?'},{em.gridY ?? em.gridPos?.[1] ?? '?'})
                    </div>
                  </td>
                  <td className="py-2.5 text-right">{getStatusBadge(em.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ActiveEmergencies;
