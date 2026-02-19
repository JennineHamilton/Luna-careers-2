'use client';

import { LunaStatsCard } from '@/components/luna/stats-card';
import { getIcon } from '@/lib/utils/icon-map';

export interface KPIData {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down';
  icon?: string; // Icon name as string
}

interface AdminKPIGridProps {
  kpis: KPIData[];
}

/**
 * AdminKPIGrid - Displays KPI cards in a responsive grid
 * Uses Luna Blue theme for clean, sophisticated look
 */
export function AdminKPIGrid({ kpis }: AdminKPIGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon ? getIcon(kpi.icon) : undefined;

        return (
          <LunaStatsCard
            key={index}
            title={kpi.label}
            value={kpi.value}
            trend={kpi.change !== undefined && kpi.change > 0 ? 'up' : kpi.change !== undefined && kpi.change < 0 ? 'down' : undefined}
            trendValue={kpi.change !== undefined ? `${kpi.change > 0 ? '+' : ''}${kpi.change}%` : undefined}
            icon={Icon ? <Icon className="w-5 h-5" /> : undefined}
          />
        );
      })}
    </div>
  );
}

