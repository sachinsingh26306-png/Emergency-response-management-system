import { useState, useEffect } from 'react';

interface HeaderProps {
  connected: boolean;
  onOpenReportModal: () => void;
  onDispatchNext: () => void;
  onSimulateStep: () => void;
  autoSimulate: boolean;
  onToggleAutoSimulate: () => void;
  isDispatching?: boolean;
  isSimulating?: boolean;
  pendingQueueCount?: number;
  activeDispatchesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  connected,
  onOpenReportModal,
  onDispatchNext,
  onSimulateStep,
  autoSimulate,
  onToggleAutoSimulate,
  isDispatching = false,
  isSimulating = false,
  pendingQueueCount = 0,
  activeDispatchesCount = 0,
}) => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const update = () => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-[var(--color-border)]">
      {/* Left — Identity */}
      <div>
        <h1 className="text-lg font-semibold text-[var(--color-text-primary)] tracking-tight leading-tight">
          Emergency Response
        </h1>
        <p className="text-[13px] text-[var(--color-text-tertiary)] leading-tight">
          Emergency coordination
        </p>
      </div>

      {/* Center — Actions */}
      <div className="flex items-center gap-2">
        {pendingQueueCount > 0 && (
          <button
            onClick={onDispatchNext}
            disabled={isDispatching}
            className="px-3 py-1.5 text-[13px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg)] hover:bg-[#EFECE7] border border-[var(--color-border)] rounded-md transition-colors cursor-pointer disabled:opacity-40"
          >
            Dispatch next{' '}
            <span className="ml-1 text-[12px] font-mono text-[var(--color-text-tertiary)]">
              {pendingQueueCount}
            </span>
          </button>
        )}

        {activeDispatchesCount > 0 && (
          <>
            <button
              onClick={onSimulateStep}
              disabled={isSimulating}
              className="px-3 py-1.5 text-[13px] font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg)] hover:bg-[#EFECE7] border border-[var(--color-border)] rounded-md transition-colors cursor-pointer disabled:opacity-40"
            >
              Step simulation
            </button>
            <button
              onClick={onToggleAutoSimulate}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-md border transition-colors cursor-pointer ${
                autoSimulate
                  ? 'bg-[var(--color-text-primary)] text-white border-[var(--color-text-primary)]'
                  : 'text-[var(--color-text-tertiary)] bg-[var(--color-bg)] border-[var(--color-border)] hover:bg-[#EFECE7]'
              }`}
            >
              Auto {autoSimulate ? 'on' : 'off'}
            </button>
          </>
        )}
      </div>

      {/* Right — Status + Primary action */}
      <div className="flex items-center gap-4">
        <span className="text-[13px] font-mono text-[var(--color-text-tertiary)]">
          {currentTime}
        </span>

        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-[var(--color-green)]' : 'bg-[var(--color-red)]'
            }`}
          />
          <span className="text-[13px] text-[var(--color-text-secondary)]">
            {connected ? 'Operational' : 'Offline'}
          </span>
        </div>

        <button
          onClick={onOpenReportModal}
          className="px-4 py-2 text-[13px] font-semibold text-white bg-[var(--color-red)] hover:bg-[#B02D2D] rounded-lg transition-colors cursor-pointer"
        >
          Report emergency
        </button>
      </div>
    </header>
  );
};

export default Header;
