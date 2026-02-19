'use client';

import { useState } from 'react';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna';
import { LunaDataTable, type DataTableColumn } from '@/components/luna/data-table';
import { LunaBadge } from '@/components/luna/badge';
import { LunaButton } from '@/components/luna/button';
import { LunaDropdownMenu, LunaDropdownMenuTrigger, LunaDropdownMenuContent, LunaDropdownMenuItem } from '@/components/luna/dropdown-menu';
import { Settings, MoreVertical, Edit, Trash2, Plus } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { formatDateTime } from '@/lib/utils/formatters';
import { createClient } from '@/lib/supabase/client';

type CreditEarningRule = Database['public']['Tables']['credit_earning_rules']['Row'];

const columns: DataTableColumn<CreditEarningRule>[] = [
  {
    accessorKey: 'content_type',
    header: 'Content Type',
    sortable: true,
    cell: (row) => (
      <LunaBadge variant="default" className="capitalize">
        {row.content_type}
      </LunaBadge>
    ),
  },
  {
    accessorKey: 'content_id',
    header: 'Scope',
    sortable: false,
    cell: (row) => (
      <span className="text-sm text-luna-gray-600">
        {row.content_id ? 'Specific Content' : 'All Content'}
      </span>
    ),
  },
  {
    accessorKey: 'credits_awarded',
    header: 'Credits Awarded',
    sortable: true,
    cell: (row) => (
      <span className="text-sm font-medium text-purple-600">
        {row.credits_awarded} credits
      </span>
    ),
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    sortable: true,
    cell: (row) => (
      <LunaBadge variant={row.is_active ? 'success' : 'default'}>
        {row.is_active ? 'Active' : 'Inactive'}
      </LunaBadge>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    sortable: true,
    cell: (row) => <span className="text-luna-gray-900 text-sm">{row.created_at ? formatDateTime(row.created_at, false) : '-'}</span>,
  },
];

interface CreditsRulesTableProps {
  initialRules: CreditEarningRule[];
}

export function CreditsRulesTable({ initialRules }: CreditsRulesTableProps) {
  const [rules, setRules] = useState<CreditEarningRule[]>(initialRules);
  const [selectedRows, setSelectedRows] = useState<CreditEarningRule[]>([]);

  const handleEdit = (rule: CreditEarningRule) => {
    alert('Edit functionality coming soon');
  };

  const handleDelete = async (rule: CreditEarningRule) => {
    if (!confirm('Are you sure you want to delete this credit earning rule?')) {
      return;
    }

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('You must be logged in to delete rules');
        return;
      }

      const response = await fetch(`/api/learning/credits/rules/${rule.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete rule');
      }

      // Remove from local state
      setRules(rules.filter(r => r.id !== rule.id));
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete rule');
    }
  };

  const handleCreate = () => {
    alert('Create functionality coming soon');
  };

  return (
    <LunaCard>
      <LunaCardHeader>
        <div className="flex items-center justify-between">
          <LunaCardTitle>Credit Earning Rules</LunaCardTitle>
          <LunaButton onClick={handleCreate}>
            <Plus className="w-4 h-4" />
            Create Rule
          </LunaButton>
        </div>
      </LunaCardHeader>
      <LunaCardContent>
        <LunaDataTable
          columns={columns}
          data={rules}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          actionsColumn={(row: any) => (
            <LunaDropdownMenu>
              <LunaDropdownMenuTrigger asChild>
                <LunaButton variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </LunaButton>
              </LunaDropdownMenuTrigger>
              <LunaDropdownMenuContent align="end">
                <LunaDropdownMenuItem onClick={() => handleEdit(row)}>
                  <Edit className="w-4 h-4" />
                  Edit Rule
                </LunaDropdownMenuItem>
                <LunaDropdownMenuItem
                  onClick={() => handleDelete(row)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Rule
                </LunaDropdownMenuItem>
              </LunaDropdownMenuContent>
            </LunaDropdownMenu>
          )}
        />
      </LunaCardContent>
    </LunaCard>
  );
}

