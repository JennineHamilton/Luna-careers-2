'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna';
import { LunaDataTable, type DataTableColumn } from '@/components/luna/data-table';
import { LunaDataTableToolbar } from '@/components/luna/data-table-toolbar';
import { LunaBadge } from '@/components/luna/badge';
import { LunaButton } from '@/components/luna/button';
import { LunaDropdownMenu, LunaDropdownMenuTrigger, LunaDropdownMenuContent, LunaDropdownMenuItem } from '@/components/luna/dropdown-menu';
import { CreateProgramModal, EditProgramModal } from '@/components/luna/learning';
import { Briefcase, Edit, Trash2, MoreVertical } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { formatDateTime } from '@/lib/utils/formatters';
import { createClient } from '@/lib/supabase/client';

type Program = Database['public']['Tables']['programs']['Row'] & {
  creators?: { id: string; name: string; logo_url: string | null } | null;
};

interface ProgramsClientTableProps {
  initialPrograms: Program[];
}

export function ProgramsClientTable({ initialPrograms }: ProgramsClientTableProps) {
  const router = useRouter();
  const [programs, setPrograms] = useState<Program[]>(initialPrograms);
  const [selectedRows, setSelectedRows] = useState<Program[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);

  const refetchPrograms = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('programs')
        .select('*, creators(id, name, logo_url)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error refetching programs:', error);
    }
  };

  const handleCreateSuccess = () => {
    refetchPrograms();
  };

  const handleEdit = (programId: string) => {
    setEditingProgramId(programId);
    setEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    refetchPrograms();
  };

  const handleDelete = async (programId: string) => {
    const program = programs.find(p => p.id === programId);
    if (!program) return;

    if (!confirm(`Are you sure you want to delete "${program.title}"?`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('You must be logged in');
        return;
      }

      const response = await fetch(`/api/learning/programs/${programId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete program');
      }

      refetchPrograms();
    } catch (error) {
      console.error('Error deleting program:', error);
      alert('Failed to delete program');
    }
  };

  const columns: DataTableColumn<Program>[] = [
    {
      accessorKey: 'title',
      header: 'Program Title',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-luna-gray-400 shrink-0" />
          <div className="flex flex-col">
            <span className="font-medium text-luna-gray-900">{row.title}</span>
            {row.level && (
              <span className="text-xs text-luna-gray-500 capitalize">{row.level}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'creator_id',
      header: 'Creator',
      sortable: false,
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          {row.creators?.logo_url ? (
            <img
              src={row.creators.logo_url}
              alt={row.creators.name}
              className="w-6 h-6 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-luna-gray-200 flex items-center justify-center shrink-0">
              <span className="text-xs text-luna-gray-600 font-medium">
                {row.creators?.name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          )}
          <span className="text-luna-gray-900 text-sm">
            {row.creators?.name || 'No creator'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'is_published',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <LunaBadge variant={row.is_published ? 'success' : 'default'}>
          {row.is_published ? 'Published' : 'Draft'}
        </LunaBadge>
      ),
    },
    {
      accessorKey: 'is_free',
      header: 'Pricing',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.is_free ? (
            <LunaBadge variant="success">Free</LunaBadge>
          ) : (
            <span className="text-sm font-medium text-purple-600">
              ${row.price?.toFixed(2) || '0.00'}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'duration_minutes',
      header: 'Duration',
      sortable: true,
      cell: (row) => {
        if (!row.duration_minutes) return <span className="text-luna-gray-400">-</span>;
        const hours = Math.floor(row.duration_minutes / 60);
        const mins = row.duration_minutes % 60;
        return (
          <span className="text-sm text-luna-gray-600">
            {hours > 0 && `${hours}h `}{mins > 0 && `${mins}m`}
          </span>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      sortable: true,
      cell: (row) => <span className="text-luna-gray-900 text-sm">{row.created_at ? formatDateTime(row.created_at) : '-'}</span>,
    },
  ];

  const filteredPrograms = programs.filter((program) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      program.title?.toLowerCase().includes(query) ||
      program.description?.toLowerCase().includes(query) ||
      program.level?.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <LunaCard>
        <LunaCardHeader>
          <LunaCardTitle>All Programs</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent>
          <LunaDataTableToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search programs..."
            onCreateClick={() => setCreateModalOpen(true)}
            createLabel="Create Program"
            createIcon={<Briefcase className="w-4 h-4" />}
          />
          <LunaDataTable
            columns={columns}
            data={filteredPrograms}
            selectable
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            striped
            hoverable
            actionsColumn={(row) => (
              <LunaDropdownMenu>
                <LunaDropdownMenuTrigger asChild>
                  <LunaButton variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </LunaButton>
                </LunaDropdownMenuTrigger>
                <LunaDropdownMenuContent align="end">
                  <LunaDropdownMenuItem onClick={() => handleEdit(row.id)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </LunaDropdownMenuItem>
                  <LunaDropdownMenuItem
                    onClick={() => handleDelete(row.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </LunaDropdownMenuItem>
                </LunaDropdownMenuContent>
              </LunaDropdownMenu>
            )}
          />
        </LunaCardContent>
      </LunaCard>

      <CreateProgramModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      {editingProgramId && (
        <EditProgramModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          programId={editingProgramId}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}

