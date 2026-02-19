'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna';
import { LunaDataTable, type DataTableColumn } from '@/components/luna/data-table';
import { LunaDataTableToolbar } from '@/components/luna/data-table-toolbar';
import { LunaBadge } from '@/components/luna/badge';
import { LunaButton } from '@/components/luna/button';
import { LunaDropdownMenu, LunaDropdownMenuTrigger, LunaDropdownMenuContent, LunaDropdownMenuItem } from '@/components/luna/dropdown-menu';
import { CreateSkillModal } from '@/components/luna/learning/modals/create-skill-modal';
import { EditSkillModal } from '@/components/luna/learning/modals/edit-skill-modal';
import { Sparkles, MoreVertical, Edit, Trash2 } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { formatDateTime } from '@/lib/utils/formatters';
import { createClient } from '@/lib/supabase/client';

type Skill = Database['public']['Tables']['skills']['Row'];

// Helper function to format category for display
function formatCategory(category: string): string {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper function to get badge variant based on category
function getCategoryVariant(category: string): 'default' | 'primary' | 'success' | 'warning' | 'error' {
  const categoryMap: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
    'technical': 'default',
    'soft_skill': 'success',
    'industry_specific': 'warning',
  };
  return categoryMap[category] || 'default';
}

const columns: DataTableColumn<Skill>[] = [
  {
    accessorKey: 'name',
    header: 'Skill Name',
    sortable: true,
    cell: (row) => (
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-luna-primary-600" />
        <span className="font-medium text-luna-gray-900">{row.name}</span>
      </div>
    ),
  },
  {
    accessorKey: 'category',
    header: 'Category',
    sortable: true,
    cell: (row) => (
      <LunaBadge variant={getCategoryVariant(row.category)}>
        {formatCategory(row.category)}
      </LunaBadge>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: (row) => (
      <span className="text-luna-gray-600 text-sm line-clamp-2" title={row.description || 'No description'}>
        {row.description || 'No description'}
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

interface SkillsClientTableProps {
  initialSkills: Skill[];
}

export function SkillsClientTable({ initialSkills }: SkillsClientTableProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  const [selectedRows, setSelectedRows] = useState<Skill[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    router.refresh();
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setSelectedSkill(null);
    router.refresh();
  };

  const handleEdit = (skill: Skill) => {
    setSelectedSkill(skill);
    setEditModalOpen(true);
  };

  const handleDelete = async (skill: Skill) => {
    if (!confirm(`Are you sure you want to delete "${skill.name}"?`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('You must be logged in to delete skills');
        return;
      }

      const response = await fetch(`/api/learning/skills/${skill.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete skill');
      }

      router.refresh();
    } catch (error) {
      console.error('Error deleting skill:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete skill');
    }
  };

  // Get unique categories for filter
  const categoryOptions = useMemo(() => {
    const categories = new Set(initialSkills.map(s => s.category));
    return Array.from(categories).map(cat => ({
      value: cat,
      label: formatCategory(cat),
    }));
  }, [initialSkills]);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let filtered = initialSkills;

    // Apply search filter
    if (searchValue) {
      const search = searchValue.toLowerCase();
      filtered = filtered.filter(skill =>
        skill.name.toLowerCase().includes(search) ||
        skill.category.toLowerCase().includes(search) ||
        (skill.description && skill.description.toLowerCase().includes(search))
      );
    }

    // Apply category filter
    if (activeFilters.category && activeFilters.category.length > 0) {
      filtered = filtered.filter(skill =>
        activeFilters.category.includes(skill.category)
      );
    }

    return filtered;
  }, [initialSkills, searchValue, activeFilters]);

  const handleFilterChange = (column: string, values: string[]) => {
    setActiveFilters(prev => ({
      ...prev,
      [column]: values,
    }));
  };

  return (
    <>
      <LunaCard>
        <LunaCardHeader>
          <LunaCardTitle>All Skills</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent>
          <LunaDataTableToolbar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            searchPlaceholder="Search skills..."
            filters={[
              {
                column: 'category',
                label: 'Category',
                options: categoryOptions,
              },
            ]}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onCreateClick={() => setCreateModalOpen(true)}
            createLabel="Create Skill"
            createIcon={<Sparkles className="w-4 h-4" />}
          />
          <LunaDataTable
            columns={columns}
            data={filteredData}
            selectable
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            striped
            hoverable
            emptyMessage="No skills have been found matching your search criteria"
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

      <CreateSkillModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      <EditSkillModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={handleEditSuccess}
        skill={selectedSkill}
      />
    </>
  );
}

