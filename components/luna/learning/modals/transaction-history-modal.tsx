'use client';

/**
 * Transaction History Modal
 * Banking-style modal showing credit transaction history
 */

import { useState, useEffect } from 'react';
import {
  LunaDialog,
  LunaDialogContent,
  LunaDialogHeader,
  LunaDialogTitle,
  LunaDialogDescription,
  LunaDialogBody,
  LunaDataTable,
  LunaButton,
  LunaSkeletonTable,
} from '@/components/luna';
import { LunaDataTableToolbar } from '@/components/luna/data-table-toolbar';
import type { DataTableColumn } from '@/components/luna/data-table';
import { Receipt, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/formatters';

interface CreditTransaction {
  id: string;
  transaction_type: 'earned' | 'spent' | 'refunded' | 'admin_adjustment';
  amount: number; // Positive for earned, negative for spent
  balance_after: number;
  source_type: string;
  source_id: string | null;
  description: string | null;
  created_at: string;
}

interface TransactionHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionHistoryModal({
  open,
  onOpenChange,
}: TransactionHistoryModalProps) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  // Fetch transaction history
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!open) return;

      setLoading(true);
      try {
        // Fetch all transactions - filtering will be done client-side
        const url = '/api/learning/credits/history?limit=100';

        console.log('TransactionHistory: Fetching from:', url);
        const response = await fetch(url);
        console.log('TransactionHistory: Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('TransactionHistory: Full response:', data);
          console.log('TransactionHistory: Transactions array:', data.transactions);
          console.log('TransactionHistory: First transaction:', data.transactions?.[0]);
          setTransactions(data.transactions || []);
        } else {
          const errorData = await response.json();
          console.error('TransactionHistory: Error response:', errorData);
        }
      } catch (error) {
        console.error('TransactionHistory: Exception:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [open]);

  // Filter transactions based on search and type filter
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = !searchValue ||
      transaction.description?.toLowerCase().includes(searchValue.toLowerCase()) ||
      transaction.source_type?.toLowerCase().includes(searchValue.toLowerCase());

    const matchesType = typeFilter.length === 0 || typeFilter.includes(transaction.transaction_type);

    return matchesSearch && matchesType;
  });

  // Calculate totals from filtered transactions
  const totalEarned = filteredTransactions
    .filter(t => t.transaction_type === 'earned')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = filteredTransactions
    .filter(t => t.transaction_type === 'spent')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0); // amount is negative for spent

  const columns: DataTableColumn<CreditTransaction>[] = [
    {
      accessorKey: 'created_at' as keyof CreditTransaction,
      header: 'Date',
      cell: (transaction: CreditTransaction) => (
        <span className="text-sm text-luna-gray-900">
          {formatDateTime(transaction.created_at)}
        </span>
      ),
    },
    {
      accessorKey: 'description' as keyof CreditTransaction,
      header: 'Description',
      cell: (transaction: CreditTransaction) => (
        <div className="text-sm">
          <div className="font-medium text-luna-gray-900">
            {transaction.description || 'No description'}
          </div>
          <div className="text-xs text-luna-gray-500 capitalize">
            {transaction.source_type.replace('_', ' ')}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'amount' as keyof CreditTransaction,
      header: 'Credits In',
      cell: (transaction: CreditTransaction) => (
        transaction.transaction_type === 'earned' ? (
          <div className="flex items-center gap-1.5 text-green-600 font-semibold">
            <TrendingUp className="w-4 h-4" />
            <span>+{transaction.amount.toLocaleString()}</span>
          </div>
        ) : (
          <span className="text-luna-gray-400">—</span>
        )
      ),
    },
    {
      accessorKey: 'transaction_type' as keyof CreditTransaction,
      header: 'Credits Out',
      cell: (transaction: CreditTransaction) => (
        transaction.transaction_type === 'spent' ? (
          <div className="flex items-center gap-1.5 text-red-600 font-semibold">
            <TrendingDown className="w-4 h-4" />
            <span>{transaction.amount.toLocaleString()}</span>
          </div>
        ) : (
          <span className="text-luna-gray-400">—</span>
        )
      ),
    },
    {
      accessorKey: 'balance_after' as keyof CreditTransaction,
      header: 'Balance',
      cell: (transaction: CreditTransaction) => (
        <span className="font-medium text-luna-gray-900">
          {transaction.balance_after.toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <LunaDialog open={open} onOpenChange={onOpenChange}>
      <LunaDialogContent className="max-w-4xl">
        <LunaDialogHeader>
          <LunaDialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Transaction History
          </LunaDialogTitle>
          <LunaDialogDescription>
            View your complete credit transaction history
          </LunaDialogDescription>
        </LunaDialogHeader>

        <LunaDialogBody>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <p className="text-xs font-medium text-green-900">Total Earned</p>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {totalEarned.toLocaleString()}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <p className="text-xs font-medium text-red-900">Total Spent</p>
              </div>
              <p className="text-2xl font-bold text-red-900">
                {totalSpent.toLocaleString()}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-medium text-blue-900">Transactions</p>
              </div>
              <p className="text-2xl font-bold text-blue-900">
                {filteredTransactions.length}
              </p>
            </div>
          </div>

          {/* Data Table */}
          {loading ? (
            <div className="px-6 py-6">
              <LunaSkeletonTable rows={8} />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-luna-gray-300 mx-auto mb-3" />
              <p className="text-luna-gray-600">No transactions found</p>
            </div>
          ) : (
            <>
              <LunaDataTableToolbar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                searchPlaceholder="Search by description or source..."
                filters={[
                  {
                    column: 'transaction_type',
                    label: 'Type',
                    options: [
                      { value: 'earned', label: 'Credits In' },
                      { value: 'spent', label: 'Credits Out' },
                      { value: 'refunded', label: 'Refunded' },
                      { value: 'admin_adjustment', label: 'Admin Adjustment' },
                    ],
                  },
                ]}
                activeFilters={{ transaction_type: typeFilter }}
                onFilterChange={(column, values) => {
                  if (column === 'transaction_type') {
                    setTypeFilter(values);
                  }
                }}
              />

              <LunaDataTable
                data={filteredTransactions}
                columns={columns}
                striped
                hoverable
                emptyMessage="No transactions found"
              />
            </>
          )}
        </LunaDialogBody>
      </LunaDialogContent>
    </LunaDialog>
  );
}

