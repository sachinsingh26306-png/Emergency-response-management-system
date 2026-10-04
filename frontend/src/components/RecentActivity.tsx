import React from 'react';
import { History } from 'lucide-react';

interface RecentActivityProps {
  actions: string[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ actions = [] }) => {
  return (
    <div className="bg-[#111622] border border-gray-800 rounded-lg p-4 shadow-sm flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-800/80 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold font-mono tracking-wider text-gray-200 uppercase">
            Recent Activity & Audit Trail
          </h2>
        </div>
        <span className="text-[11px] font-mono text-gray-400">
          C++ Deque Log Buffer ({actions.length})
        </span>
      </div>

      <div className="overflow-y-auto max-h-[180px] font-mono text-xs flex flex-col gap-1.5">
        {actions.length === 0 ? (
          <div className="py-4 text-center text-gray-500 font-mono text-xs">
            No system actions recorded yet
          </div>
        ) : (
          actions.map((act, index) => {
            const isReported = act.includes('REPORTED');
            const isDispatched = act.includes('DISPATCHED');
            const isResolved = act.includes('RESOLVED');
            const isSimulated = act.includes('SIMULATED');

            let textColor = 'text-gray-300';
            let prefixBg = 'bg-gray-800 text-gray-400';
            if (isReported) {
              textColor = 'text-amber-300';
              prefixBg = 'bg-amber-950 text-amber-400 border border-amber-800/50';
            } else if (isDispatched) {
              textColor = 'text-sky-300';
              prefixBg = 'bg-sky-950 text-sky-400 border border-sky-800/50';
            } else if (isResolved) {
              textColor = 'text-emerald-300';
              prefixBg = 'bg-emerald-950 text-emerald-400 border border-emerald-800/50';
            } else if (isSimulated) {
              textColor = 'text-purple-300';
              prefixBg = 'bg-purple-950 text-purple-400 border border-purple-800/50';
            }

            return (
              <div
                key={index}
                className="flex items-start gap-2 py-1 px-2 rounded bg-black/30 border border-gray-900/80 hover:bg-gray-900/50 transition-colors"
              >
                <span className="text-gray-600 select-none text-[10px] mt-0.5 font-bold">
                  {String(index + 1).padStart(2, '0')}.
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${prefixBg}`}>
                  {isReported ? 'REPORT' : isDispatched ? 'DISPATCH' : isResolved ? 'RESOLVE' : isSimulated ? 'SIM' : 'LOG'}
                </span>
                <span className={`flex-1 text-[11px] ${textColor} break-all`}>
                  {act}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
