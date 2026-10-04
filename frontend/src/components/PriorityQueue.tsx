import type { Emergency } from '../api/client';

interface PriorityQueueProps {
  queue?: Emergency[];
  selectedEmergency: Emergency | null;
  onSelectEmergency: (e: Emergency) => void;
  onDispatchNext?: () => void;
  isDispatching?: boolean;
}

export const PriorityQueue: React.FC<PriorityQueueProps> = ({
  queue = [],
  selectedEmergency,
  onSelectEmergency,
  onDispatchNext,
  isDispatching = false,
}) => {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)]">
          Active incidents
        </h2>
        {queue.length > 0 && onDispatchNext && (
          <button
            onClick={onDispatchNext}
            disabled={isDispatching}
            className="text-[12px] font-medium text-[var(--color-red)] hover:text-[#A02A2A] transition-colors cursor-pointer disabled:opacity-40"
          >
            Dispatch next →
          </button>
        )}
      </div>

      {/* List */}
      {queue.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-[14px] text-[var(--color-text-secondary)] mb-1">
            No active incidents
          </p>
          <p className="text-[13px] text-[var(--color-text-tertiary)]">
            All response units are currently available.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {queue.map((item, index) => {
            const isSelected = selectedEmergency?.id === item.id;
            const priority = item.priorityScore || item.priority || 0;
            const isCritical = item.severity >= 8;
            const location = item.locationName || item.location || 'Unknown sector';

            return (
              <button
                key={`${item.id}-${index}`}
                onClick={() => onSelectEmergency(item)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-white border border-[var(--color-border)] shadow-sm'
                    : 'hover:bg-white/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {/* Rank number */}
                    <span className="text-[12px] font-mono text-[var(--color-text-tertiary)] mt-0.5 w-5 flex-shrink-0">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[var(--color-text-primary)]">
                          {item.type}
                        </span>
                        {isCritical && (
                          <span className="text-[11px] font-medium text-[var(--color-red)]">
                            Critical
                          </span>
                        )}
                      </div>
                      <span className="text-[12px] text-[var(--color-text-tertiary)] mt-0.5 block">
                        {location}
                      </span>
                    </div>
                  </div>

                  {/* Priority score */}
                  <span className="text-[13px] font-mono font-medium text-[var(--color-text-secondary)]">
                    {priority.toFixed(0)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PriorityQueue;
