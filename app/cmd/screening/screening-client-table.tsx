'use client';

import { useState } from 'react';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna';
import { LunaDataTable, type DataTableColumn } from '@/components/luna/data-table';
import { LunaDataTableToolbar } from '@/components/luna/data-table-toolbar';
import { LunaBadge } from '@/components/luna/badge';
import { LunaButton } from '@/components/luna/button';
import { LunaDropdownMenu, LunaDropdownMenuTrigger, LunaDropdownMenuContent, LunaDropdownMenuItem } from '@/components/luna/dropdown-menu';
import { CreateAssessmentModal } from '@/components/luna/screening/create-assessment-modal';
import { EditAssessmentModal } from '@/components/luna/screening/edit-assessment-modal';
import { EditKnowledgeAssessmentModal } from '@/components/luna/screening/edit-knowledge-assessment-modal';
import { DeleteAssessmentDialog } from '@/components/luna/screening/delete-assessment-dialog';
import { ViewAssessmentModal } from '@/components/luna/screening/view-assessment-modal';
import { Keyboard, MoreVertical, Edit, Trash2, Mic, Globe, Eye, Brain, Users, Ban, CheckCircle, BookOpen } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { formatDateTime } from '@/lib/utils/formatters';
import { createClient } from '@/lib/supabase/client';

type AssessmentTemplate = Database['public']['Tables']['assessment_templates']['Row'];
type KnowledgeAssessment = Database['public']['Tables']['knowledge_assessments']['Row'];

// Unified assessment type for display
type UnifiedAssessment = {
  id: string;
  title: string;
  description: string | null;
  type: 'typing' | 'knowledge';
  category?: string;
  is_active?: boolean | null; // Only for typing assessments
  is_published?: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  // Typing-specific
  has_audio?: boolean | null;
  language?: string;
  duration_seconds?: number;
  // Knowledge-specific
  questions_per_attempt?: number;
  passing_threshold?: number;
  total_questions_in_pool?: number | null;
  // Original data for editing
  originalData: AssessmentTemplate | KnowledgeAssessment;
};

interface ScreeningClientTableProps {
  initialData: AssessmentTemplate[];
  knowledgeAssessments: KnowledgeAssessment[];
}

export function ScreeningClientTable({ initialData, knowledgeAssessments }: ScreeningClientTableProps) {
  // Convert to unified format
  const convertToUnified = (typing: AssessmentTemplate[], knowledge: KnowledgeAssessment[]): UnifiedAssessment[] => {
    const typingUnified: UnifiedAssessment[] = typing.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      type: 'typing' as const,
      category: t.category || undefined,
      is_active: t.is_active,
      created_at: t.created_at,
      updated_at: t.updated_at,
      has_audio: t.has_audio,
      language: t.language,
      duration_seconds: t.duration_seconds,
      originalData: t,
    }));

    const knowledgeUnified: UnifiedAssessment[] = knowledge.map(k => ({
      id: k.id,
      title: k.title,
      description: k.description,
      type: 'knowledge' as const,
      category: k.category,
      is_published: k.is_published,
      created_at: k.created_at,
      updated_at: k.updated_at,
      questions_per_attempt: k.questions_per_attempt,
      passing_threshold: k.passing_threshold,
      total_questions_in_pool: k.total_questions_in_pool,
      originalData: k,
    }));

    return [...typingUnified, ...knowledgeUnified].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  };

  const [assessments, setAssessments] = useState<UnifiedAssessment[]>(convertToUnified(initialData, knowledgeAssessments));
  const [selectedRows, setSelectedRows] = useState<UnifiedAssessment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editKnowledgeModalOpen, setEditKnowledgeModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<UnifiedAssessment | null>(null);

  const refetchData = async () => {
    try {
      const supabase = createClient();

      // Fetch typing assessments
      const { data: typingData, error: typingError } = await supabase
        .from('assessment_templates')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (typingError) throw typingError;

      // Fetch knowledge assessments
      const { data: knowledgeData, error: knowledgeError } = await supabase
        .from('knowledge_assessments')
        .select('*')
        .order('created_at', { ascending: false });

      if (knowledgeError) throw knowledgeError;

      setAssessments(convertToUnified(typingData || [], knowledgeData || []));
    } catch (error) {
      console.error('Error refetching assessments:', error);
    }
  };

  const handleCreateSuccess = () => {
    refetchData();
  };

  const handleEditSuccess = () => {
    refetchData();
  };

  const handleDeleteSuccess = () => {
    refetchData();
  };

  const handleView = (assessment: UnifiedAssessment) => {
    setSelectedAssessment(assessment);
    setViewModalOpen(true);
  };

  const handleEdit = (assessment: UnifiedAssessment) => {
    setSelectedAssessment(assessment);
    if (assessment.type === 'knowledge') {
      setEditKnowledgeModalOpen(true);
    } else {
      setEditModalOpen(true);
    }
  };

  const handleDeleteClick = (assessment: UnifiedAssessment) => {
    setSelectedAssessment(assessment);
    setDeleteDialogOpen(true);
  };

  const getAssessmentIcon = (assessment: UnifiedAssessment) => {
    if (assessment.type === 'knowledge') return BookOpen;
    if (assessment.category === 'personality') return Users;
    if (assessment.category === 'cognitive') return Brain;
    if (assessment.has_audio) return Mic;
    if (assessment.type === 'typing') return Keyboard;
    return Globe;
  };

  const getAssessmentTypeLabel = (assessment: UnifiedAssessment) => {
    if (assessment.type === 'knowledge') return 'Knowledge Test';
    if (assessment.category === 'personality') return 'Soft Skills';
    if (assessment.category === 'cognitive') return 'Soft Skills';
    if (assessment.has_audio) return 'Transcription';
    if (assessment.type === 'typing') return 'Typing';
    return assessment.type;
  };

  const handleToggleActive = async (assessment: UnifiedAssessment) => {
    try {
      const supabase = createClient();
      const tableName = assessment.type === 'knowledge' ? 'knowledge_assessments' : 'assessment_templates';
      const { error } = await supabase
        .from(tableName)
        .update({ is_active: !assessment.is_active, updated_at: new Date().toISOString() })
        .eq('id', assessment.id);

      if (error) throw error;
      await refetchData();
    } catch (error) {
      console.error('Error toggling assessment status:', error);
    }
  };

  const columns: DataTableColumn<UnifiedAssessment>[] = [
    {
      accessorKey: 'title',
      header: 'Assessment Title',
      sortable: true,
      cell: (row) => {
        const Icon = getAssessmentIcon(row);
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-luna-gray-400 shrink-0" />
            <div className="flex flex-col">
              <span className="font-medium text-luna-gray-900">{row.title}</span>
              {row.description && (
                <span className="text-xs text-luna-gray-500 line-clamp-1">{row.description}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      sortable: true,
      cell: (row) => (
        <span className="text-luna-gray-900 text-sm capitalize">
          {getAssessmentTypeLabel(row)}
        </span>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      sortable: true,
      cell: (row) => (
        <span className="text-luna-gray-900 text-sm capitalize">
          {row.category ? row.category.replace('_', ' ') : row.language?.toUpperCase() || 'EN'}
        </span>
      ),
    },
    {
      accessorKey: 'id',
      header: 'Details',
      sortable: false,
      cell: (row) => {
        if (row.type === 'knowledge') {
          return (
            <span className="text-luna-gray-900 text-sm">
              {row.questions_per_attempt}/{row.total_questions_in_pool} questions • {row.passing_threshold}% pass
            </span>
          );
        }
        return (
          <span className="text-luna-gray-900 text-sm">
            {row.duration_seconds}s
          </span>
        );
      },
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
      cell: (row) => (
        <span className="text-luna-gray-600 text-sm">
          {row.created_at ? formatDateTime(row.created_at) : '-'}
        </span>
      ),
    },
  ];

  return (
    <>
      <LunaCard>
        <LunaCardHeader>
          <LunaCardTitle>Assessments</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent>
          <LunaDataTableToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search assessments..."
            onCreateClick={() => setCreateModalOpen(true)}
            createLabel="Create Assessment"
            createIcon={<Keyboard className="w-4 h-4" />}
          />

          <LunaDataTable
            columns={columns}
            data={assessments}
            selectable
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            striped
            hoverable
            actionsColumn={(row) => (
              <LunaDropdownMenu>
                <LunaDropdownMenuTrigger asChild>
                  <LunaButton variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </LunaButton>
                </LunaDropdownMenuTrigger>
                <LunaDropdownMenuContent align="end">
                  <LunaDropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleView(row);
                  }}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </LunaDropdownMenuItem>

                  <LunaDropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(row);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </LunaDropdownMenuItem>

                  {row.type !== 'knowledge' && (
                    <LunaDropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(row);
                    }}>
                      {row.is_active ? (
                        <>
                          <Ban className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </LunaDropdownMenuItem>
                  )}

                  <LunaDropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(row);
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </LunaDropdownMenuItem>
                </LunaDropdownMenuContent>
              </LunaDropdownMenu>
            )}
          />
        </LunaCardContent>
      </LunaCard>

      <CreateAssessmentModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {selectedAssessment && selectedAssessment.type !== 'knowledge' && (
        <>
          <ViewAssessmentModal
            open={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedAssessment(null);
            }}
            assessmentId={selectedAssessment.id}
          />

          <EditAssessmentModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedAssessment(null);
            }}
            onSuccess={handleEditSuccess}
            assessmentId={selectedAssessment.id}
          />

          <DeleteAssessmentDialog
            open={deleteDialogOpen}
            onClose={() => {
              setDeleteDialogOpen(false);
              setSelectedAssessment(null);
            }}
            onSuccess={handleDeleteSuccess}
            assessmentId={selectedAssessment.id}
            assessmentTitle={selectedAssessment.title}
          />
        </>
      )}

      {selectedAssessment && selectedAssessment.type === 'knowledge' && (
        <EditKnowledgeAssessmentModal
          open={editKnowledgeModalOpen}
          onClose={() => {
            setEditKnowledgeModalOpen(false);
            setSelectedAssessment(null);
          }}
          assessment={selectedAssessment.originalData as KnowledgeAssessment}
          onSuccess={() => {
            setEditKnowledgeModalOpen(false);
            setSelectedAssessment(null);
            handleEditSuccess();
          }}
        />
      )}
    </>
  );
}

