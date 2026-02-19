'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna';
import { LunaDataTable, type DataTableColumn } from '@/components/luna/data-table';
import { LunaDataTableToolbar } from '@/components/luna/data-table-toolbar';
import { LunaBadge } from '@/components/luna/badge';
import { LunaButton } from '@/components/luna/button';
import { LunaDropdownMenu, LunaDropdownMenuTrigger, LunaDropdownMenuContent, LunaDropdownMenuItem } from '@/components/luna/dropdown-menu';
import { Users, MoreVertical, Edit, Trash2, BadgeCheck, Building2, User, Briefcase, Handshake } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { formatDateTime } from '@/lib/utils/formatters';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { CreateCreatorModal } from '@/components/luna/learning/modals/create-creator-modal';
import { EditCreatorModal } from '@/components/luna/learning/modals/edit-creator-modal';

type Creator = Database['public']['Tables']['creators']['Row'];

// Helper function to format creator type for display
function formatCreatorType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper function to get badge variant based on type
function getTypeVariant(type: string): 'default' | 'primary' | 'success' | 'warning' | 'error' {
  const typeMap: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
    'individual': 'default',
    'institution': 'success',
    'organization': 'warning',
    'partner': 'primary',
  };
  return typeMap[type] || 'default';
}

// Helper function to get icon based on type
function getTypeIcon(type: string) {
  const iconMap: Record<string, any> = {
    'individual': User,
    'institution': Building2,
    'organization': Briefcase,
    'partner': Handshake,
  };
  const Icon = iconMap[type] || Users;
  return <Icon className="w-4 h-4" />;
}

const columns: DataTableColumn<Creator>[] = [
  {
    accessorKey: 'name',
    header: 'Creator Name',
    sortable: true,
    cell: (row) => (
      <div className="flex items-center gap-3">
        {row.logo_url ? (
          <Image
            src={row.logo_url}
            alt={row.name}
            width={32}
            height={32}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-luna-primary-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-luna-primary-600" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="font-medium text-luna-gray-900">{row.name}</span>
          {row.verified && (
            <BadgeCheck className="w-4 h-4 text-blue-600" />
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    sortable: true,
    cell: (row) => (
      <LunaBadge variant={getTypeVariant(row.type)} className="flex items-center gap-1 w-fit">
        {getTypeIcon(row.type)}
        {formatCreatorType(row.type)}
      </LunaBadge>
    ),
  },
  {
    accessorKey: 'bio',
    header: 'Bio',
    cell: (row) => (
      <span className="text-luna-gray-600 text-sm line-clamp-2" title={row.bio || 'No bio'}>
        {row.bio || 'No bio'}
      </span>
    ),
  },
  {
    accessorKey: 'website_url',
    header: 'Website',
    cell: (row) => row.website_url ? (
      <a 
        href={row.website_url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-luna-primary-600 hover:text-luna-primary-700 text-sm underline"
      >
        Visit
      </a>
    ) : (
      <span className="text-luna-gray-400 text-sm">-</span>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    sortable: true,
    cell: (row) => <span className="text-luna-gray-900 text-sm">{row.created_at ? formatDateTime(row.created_at, false) : '-'}</span>,
  },
];

interface CreatorsClientTableProps {
  initialCreators: Creator[];
}

export function CreatorsClientTable({ initialCreators }: CreatorsClientTableProps) {
  const router = useRouter();
  const [creators, setCreators] = useState<Creator[]>(initialCreators);
  const [searchValue, setSearchValue] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [verifiedFilter, setVerifiedFilter] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<Creator[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return creators.filter((creator) => {
      const matchesSearch = searchValue === '' ||
        creator.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        (creator.bio && creator.bio.toLowerCase().includes(searchValue.toLowerCase()));

      const matchesType = typeFilter.length === 0 ||
        typeFilter.includes(creator.type);

      const matchesVerified = verifiedFilter.length === 0 ||
        (verifiedFilter.includes('verified') && creator.verified) ||
        (verifiedFilter.includes('unverified') && !creator.verified);

      return matchesSearch && matchesType && matchesVerified;
    });
  }, [creators, searchValue, typeFilter, verifiedFilter]);

  const handleEdit = (creator: Creator) => {
    setSelectedCreator(creator);
    setEditModalOpen(true);
  };

  const handleDelete = async (creator: Creator) => {
    if (!confirm(`Are you sure you want to delete "${creator.name}"?`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('You must be logged in to delete creators');
        return;
      }

      const response = await fetch(`/api/learning/creators/${creator.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete creator');
      }

      // Remove from local state
      setCreators(creators.filter(c => c.id !== creator.id));
      router.refresh();
    } catch (error) {
      console.error('Error deleting creator:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete creator');
    }
  };

  const handleToggleVerified = async (creator: Creator) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('You must be logged in to update creators');
        return;
      }

      const response = await fetch(`/api/learning/creators/${creator.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          verified: !creator.verified,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update creator');
      }

      // Update local state
      setCreators(creators.map(c =>
        c.id === creator.id ? { ...c, verified: !c.verified } : c
      ));
      router.refresh();
    } catch (error) {
      console.error('Error updating creator:', error);
      alert(error instanceof Error ? error.message : 'Failed to update creator');
    }
  };

  const handleCreate = () => {
    setCreateModalOpen(true);
  };

  const refetchCreators = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setCreators(data);
      }
    } catch (error) {
      console.error('Error refetching creators:', error);
    }
  };

  const handleCreateSuccess = async () => {
    await refetchCreators();
    setCreateModalOpen(false);
  };

  const handleEditSuccess = async () => {
    await refetchCreators();
    setEditModalOpen(false);
    setSelectedCreator(null);
  };

  return (
    <>
      <LunaCard>
        <LunaCardHeader>
          <LunaCardTitle>All Creators</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent>
          <LunaDataTableToolbar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            searchPlaceholder="Search creators..."
            filters={[
              {
                column: 'type',
                label: 'Type',
                options: [
                  { value: 'individual', label: 'Individual' },
                  { value: 'institution', label: 'Institution' },
                  { value: 'organization', label: 'Organization' },
                  { value: 'partner', label: 'Partner' },
                ],
              },
              {
                column: 'verified',
                label: 'Verification',
                options: [
                  { value: 'verified', label: 'Verified' },
                  { value: 'unverified', label: 'Unverified' },
                ],
              },
            ]}
            activeFilters={{ type: typeFilter, verified: verifiedFilter }}
            onFilterChange={(column, values) => {
              if (column === 'type') setTypeFilter(values);
              if (column === 'verified') setVerifiedFilter(values);
            }}
            onCreateClick={handleCreate}
            createLabel="Add Creator"
            createIcon={<Users className="w-4 h-4" />}
          />
          <LunaDataTable
            columns={columns}
            data={filteredData}
            selectable
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            striped
            hoverable
            emptyMessage="No creators have been found matching your search criteria"
            actionsColumn={(row) => (
              <LunaDropdownMenu>
                <LunaDropdownMenuTrigger asChild>
                  <LunaButton variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </LunaButton>
                </LunaDropdownMenuTrigger>
                <LunaDropdownMenuContent align="end">
                  <LunaDropdownMenuItem onClick={() => handleEdit(row)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </LunaDropdownMenuItem>
                  <LunaDropdownMenuItem onClick={() => handleToggleVerified(row)}>
                    <BadgeCheck className="w-4 h-4 mr-2" />
                    {row.verified ? 'Unverify' : 'Verify'}
                  </LunaDropdownMenuItem>
                  <LunaDropdownMenuItem
                    onClick={() => handleDelete(row)}
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

      <CreateCreatorModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedCreator && (
        <EditCreatorModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          creator={selectedCreator}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}

