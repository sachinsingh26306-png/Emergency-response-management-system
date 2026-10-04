import type { DashboardState } from '../api/client';

interface TopTelemetryRibbonProps {
  state: DashboardState | null;
}

export const TopTelemetryRibbon: React.FC<TopTelemetryRibbonProps> = ({ state }) => {
  const emergencies = state?.emergencies || [];
  const units = state?.units || [];
  const stats = state?.summaryStatistics;

  const active = stats?.activeEmergencies ?? emergencies.filter(e => e.status !== 'Resolved').length;
  const critical = emergencies.filter(e => e.severity >= 8 && e.status !== 'Resolved').length;
  const deployed = stats?.busyUnits ?? units.filter(u => !u.available || u.status === 'BUSY' || u.status === 'DISPATCHED').length;
  const available = stats?.availableUnits ?? units.filter(u => u.available || u.status === 'AVAILABLE').length;

  const items = [
    { label: 'Active incidents', value: active, highlight: active > 0 },
    { label: 'Critical', value: critical, highlight: critical > 0 },
    { label: 'Units deployed', value: deployed, highlight: false },
    { label: 'Available', value: available, highlight: false },
  ];

  return (
    <div className="grid grid-cols-4 gap-6 px-6 py-5">
      {items.map((item) => (
        <div key={item.label}>
          <div
            className={`text-3xl font-semibold font-mono tracking-tight ${
              item.highlight ? 'text-[var(--color-red)]' : 'text-[var(--color-text-primary)]'
            }`}
          >
            {item.value}
          </div>
          <div className="text-[13px] text-[var(--color-text-tertiary)] mt-0.5">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopTelemetryRibbon;
