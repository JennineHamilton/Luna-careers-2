'use client';

import * as React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LunaCard, LunaCardContent } from './card';

export interface LunaStatsCardProps {
  /** Stat title */
  title: string;
  /** Stat value */
  value: string | number;
  /** Stat description */
  description?: string;
  /** Icon */
  icon?: React.ReactNode;
  /** Trend direction */
  trend?: 'up' | 'down';
  /** Trend value */
  trendValue?: string;
  /** Additional className */
  className?: string;
}

/**
 * LunaStatsCard - Statistics card for dashboard metrics.
 *
 * @example
 * ```tsx
 * <LunaStatsCard
 *   title="Total Applications"
 *   value={1234}
 *   description="This month"
 *   trend="up"
 *   trendValue="+12%"
 *   icon={<Briefcase className="w-5 h-5" />}
 * />
 * ```
 */
export function LunaStatsCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  className,
}: LunaStatsCardProps) {
  return (
    <LunaCard data-slot="luna-stats-card" className={className}>
      <LunaCardContent>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-luna-gray-600">{title}</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-3xl font-bold text-luna-gray-900">{value}</h3>
              {trend && trendValue && (
                <div
                  className={cn(
                    'flex items-center gap-1 text-sm font-medium',
                    trend === 'up' && 'text-green-600',
                    trend === 'down' && 'text-red-600'
                  )}
                >
                  {trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{trendValue}</span>
                </div>
              )}
            </div>
            {description && (
              <p className="text-xs text-luna-gray-450 mt-1">{description}</p>
            )}
          </div>

          {icon && (
            <div className="flex-shrink-0 p-3 bg-luna-gray-50 rounded-lg text-luna-blue">
              {icon}
            </div>
          )}
        </div>
      </LunaCardContent>
    </LunaCard>
  );
}

