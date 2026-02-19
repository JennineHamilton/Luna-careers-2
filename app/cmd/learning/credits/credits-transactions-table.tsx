'use client';

import { useState } from 'react';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna';
import { LunaDataTable, type DataTableColumn } from '@/components/luna/data-table';
import { LunaBadge } from '@/components/luna/badge';
import { ArrowUpCircle, ArrowDownCircle, RefreshCw, Settings } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { formatDateTime } from '@/lib/utils/formatters';

type CreditTransaction = Database['public']['Tables']['credit_transactions']['Row'];

const columns: DataTableColumn<CreditTransaction>[] = [
  {
    accessorKey: 'transaction_type',
    header: 'Type',
    sortable: true,
    cell: (row) => {
      const typeConfig = {
        earned: { variant: 'success' as const, icon: ArrowUpCircle, label: 'Earned' },
        spent: { variant: 'error' as const, icon: ArrowDownCircle, label: 'Spent' },
        refunded: { variant: 'warning' as const, icon: RefreshCw, label: 'Refunded' },
        admin_adjustment: { variant: 'default' as const, icon: Settings, label: 'Admin Adjustment' },
      };
      
      const config = typeConfig[row.transaction_type as keyof typeof typeConfig] || typeConfig.earned;
      const Icon = config.icon;
      
      return (
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <LunaBadge variant={config.variant}>
            {config.label}
          </LunaBadge>
        </div>
      );
    },
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    sortable: true,
    cell: (row) => {
      const isPositive = row.amount > 0;
      return (
        <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{row.amount}
        </span>
      );
    },
  },
  {
    accessorKey: 'balance_after',
    header: 'Balance After',
    sortable: true,
    cell: (row) => (
      <span className="text-sm font-medium text-purple-600">
        {row.balance_after}
      </span>
    ),
  },
  {
    accessorKey: 'source_type',
    header: 'Source',
    sortable: true,
    cell: (row) => (
      <span className="text-sm text-luna-gray-600 capitalize">
        {row.source_type.replace(/_/g, ' ')}
      </span>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    sortable: false,
    cell: (row) => (
      <span className="text-sm text-luna-gray-600 line-clamp-1">
        {row.description || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Date',
    sortable: true,
    cell: (row) => (
      <span className="text-luna-gray-900 text-sm">
        {row.created_at ? formatDateTime(row.created_at, false) : '-'}
      </span>
    ),
  },
];

interface CreditsTransactionsTableProps {
  initialTransactions: CreditTransaction[];
}

export function CreditsTransactionsTable({ initialTransactions }: CreditsTransactionsTableProps) {
  const [transactions] = useState<CreditTransaction[]>(initialTransactions);
  const [selectedRows, setSelectedRows] = useState<CreditTransaction[]>([]);

  return (
    <LunaCard>
      <LunaCardHeader>
        <LunaCardTitle>Recent Transactions</LunaCardTitle>
      </LunaCardHeader>
      <LunaCardContent>
        <LunaDataTable
          columns={columns}
          data={transactions}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
        />
      </LunaCardContent>
    </LunaCard>
  );
}

