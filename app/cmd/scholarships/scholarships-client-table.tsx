'use client';

import { useState } from 'react';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna';
import { LunaDataTable, type DataTableColumn } from '@/components/luna/data-table';
import { LunaBadge } from '@/components/luna/badge';
import { LunaButton } from '@/components/luna/button';
import { LunaDropdownMenu, LunaDropdownMenuTrigger, LunaDropdownMenuContent, LunaDropdownMenuItem } from '@/components/luna/dropdown-menu';
import { Award, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { formatDateTime } from '@/lib/utils/formatters';
import { createClient } from '@/lib/supabase/client';

type Scholarship = Database['public']['Tables']['scholarships']['Row'];

const columns: DataTableColumn<Scholarship>[] = [
  {
    accessorKey: 'name',
    header: 'Scholarship Name',
    sortable: true,
    cell: (row) => (
      <div className="flex flex-col">
        <span className="font-medium text-luna-gray-900">{row.name}</span>
        <span className="text-xs text-luna-gray-500 line-clamp-1">{row.description}</span>
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    sortable: true,
    cell: (row) => (
      <LunaBadge variant={row.type === 'full' ? 'success' : 'warning'}>
        {row.type === 'full' ? 'Full' : 'Partial'} ({row.discount_percentage}%)
      </LunaBadge>
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
    accessorKey: 'total_slots',
    header: 'Total Slots',
    sortable: true,
    cell: (row) => (
      <span className="text-sm text-luna-gray-600">
        {row.total_slots || 'Unlimited'}
      </span>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    sortable: true,
    cell: (row) => <span className="text-luna-gray-900 text-sm">{row.created_at ? formatDateTime(row.created_at, false) : '-'}</span>,
  },
];

interface ScholarshipsClientTableProps {
  initialScholarships: Scholarship[];
}

export function ScholarshipsClientTable({ initialScholarships }: ScholarshipsClientTableProps) {
  const [scholarships, setScholarships] = useState<Scholarship[]>(initialScholarships);
  const [selectedRows, setSelectedRows] = useState<Scholarship[]>([]);

  const handleEdit = (scholarship: Scholarship) => {
    alert('Edit functionality coming soon');
  };

  const handleDelete = async (scholarship: Scholarship) => {
    if (!confirm(`Are you sure you want to delete "${scholarship.name}"?`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('You must be logged in to delete scholarships');
        return;
      }

      const response = await fetch(`/api/learning/scholarships/${scholarship.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete scholarship');
      }

      // Remove from local state
      setScholarships(scholarships.filter(s => s.id !== scholarship.id));
    } catch (error) {
      console.error('Error deleting scholarship:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete scholarship');
    }
  };

  const handleCreate = () => {
    alert('Create functionality coming soon');
  };

  const handleViewApplications = () => {
    alert('Applications view coming soon');
  };

  return (
    <div className="space-y-6">
      <LunaCard>
        <LunaCardHeader>
          <div className="flex items-center justify-between">
            <LunaCardTitle>All Scholarships</LunaCardTitle>
            <div className="flex gap-2">
              <LunaButton variant="outline" onClick={handleViewApplications}>
                <Eye className="w-4 h-4" />
                View Applications
              </LunaButton>
              <LunaButton onClick={handleCreate}>
                <Award className="w-4 h-4" />
                Create Scholarship
              </LunaButton>
            </div>
          </div>
        </LunaCardHeader>
        <LunaCardContent>
          <LunaDataTable
            columns={columns}
            data={scholarships}
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
                    Edit Scholarship
                  </LunaDropdownMenuItem>
                  <LunaDropdownMenuItem
                    onClick={() => handleDelete(row)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Scholarship
                  </LunaDropdownMenuItem>
                </LunaDropdownMenuContent>
              </LunaDropdownMenu>
            )}
          />
        </LunaCardContent>
      </LunaCard>
    </div>
  );
}

