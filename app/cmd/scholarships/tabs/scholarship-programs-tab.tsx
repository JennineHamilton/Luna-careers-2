'use client';

import { useState } from 'react';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna';
import { LunaDataTable, type DataTableColumn } from '@/components/luna/data-table';
import { LunaDataTableToolbar } from '@/components/luna/data-table-toolbar';
import { LunaBadge } from '@/components/luna/badge';
import { LunaButton } from '@/components/luna/button';
import { LunaDropdownMenu, LunaDropdownMenuTrigger, LunaDropdownMenuContent, LunaDropdownMenuItem } from '@/components/luna/dropdown-menu';
import { Award, MoreVertical, Edit, Trash2, Plus } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { formatDateTime } from '@/lib/utils/formatters';
import { createClient } from '@/lib/supabase/client';
import { ScholarshipFormModal } from '../modals/scholarship-form-modal';

type Scholarship = Database['public']['Tables']['scholarships']['Row'];

interface ScholarshipProgramsTabProps {
  initialScholarships: Scholarship[];
}

export function ScholarshipProgramsTab({ initialScholarships }: ScholarshipProgramsTabProps) {
  const [scholarships, setScholarships] = useState<Scholarship[]>(initialScholarships);
  const [selectedRows, setSelectedRows] = useState<Scholarship[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null);

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
      header: 'Slots',
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-luna-gray-600">
          {row.total_slots ? `${row.slots_remaining || 0} / ${row.total_slots}` : 'Unlimited'}
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

  const handleCreate = () => {
    setEditingScholarship(null);
    setFormModalOpen(true);
  };

  const handleEdit = (scholarship: Scholarship) => {
    setEditingScholarship(scholarship);
    setFormModalOpen(true);
  };

  const handleDelete = async (scholarship: Scholarship) => {
    if (!confirm(`Are you sure you want to delete "${scholarship.name}"? This will also delete all associated applications.`)) {
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

      setScholarships(scholarships.filter(s => s.id !== scholarship.id));
    } catch (error) {
      console.error('Error deleting scholarship:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete scholarship');
    }
  };

  const handleFormSuccess = (scholarship: Scholarship) => {
    if (editingScholarship) {
      // Update existing
      setScholarships(scholarships.map(s => s.id === scholarship.id ? scholarship : s));
    } else {
      // Add new
      setScholarships([scholarship, ...scholarships]);
    }
    setFormModalOpen(false);
    setEditingScholarship(null);
  };

  // Filter scholarships
  const filteredScholarships = scholarships.filter(scholarship => {
    const matchesSearch = searchQuery === '' ||
      scholarship.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scholarship.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter.length === 0 ||
      (statusFilter.includes('active') && scholarship.is_active) ||
      (statusFilter.includes('inactive') && !scholarship.is_active);

    const matchesType = typeFilter.length === 0 ||
      typeFilter.includes(scholarship.type);

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <>
      <LunaCard>
        <LunaCardHeader>
          <LunaCardTitle>Scholarship Programs</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent>
          <LunaDataTableToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search scholarships..."
            onCreateClick={handleCreate}
            createLabel="Create Scholarship"
            createIcon={<Award className="w-4 h-4" />}
            filters={[
              {
                column: 'status',
                label: 'Status',
                options: [
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                ],
              },
              {
                column: 'type',
                label: 'Type',
                options: [
                  { label: 'Full Scholarship', value: 'full' },
                  { label: 'Partial Scholarship', value: 'partial' },
                ],
              },
            ]}
            activeFilters={{ status: statusFilter, type: typeFilter }}
            onFilterChange={(column, values) => {
              if (column === 'status') {
                setStatusFilter(values);
              } else if (column === 'type') {
                setTypeFilter(values);
              }
            }}
          />
          <LunaDataTable
            columns={columns}
            data={filteredScholarships}
            selectable
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            striped
            hoverable
            actionsColumn={(row: any) => (
              <LunaDropdownMenu>
                <LunaDropdownMenuTrigger asChild>
                  <LunaButton variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </LunaButton>
                </LunaDropdownMenuTrigger>
                <LunaDropdownMenuContent align="end">
                  <LunaDropdownMenuItem onClick={() => handleEdit(row)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Scholarship
                  </LunaDropdownMenuItem>
                  <LunaDropdownMenuItem
                    onClick={() => handleDelete(row)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Scholarship
                  </LunaDropdownMenuItem>
                </LunaDropdownMenuContent>
              </LunaDropdownMenu>
            )}
          />
        </LunaCardContent>
      </LunaCard>

      <ScholarshipFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        scholarship={editingScholarship}
        onSuccess={handleFormSuccess}
      />
    </>
  );
}

