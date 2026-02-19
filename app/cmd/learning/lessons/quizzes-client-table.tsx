'use client';

import { useState, useMemo } from 'react';
import { LunaCard, LunaCardHeader, LunaCardTitle, LunaCardContent } from '@/components/luna';
import { LunaDataTable, type DataTableColumn } from '@/components/luna/data-table';
import { LunaDataTableToolbar } from '@/components/luna/data-table-toolbar';
import { LunaBadge } from '@/components/luna/badge';
import { LunaButton } from '@/components/luna/button';
import { LunaDropdownMenu, LunaDropdownMenuTrigger, LunaDropdownMenuContent, LunaDropdownMenuItem } from '@/components/luna/dropdown-menu';
import { ClipboardList, MoreVertical, Edit, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { Database } from '@/types/database.types';
import { formatDateTime } from '@/lib/utils/formatters';
import { createClient } from '@/lib/supabase/client';
import { CreateQuizModal } from '@/components/luna/learning/modals/create-quiz-modal';
import { EditQuizModal } from '@/components/luna/learning/modals/edit-quiz-modal';

type Quiz = Database['public']['Tables']['quizzes']['Row'] & {
  question_count?: number;
};

const columns: DataTableColumn<Quiz>[] = [
  {
    accessorKey: 'name',
    header: 'Quiz Name',
    sortable: true,
    cell: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
          <ClipboardList className="w-4 h-4 text-purple-600" />
        </div>
        <div className="font-medium text-luna-gray-900">{row.name}</div>
      </div>
    ),
  },
  {
    accessorKey: 'question_count',
    header: 'Questions',
    sortable: true,
    cell: (row) => (
      <div className="text-luna-gray-700">
        {row.question_count || row.number_of_questions} questions
      </div>
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
    accessorKey: 'is_graded',
    header: 'Graded',
    sortable: true,
    cell: (row) => (
      row.is_graded ? (
        <div className="flex items-center gap-1.5 text-green-700">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Yes</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-luna-gray-500">
          <XCircle className="w-4 h-4" />
          <span className="text-sm">No</span>
        </div>
      )
    ),
  },
  {
    accessorKey: 'passing_score',
    header: 'Passing Score',
    sortable: true,
    cell: (row) => (
      row.is_graded && row.passing_score ? (
        <LunaBadge variant="success">
          {row.passing_score}%
        </LunaBadge>
      ) : (
        <span className="text-luna-gray-400 text-sm">N/A</span>
      )
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    sortable: true,
    cell: (row) => (
      <span className="text-sm text-luna-gray-600">
        {formatDateTime(row.created_at)}
      </span>
    ),
  },
];

interface QuizzesClientTableProps {
  initialQuizzes?: Quiz[];
}

export function QuizzesClientTable({ initialQuizzes = [] }: QuizzesClientTableProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>(initialQuizzes);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRows, setSelectedRows] = useState<Quiz[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const supabase = createClient();

  // Filter quizzes based on search
  const filteredQuizzes = useMemo(() => {
    if (!searchQuery) return quizzes;
    
    const query = searchQuery.toLowerCase();
    return quizzes.filter(quiz =>
      quiz.name.toLowerCase().includes(query) ||
      quiz.description?.toLowerCase().includes(query)
    );
  }, [quizzes, searchQuery]);

  const handleEdit = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setEditModalOpen(true);
  };

  const handleDelete = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This will also delete all attempts and answers.')) {
      return;
    }

    setDeleting(quizId);

    try {
      const response = await fetch(`/api/learning/quizzes/${quizId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete quiz');
      }

      // Remove from local state
      setQuizzes(prev => prev.filter(q => q.id !== quizId));
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete quiz');
    } finally {
      setDeleting(null);
    }
  };

  const handleQuizCreated = async () => {
    // Refresh quizzes list
    try {
      const response = await fetch('/api/learning/quizzes');
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data.quizzes || []);
      }
    } catch (error) {
      console.error('Error refreshing quizzes:', error);
    }
  };

  return (
    <>
      <LunaCard>
        <LunaCardHeader>
          <LunaCardTitle>All Quizzes</LunaCardTitle>
        </LunaCardHeader>
        <LunaCardContent>
          <LunaDataTableToolbar
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search quizzes..."
            onCreateClick={() => setCreateModalOpen(true)}
            createLabel="Create Quiz"
            createIcon={<ClipboardList className="w-4 h-4" />}
          />
          <LunaDataTable
            columns={columns}
            data={filteredQuizzes}
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
                    onClick={() => handleDelete(row.id)}
                    disabled={deleting === row.id}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleting === row.id ? 'Deleting...' : 'Delete'}
                  </LunaDropdownMenuItem>
                </LunaDropdownMenuContent>
              </LunaDropdownMenu>
            )}
          />
        </LunaCardContent>
      </LunaCard>

      <CreateQuizModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleQuizCreated}
      />

      {selectedQuiz && (
        <EditQuizModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          quizId={selectedQuiz.id}
          onSuccess={handleQuizCreated}
        />
      )}
    </>
  );
}

