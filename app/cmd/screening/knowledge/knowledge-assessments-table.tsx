'use client';

import { useState } from 'react';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna';
import { LunaDataTable, type DataTableColumn } from '@/components/luna/data-table';
import { LunaDataTableToolbar } from '@/components/luna/data-table-toolbar';
import { LunaBadge } from '@/components/luna/badge';
import { LunaButton } from '@/components/luna/button';
import { LunaDropdownMenu, LunaDropdownMenuTrigger, LunaDropdownMenuContent, LunaDropdownMenuItem } from '@/components/luna/dropdown-menu';
import { CreateKnowledgeAssessmentModal } from '@/components/luna/screening/create-knowledge-assessment-modal';
import { EditKnowledgeAssessmentModal } from '@/components/luna/screening/edit-knowledge-assessment-modal';
import { Brain, MoreVertical, Eye, Edit, Trash2, CheckCircle, Ban, Plus } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { useRouter } from 'next/navigation';

type KnowledgeAssessment = Database['public']['Tables']['knowledge_assessments']['Row'];

interface KnowledgeAssessmentsTableProps {
  initialData: KnowledgeAssessment[];
}

export function KnowledgeAssessmentsTable({ initialData }: KnowledgeAssessmentsTableProps) {
  const router = useRouter();
  const [assessments, setAssessments] = useState<KnowledgeAssessment[]>(initialData);
  const [selectedRows, setSelectedRows] = useState<KnowledgeAssessment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<KnowledgeAssessment | null>(null);

  const filteredAssessments = assessments.filter(assessment =>
    assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assessment.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: DataTableColumn<KnowledgeAssessment>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-600" />
          <span className="font-medium">{row.title}</span>
        </div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
      sortable: true,
      cell: (row) => (
        <LunaBadge variant="default" className="capitalize">
          {row.category.replace(/_/g, ' ')}
        </LunaBadge>
      ),
    },
    {
      accessorKey: 'total_questions_in_pool',
      header: 'Questions',
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-luna-gray-600">
          {row.total_questions_in_pool} total / {row.questions_per_attempt} per attempt
        </span>
      ),
    },
    {
      accessorKey: 'passing_threshold',
      header: 'Pass Threshold',
      sortable: true,
      cell: (row) => (
        <span className="text-sm font-medium">{row.passing_threshold}%</span>
      ),
    },
    {
      accessorKey: 'time_limit_minutes',
      header: 'Time Limit',
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-luna-gray-600">{row.time_limit_minutes} min</span>
      ),
    },
    {
      accessorKey: 'is_published',
      header: 'Status',
      sortable: true,
      cell: (row) => {
        return row.is_published ? (
          <LunaBadge variant="success">Published</LunaBadge>
        ) : (
          <LunaBadge variant="warning">Draft</LunaBadge>
        );
      },
    },
  ];

  const handleEdit = (assessment: KnowledgeAssessment) => {
    setSelectedAssessment(assessment);
    setEditModalOpen(true);
  };

  const handleManageQuestions = (assessment: KnowledgeAssessment) => {
    router.push(`/cmd/screening/knowledge/${assessment.id}/questions`);
  };



  const handleDelete = async (assessment: KnowledgeAssessment) => {
    if (!confirm(`Are you sure you want to delete "${assessment.title}"? This will also delete all questions and attempts.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/screening/knowledge/${assessment.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete failed:', errorData);
        alert(`Failed to delete assessment: ${errorData.error || 'Unknown error'}`);
        throw new Error(errorData.error || 'Failed to delete assessment');
      }

      setAssessments(prev => prev.filter(a => a.id !== assessment.id));
      router.refresh();
      alert('Assessment deleted successfully');
    } catch (error) {
      console.error('Error deleting assessment:', error);
      if (error instanceof Error && !error.message.includes('Failed to delete')) {
        alert(`Error: ${error.message}`);
      }
    }
  };

  return (
    <>
      <LunaCard>
        <LunaCardHeader>
          <LunaCardTitle>Knowledge Assessments</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent>
          <LunaDataTableToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search assessments..."
            onCreateClick={() => setCreateModalOpen(true)}
            createLabel="Create Assessment"
            createIcon={<Brain className="w-4 h-4" />}
          />
          <LunaDataTable
            columns={columns}
            data={filteredAssessments}
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
                  <LunaDropdownMenuItem onClick={() => handleManageQuestions(row)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Manage Questions
                  </LunaDropdownMenuItem>
                  <LunaDropdownMenuItem onClick={() => handleEdit(row)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Settings
                  </LunaDropdownMenuItem>
                  <LunaDropdownMenuItem
                    onClick={() => handleDelete(row)}
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

      <CreateKnowledgeAssessmentModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
          router.refresh();
        }}
      />

      {selectedAssessment && (
        <EditKnowledgeAssessmentModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedAssessment(null);
          }}
          assessment={selectedAssessment}
          onSuccess={() => {
            setEditModalOpen(false);
            setSelectedAssessment(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

