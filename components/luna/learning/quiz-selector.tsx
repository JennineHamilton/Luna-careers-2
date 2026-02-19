/**
 * Quiz Selector Component
 * Allows selecting and ordering quizzes for modules
 */

'use client';

import { useState, useEffect } from 'react';
import { LunaButton } from '@/components/luna/button';
import { LunaSearchableSelect } from '@/components/luna/searchable-select';
import { LunaSwitch } from '@/components/luna/switch';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Trash2, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database.types';

type Quiz = Database['public']['Tables']['quizzes']['Row'];

export interface SelectedQuiz extends Quiz {
  sort_order: number;
  is_required: boolean;
}

export interface LunaQuizSelectorProps {
  availableQuizzes: Quiz[];
  selectedQuizzes?: SelectedQuiz[];
  onChange?: (quizzes: SelectedQuiz[]) => void;
  label?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

export function LunaQuizSelector({
  availableQuizzes,
  selectedQuizzes = [],
  onChange,
  label = 'Quizzes',
  helperText,
  required = false,
  className,
}: LunaQuizSelectorProps) {
  const [quizzes, setQuizzes] = useState<SelectedQuiz[]>(selectedQuizzes);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');

  useEffect(() => {
    setQuizzes(selectedQuizzes);
  }, [selectedQuizzes]);

  const handleAddQuiz = () => {
    if (!selectedQuizId) return;

    const quiz = availableQuizzes.find((q) => q.id === selectedQuizId);
    if (!quiz) return;

    // Check if already added
    if (quizzes.some((q) => q.id === quiz.id)) {
      setSelectedQuizId('');
      return;
    }

    const newQuiz: SelectedQuiz = {
      ...quiz,
      sort_order: quizzes.length,
      is_required: true,
    };

    const newQuizzes = [...quizzes, newQuiz];
    setQuizzes(newQuizzes);
    onChange?.(newQuizzes);
    setSelectedQuizId('');
  };

  const handleRemoveQuiz = (quizId: string) => {
    const newQuizzes = quizzes
      .filter((q) => q.id !== quizId)
      .map((q, index) => ({ ...q, sort_order: index }));
    setQuizzes(newQuizzes);
    onChange?.(newQuizzes);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(quizzes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort_order
    const reorderedQuizzes = items.map((item, index) => ({
      ...item,
      sort_order: index,
    }));

    setQuizzes(reorderedQuizzes);
    onChange?.(reorderedQuizzes);
  };

  // Filter out already selected quizzes
  const availableOptions = availableQuizzes
    .filter((quiz) => !quizzes.some((q) => q.id === quiz.id))
    .map((quiz) => ({
      value: quiz.id,
      label: quiz.name,
    }));

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="block text-sm font-medium text-luna-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Add Quiz Dropdown */}
      <div className="flex gap-2">
        <div className="flex-1">
          <LunaSearchableSelect
            placeholder="Select a quiz to add..."
            options={availableOptions}
            value={selectedQuizId}
            onValueChange={setSelectedQuizId}
          />
        </div>
        <LunaButton
          type="button"
          onClick={handleAddQuiz}
          disabled={!selectedQuizId}
          size="sm"
        >
          Add Quiz
        </LunaButton>
      </div>

      {helperText && (
        <p className="text-xs text-luna-gray-600">{helperText}</p>
      )}

      {/* Selected Quizzes List */}
      {quizzes.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="quizzes">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {quizzes.map((quiz, index) => (
                  <Draggable key={quiz.id} draggableId={quiz.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={cn(
                          'flex items-center gap-3 p-3 bg-white border border-luna-gray-200 rounded-lg',
                          snapshot.isDragging && 'shadow-lg'
                        )}
                      >
                        <div
                          {...provided.dragHandleProps}
                          className="text-luna-gray-400 hover:text-luna-gray-600 cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="w-5 h-5" />
                        </div>

                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700">
                          <ClipboardList className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-luna-gray-900 truncate">
                            {quiz.name}
                          </p>
                          <p className="text-xs text-luna-gray-500">
                            {quiz.duration_minutes} min • {quiz.number_of_questions} questions
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-luna-gray-600">Required</span>
                            <LunaSwitch
                              checked={quiz.is_required}
                              onCheckedChange={(checked) => {
                                const newQuizzes = quizzes.map((q) =>
                                  q.id === quiz.id ? { ...q, is_required: checked } : q
                                );
                                setQuizzes(newQuizzes);
                                onChange?.(newQuizzes);
                              }}
                            />
                          </div>

                          <LunaButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveQuiz(quiz.id)}
                            icon={<Trash2 className="w-4 h-4" />}
                            className="text-red-600 hover:text-red-700"
                          />
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {quizzes.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-luna-gray-200 rounded-lg">
          <ClipboardList className="w-12 h-12 mx-auto text-luna-gray-300 mb-2" />
          <p className="text-sm text-luna-gray-500">No quizzes added yet</p>
          <p className="text-xs text-luna-gray-400">Select a quiz from the dropdown above</p>
        </div>
      )}
    </div>
  );
}

