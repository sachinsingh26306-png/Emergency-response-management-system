import React from 'react';
import { AlertOctagon, Activity, Flame, Truck, CheckCircle2 } from 'lucide-react';
import type { DashboardState } from '../api/client';

interface KpiCardsProps {
  state: DashboardState | null;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ state }) => {
  const emergencies = state?.emergencies || [];
  const units = state?.units || [];
  const stats = state?.summaryStatistics;

  const totalEmergencies = stats?.totalEmergencies ?? emergencies.length;
  
  const activeEmergencies = stats?.activeEmergencies ?? emergencies.filter(
    (e) => e.status === 'Reported' || e.status === 'Dispatched' || e.status === 'Waiting'
  ).length;

  const criticalEmergencies = emergencies.filter(
    (e) => e.severity >= 8 && e.status !== 'Resolved'
  ).length;

  const availableUnits = stats?.availableUnits ?? units.filter(
    (u) => u.available || u.status === 'AVAILABLE'
  ).length;

  const dispatchedUnits = stats?.busyUnits ?? units.filter(
    (u) => !u.available || u.status === 'DISPATCHED' || u.status === 'BUSY'
  ).length;

  const cards = [
    {
      title: 'Total Emergencies',
      value: totalEmergencies,
      icon: AlertOctagon,
      textColor: 'text-gray-100',
      borderColor: 'border-gray-800',
      badgeBg: 'bg-gray-800/60 text-gray-300',
      sub: `${stats?.resolved ?? emergencies.filter(e => e.status === 'Resolved').length} resolved`
    },
    {
      title: 'Active Emergencies',
      value: activeEmergencies,
      icon: Activity,
      textColor: 'text-amber-400',
      borderColor: 'border-amber-900/40',
      badgeBg: 'bg-amber-950/60 text-amber-300',
      sub: 'In triage / dispatched'
    },
    {
      title: 'Critical Emergencies',
      value: criticalEmergencies,
      icon: Flame,
      textColor: 'text-rose-400',
      borderColor: 'border-rose-900/50',
      badgeBg: 'bg-rose-950/60 text-rose-300',
      sub: 'Severity ≥ 8'
    },
    {
      title: 'Available Units',
      value: availableUnits,
      icon: CheckCircle2,
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-900/40',
      badgeBg: 'bg-emerald-950/60 text-emerald-300',
      sub: `Of ${units.length} total units`
    },
    {
      title: 'Dispatched Units',
      value: dispatchedUnits,
      icon: Truck,
      textColor: 'text-sky-400',
      borderColor: 'border-sky-900/40',
      badgeBg: 'bg-sky-950/60 text-sky-300',
      sub: 'En route / on scene'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`bg-[#111622] border ${card.borderColor} rounded-lg p-3.5 flex flex-col justify-between shadow-sm relative overflow-hidden`}
          >
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono mb-2">
              <span className="truncate uppercase font-medium">{card.title}</span>
              <span className={`p-1.5 rounded-md ${card.badgeBg}`}>
                <Icon className="w-3.5 h-3.5" />
              </span>
            </div>
            <div>
              <div className={`text-2xl font-bold font-mono ${card.textColor}`}>
                {state ? card.value : '--'}
              </div>
              <p className="text-[11px] text-gray-400 font-mono mt-1 truncate">
                {card.sub}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KpiCards;
