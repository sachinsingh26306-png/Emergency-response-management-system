import type { Emergency } from '../api/client';

interface TriagePipelineProps {
  emergency: Emergency | null;
}

const stages = ['Reported', 'Analyzed', 'Prioritized', 'Dispatched', 'Resolved'];

function getStageIndex(emergency: Emergency | null): number {
  if (!emergency) return -1;
  switch (emergency.status) {
    case 'Resolved': return 4;
    case 'Dispatched': return 3;
    case 'Waiting': return 2;
    case 'Reported': return 2;
    default: return 1;
  }
}

export const TriagePipeline: React.FC<TriagePipelineProps> = ({ emergency }) => {
  const current = getStageIndex(emergency);

  if (!emergency) return null;

  return (
    <div className="flex items-center gap-1 py-3">
      {stages.map((stage, i) => {
        const isPassed = i < current;
        const isCurrent = i === current;

        return (
          <div key={stage} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className={`w-6 h-px ${
                  isPassed ? 'bg-[var(--color-text-primary)]' : 'bg-[var(--color-border)]'
                }`}
              />
            )}
            <span
              className={`text-[12px] whitespace-nowrap ${
                isCurrent
                  ? 'text-[var(--color-red)] font-semibold'
                  : isPassed
                  ? 'text-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-tertiary)]'
              }`}
            >
              {stage}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default TriagePipeline;
