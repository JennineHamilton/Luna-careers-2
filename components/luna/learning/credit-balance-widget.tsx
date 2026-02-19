'use client';

/**
 * Credit Balance Widget Component
 * Displays user's credit balance with quick stats
 */

import { LunaStatsCard } from '@/components/luna';
import { Coins, TrendingUp, TrendingDown } from 'lucide-react';

export interface CreditBalanceWidgetProps {
  balance: number;
  pendingCredits?: number;
  earnedThisMonth?: number;
  spentThisMonth?: number;
  loading?: boolean;
}

export function CreditBalanceWidget({
  balance,
  pendingCredits = 0,
  earnedThisMonth = 0,
  spentThisMonth = 0,
  loading = false,
}: CreditBalanceWidgetProps) {
  const netChange = earnedThisMonth - spentThisMonth;
  const trend = netChange > 0 ? 'up' : netChange < 0 ? 'down' : undefined;
  const trendValue = netChange !== 0 ? `${netChange > 0 ? '+' : ''}${netChange}` : undefined;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Main Balance */}
      <LunaStatsCard
        title="Available Credits"
        value={loading ? '...' : balance}
        description={pendingCredits > 0 ? `${pendingCredits} pending` : 'Ready to use'}
        icon={<Coins className="w-5 h-5" />}
        trend={trend}
        trendValue={trendValue}
      />

      {/* Earned This Month */}
      <LunaStatsCard
        title="Earned This Month"
        value={loading ? '...' : earnedThisMonth}
        description="From completions"
        icon={<TrendingUp className="w-5 h-5" />}
        className="bg-green-50 border-green-200"
      />

      {/* Spent This Month */}
      <LunaStatsCard
        title="Spent This Month"
        value={loading ? '...' : spentThisMonth}
        description="On enrollments"
        icon={<TrendingDown className="w-5 h-5" />}
        className="bg-blue-50 border-blue-200"
      />
    </div>
  );
}

