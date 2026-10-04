import type { DashboardState } from '../api/client';

interface EngineTelemetryProps {
  state: DashboardState | null;
}

export const EngineTelemetry: React.FC<EngineTelemetryProps> = ({ state }) => {
  const dsa = state?.dsa;
  const queueSize = dsa?.triageQueueSize ?? state?.priorityQueue?.length ?? 0;
  const mapSize = dsa?.mapSize ?? state?.emergencies?.length ?? 0;
  const stackSize = dsa?.stackSize ?? state?.actionHistory?.length ?? 0;
  const dequeSize = dsa?.dequeSize ?? state?.recentActions?.length ?? 0;

  return (
    <div className="pt-4 border-t border-[var(--color-border-subtle)]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[13px] font-medium text-[var(--color-text-secondary)]">
          System engine
        </h3>
        <span className="text-[12px] text-[var(--color-text-tertiary)]">
          C++ backend · port 8080
        </span>
      </div>

      <p className="text-[12px] text-[var(--color-text-tertiary)] leading-relaxed">
        Data structures in use:{' '}
        <span className="font-mono">
          priority_queue<span className="text-[var(--color-text-tertiary)]">({queueSize})</span>
          {' · '}map<span className="text-[var(--color-text-tertiary)]">({mapSize})</span>
          {' · '}stack<span className="text-[var(--color-text-tertiary)]">({stackSize})</span>
          {' · '}deque<span className="text-[var(--color-text-tertiary)]">({dequeSize})</span>
          {' · '}set{' · '}2D grid
        </span>
      </p>
    </div>
  );
};

export default EngineTelemetry;
