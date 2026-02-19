'use client';

/**
 * Credit History Table Component
 * Displays user's credit transaction history
 */

import { LunaDataTable, LunaBadge } from '@/components/luna';
import type { DataTableColumn } from '@/components/luna/data-table';
import { ArrowUpCircle, ArrowDownCircle, Calendar } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { formatDateTime } from '@/lib/utils/formatters';

type CreditTransaction = Database['public']['Tables']['credit_transactions']['Row'];

export interface CreditHistoryTableProps {
  transactions: CreditTransaction[];
  loading?: boolean;
}

export function CreditHistoryTable({ transactions, loading = false }: CreditHistoryTableProps) {
  const columns: DataTableColumn<CreditTransaction>[] = [
    {
      header: 'Date',
      accessorKey: 'created_at',
      sortable: true,
      cell: (row) => {
        if (!row.created_at) return <span className="text-sm text-gray-400">-</span>;
        return (
          <span className="text-sm text-luna-gray-900">
            {formatDateTime(row.created_at)}
          </span>
        );
      },
    },
    {
      header: 'Type',
      accessorKey: 'transaction_type',
      sortable: true,
      cell: (row) => {
        const isEarned = row.transaction_type === 'earned';
        return (
          <div className="flex items-center gap-2">
            {isEarned ? (
              <ArrowUpCircle className="w-4 h-4 text-green-600" />
            ) : (
              <ArrowDownCircle className="w-4 h-4 text-red-600" />
            )}
            <LunaBadge variant={isEarned ? 'success' : 'error'}>
              {row.transaction_type}
            </LunaBadge>
          </div>
        );
      },
    },
    {
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: (row) => {
        const isEarned = row.transaction_type === 'earned';
        return (
          <span className={`font-semibold ${isEarned ? 'text-green-600' : 'text-red-600'}`}>
            {isEarned ? '+' : '-'}{Math.abs(row.amount)} credits
          </span>
        );
      },
    },
    {
      header: 'Description',
      accessorKey: 'description',
      cell: (row) => (
        <span className="text-sm text-gray-600">
          {row.description || 'No description'}
        </span>
      ),
    },
    {
      header: 'Balance After',
      accessorKey: 'balance_after',
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-gray-900">
          {row.balance_after} credits
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <LunaDataTable
      columns={columns}
      data={transactions}
    />
  );
}

