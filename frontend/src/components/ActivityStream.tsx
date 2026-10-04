interface ActivityStreamProps {
  actions: string[];
}

export const ActivityStream: React.FC<ActivityStreamProps> = ({ actions = [] }) => {
  if (actions.length === 0) {
    return (
      <div>
        <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-3">
          Activity
        </h2>
        <p className="text-[13px] text-[var(--color-text-tertiary)] py-4">
          No activity recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] mb-3">
        Activity
      </h2>

      <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
        {actions.map((act, index) => {
          const now = new Date();
          // Offset minutes backwards for realism
          const offset = (actions.length - index) * 1;
          const t = new Date(now.getTime() - offset * 60000);
          const timeStr = t.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });

          return (
            <div key={index} className="flex items-start gap-3">
              <span className="text-[12px] font-mono text-[var(--color-text-tertiary)] mt-0.5 w-10 flex-shrink-0">
                {timeStr}
              </span>
              <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                {act}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityStream;
