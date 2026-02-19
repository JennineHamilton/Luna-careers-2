'use client';

import { useState, useMemo } from 'react';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna';
import { LunaDataTable, type DataTableColumn } from '@/components/luna/data-table';
import { LunaDataTableToolbar } from '@/components/luna/data-table-toolbar';
import { LunaBadge } from '@/components/luna/badge';
import { LunaButton } from '@/components/luna/button';
import { LunaDropdownMenu, LunaDropdownMenuTrigger, LunaDropdownMenuContent, LunaDropdownMenuItem } from '@/components/luna/dropdown-menu';
import { Video, MoreVertical, Edit, Trash2, Clock, ClipboardCheck, FileArchive } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { formatDateTime } from '@/lib/utils/formatters';
import { createClient } from '@/lib/supabase/client';
import { CreateLessonModal } from '@/components/luna/learning/modals/create-lesson-modal';
import { EditLessonModal } from '@/components/luna/learning/modals/edit-lesson-modal';

type Lesson = Database['public']['Tables']['lessons']['Row'];

const columns: DataTableColumn<Lesson>[] = [
  {
    accessorKey: 'title',
    header: 'Lesson Title',
    sortable: true,
    cell: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
          <Video className="w-4 h-4 text-cyan-600" />
        </div>
        <div className="font-medium text-luna-gray-900">{row.title}</div>
      </div>
    ),
  },
  {
    accessorKey: 'scorm_version',
    header: 'SCORM Version',
    sortable: true,
    cell: (row) => (
      <LunaBadge variant={row.scorm_version === '2004' ? 'success' : 'default'}>
        SCORM {row.scorm_version}
      </LunaBadge>
    ),
  },
  {
    accessorKey: 'duration_minutes',
    header: 'Duration',
    sortable: true,
    cell: (row) => (
      <div className="flex items-center gap-1.5 text-luna-gray-700">
        <Clock className="w-4 h-4" />
        <span>{row.duration_minutes} min</span>
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
    accessorKey: 'created_at',
    header: 'Created',
    sortable: true,
    cell: (row) => <span className="text-luna-gray-900 text-sm">{row.created_at ? formatDateTime(row.created_at, false) : '-'}</span>,
  },
];

interface LessonsClientTableProps {
  initialLessons: Lesson[];
}

export function LessonsClientTable({ initialLessons }: LessonsClientTableProps) {
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [selectedRows, setSelectedRows] = useState<Lesson[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesSearch = searchValue === '' ||
        lesson.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        (lesson.description && lesson.description.toLowerCase().includes(searchValue.toLowerCase()));

      const versionFilter = activeFilters['version'] || [];
      const matchesVersion = versionFilter.length === 0 ||
        versionFilter.includes(lesson.scorm_version);

      return matchesSearch && matchesVersion;
    });
  }, [lessons, searchValue, activeFilters]);

  const handleEdit = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setEditModalOpen(true);
  };

  const handleDelete = async (lesson: Lesson) => {
    if (!confirm(`Are you sure you want to delete "${lesson.title}"?`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert('You must be logged in to delete lessons');
        return;
      }

      const response = await fetch(`/api/learning/lessons/${lesson.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete lesson');
      }

      // Remove from local state
      setLessons(lessons.filter(l => l.id !== lesson.id));
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete lesson');
    }
  };

  const handleCreate = () => {
    setCreateModalOpen(true);
  };

  const refetchLessons = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          creators (
            id,
            name,
            logo_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setLessons(data);
      }
    } catch (error) {
      console.error('Error refetching lessons:', error);
    }
  };

  const handleCreateSuccess = async () => {
    await refetchLessons();
    setCreateModalOpen(false);
  };

  const handleEditSuccess = async () => {
    await refetchLessons();
    setEditModalOpen(false);
    setSelectedLesson(null);
  };

  return (
    <>
      <LunaCard>
        <LunaCardHeader>
          <LunaCardTitle>All Lessons</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent>
          <LunaDataTableToolbar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            searchPlaceholder="Search lessons..."
            filters={[
              {
                column: 'version',
                label: 'SCORM Version',
                options: [
                  { label: 'SCORM 1.2', value: '1.2' },
                  { label: 'SCORM 2004', value: '2004' },
                ],
              },
            ]}
            activeFilters={activeFilters}
            onFilterChange={(column, values) => {
              setActiveFilters(prev => ({ ...prev, [column]: values }));
            }}
            onCreateClick={handleCreate}
            createLabel="Upload Lesson"
            createIcon={<Video className="w-4 h-4" />}
          />

          <LunaDataTable
            columns={columns}
            data={filteredData}
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

      <CreateLessonModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedLesson && (
        <EditLessonModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          lesson={selectedLesson}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}

