/**
 * LunaLessonSelector Component
 * Multi-select dropdown with drag-and-drop reordering for lessons
 */

'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { LunaSearchableSelect } from '@/components/luna/searchable-select';
import { LunaButton } from '@/components/luna/button';
import { GripVertical, X, Video } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Lesson {
  id: string;
  title: string;
  duration_minutes?: number;
}

export interface SelectedLesson extends Lesson {
  sort_order: number;
  is_required: boolean;
}

export interface LunaLessonSelectorProps {
  availableLessons: Lesson[];
  selectedLessons?: SelectedLesson[];
  onChange?: (lessons: SelectedLesson[]) => void;
  label?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

export function LunaLessonSelector({
  availableLessons,
  selectedLessons = [],
  onChange,
  label = 'Lessons',
  helperText,
  required = false,
  className,
}: LunaLessonSelectorProps) {
  const [lessons, setLessons] = useState<SelectedLesson[]>(selectedLessons);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');

  useEffect(() => {
    setLessons(selectedLessons);
  }, [selectedLessons]);

  const handleAddLesson = () => {
    if (!selectedLessonId) return;

    const lesson = availableLessons.find((l) => l.id === selectedLessonId);
    if (!lesson) return;

    // Check if already added
    if (lessons.some((l) => l.id === lesson.id)) {
      setSelectedLessonId('');
      return;
    }

    const newLesson: SelectedLesson = {
      ...lesson,
      sort_order: lessons.length,
      is_required: true,
    };

    const newLessons = [...lessons, newLesson];
    setLessons(newLessons);
    onChange?.(newLessons);
    setSelectedLessonId('');
  };

  const handleRemoveLesson = (lessonId: string) => {
    const newLessons = lessons
      .filter((l) => l.id !== lessonId)
      .map((l, index) => ({ ...l, sort_order: index }));
    setLessons(newLessons);
    onChange?.(newLessons);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(lessons);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort_order
    const reorderedLessons = items.map((item, index) => ({
      ...item,
      sort_order: index,
    }));

    setLessons(reorderedLessons);
    onChange?.(reorderedLessons);
  };

  // Filter out already selected lessons
  const availableOptions = availableLessons
    .filter((lesson) => !lessons.some((l) => l.id === lesson.id))
    .map((lesson) => ({
      value: lesson.id,
      label: lesson.title,
    }));

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="block text-sm font-medium text-luna-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Add Lesson Dropdown */}
      <div className="flex gap-2">
        <div className="flex-1">
          <LunaSearchableSelect
            placeholder="Select a lesson to add..."
            options={availableOptions}
            value={selectedLessonId}
            onValueChange={setSelectedLessonId}
          />
        </div>
        <LunaButton
          type="button"
          onClick={handleAddLesson}
          disabled={!selectedLessonId}
          size="sm"
        >
          Add Lesson
        </LunaButton>
      </div>

      {helperText && (
        <p className="text-xs text-luna-gray-600">{helperText}</p>
      )}

      {/* Selected Lessons with Drag & Drop */}
      {lessons.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-luna-gray-700 mb-2">
            Selected Lessons ({lessons.length})
          </p>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="lessons">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {lessons.map((lesson, index) => (
                    <Draggable key={lesson.id} draggableId={lesson.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            'flex items-center gap-3 p-3 bg-white border border-luna-gray-200 rounded-lg transition-shadow',
                            snapshot.isDragging && 'shadow-lg'
                          )}
                        >
                          {/* Drag Handle */}
                          <div
                            {...provided.dragHandleProps}
                            className="shrink-0 cursor-grab active:cursor-grabbing text-luna-gray-400 hover:text-luna-gray-600"
                          >
                            <GripVertical className="w-5 h-5" />
                          </div>

                          {/* Lesson Icon */}
                          <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                            <Video className="w-4 h-4 text-cyan-600" />
                          </div>

                          {/* Lesson Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-luna-gray-900 truncate">
                              {lesson.title}
                            </p>
                            {lesson.duration_minutes && (
                              <p className="text-xs text-luna-gray-600">
                                {lesson.duration_minutes} minutes
                              </p>
                            )}
                          </div>

                          {/* Order Badge */}
                          <div className="shrink-0 px-2 py-1 bg-luna-gray-100 rounded text-xs font-medium text-luna-gray-700">
                            #{index + 1}
                          </div>

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveLesson(lesson.id)}
                            className="shrink-0 w-8 h-8 flex items-center justify-center rounded hover:bg-red-50 text-luna-gray-400 hover:text-red-600 transition-colors"
                            aria-label="Remove lesson"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
    </div>
  );
}

