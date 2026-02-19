import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminKPIGrid } from '@/components/admin/AdminKPIGrid';
import { CreditsRulesTable } from './credits-rules-table';
import { CreditsTransactionsTable } from './credits-transactions-table';
import type { Database } from '@/types/database.types';

type CreditEarningRule = Database['public']['Tables']['credit_earning_rules']['Row'];
type CreditTransaction = Database['public']['Tables']['credit_transactions']['Row'];

export default async function CreditsPage() {
  const supabase = await createClient();

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Verify platform admin
  const accountType = user.user_metadata?.account_type;
  if (accountType !== 'platformAdmin') {
    redirect('/u/dashboard');
  }

  // Fetch credit earning rules
  const { data: rulesData, error: rulesError } = await supabase
    .from('credit_earning_rules')
    .select('*')
    .order('created_at', { ascending: false });

  if (rulesError) {
    console.error('Error fetching credit rules:', rulesError);
  }

  const rules: CreditEarningRule[] = rulesData || [];

  // Fetch recent transactions (last 100)
  const { data: transactionsData, error: transactionsError } = await supabase
    .from('credit_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (transactionsError) {
    console.error('Error fetching transactions:', transactionsError);
  }

  const transactions: CreditTransaction[] = transactionsData || [];

  // Calculate KPI stats
  const { count: totalWallets } = await supabase
    .from('credit_wallets')
    .select('*', { count: 'exact', head: true });

  const { data: walletsData } = await supabase
    .from('credit_wallets')
    .select('balance, lifetime_earned, lifetime_spent');

  const totalBalance = walletsData?.reduce((sum, w) => sum + (w.balance || 0), 0) || 0;
  const totalEarned = walletsData?.reduce((sum, w) => sum + (w.lifetime_earned || 0), 0) || 0;
  const totalSpent = walletsData?.reduce((sum, w) => sum + (w.lifetime_spent || 0), 0) || 0;

  const stats = [
    {
      label: 'Total Wallets',
      value: (totalWallets || 0).toString(),
      icon: 'Wallet' as const,
    },
    {
      label: 'Total Balance',
      value: totalBalance.toLocaleString(),
      icon: 'Coins' as const,
    },
    {
      label: 'Lifetime Earned',
      value: totalEarned.toLocaleString(),
      icon: 'TrendingUp' as const,
    },
    {
      label: 'Lifetime Spent',
      value: totalSpent.toLocaleString(),
      icon: 'TrendingDown' as const,
    },
    {
      label: 'Active Rules',
      value: rules.filter(r => r.is_active).length.toString(),
      icon: 'Settings' as const,
    },
  ];

  return (
    <div className="space-y-6 pb-[100px]">
      <AdminPageHeader
        title="Credits Management"
        description="Manage credit earning rules and view transaction history"
        backLink={{
          href: '/cmd/learning',
          label: 'Learning Dashboard',
        }}
      />

      <AdminKPIGrid kpis={stats} />

      <CreditsRulesTable initialRules={rules} />

      <CreditsTransactionsTable initialTransactions={transactions} />
    </div>
  );
}

