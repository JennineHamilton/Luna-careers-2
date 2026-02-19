/**
 * Module Content Selector Component
 * Allows selecting and ordering both lessons and quizzes together for modules
 */

'use client';

import { useState, useEffect } from 'react';
import { LunaButton } from '@/components/luna/button';
import { LunaSearchableSelect } from '@/components/luna/searchable-select';
import { LunaSwitch } from '@/components/luna/switch';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { GripVertical, Trash2, Video, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/types/database.types';

type Lesson = Database['public']['Tables']['lessons']['Row'];
type Quiz = Database['public']['Tables']['quizzes']['Row'];

export type ContentItem = {
  id: string;
  type: 'lesson' | 'quiz';
  sort_order: number;
  is_required: boolean;
  // Lesson fields
  title?: string;
  duration_minutes?: number;
  // Quiz fields
  name?: string;
  number_of_questions?: number;
};

export interface ModuleContentSelectorProps {
  availableLessons: Lesson[];
  availableQuizzes: Quiz[];
  selectedContent?: ContentItem[];
  onChange?: (content: ContentItem[]) => void;
  label?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

export function ModuleContentSelector({
  availableLessons,
  availableQuizzes,
  selectedContent = [],
  onChange,
  label = 'Module Content',
  helperText,
  required = false,
  className,
}: ModuleContentSelectorProps) {
  const [content, setContent] = useState<ContentItem[]>(selectedContent);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedItemType, setSelectedItemType] = useState<'lesson' | 'quiz'>('lesson');

  useEffect(() => {
    setContent(selectedContent);
  }, [selectedContent]);

  const handleAddContent = () => {
    if (!selectedItemId) return;

    if (selectedItemType === 'lesson') {
      const lesson = availableLessons.find((l) => l.id === selectedItemId);
      if (!lesson) return;

      // Check if already added
      if (content.some((c) => c.id === lesson.id && c.type === 'lesson')) {
        setSelectedItemId('');
        return;
      }

      const newItem: ContentItem = {
        id: lesson.id,
        type: 'lesson',
        title: lesson.title,
        duration_minutes: lesson.duration_minutes,
        sort_order: content.length,
        is_required: true,
      };

      const newContent = [...content, newItem];
      setContent(newContent);
      onChange?.(newContent);
      setSelectedItemId('');
    } else {
      const quiz = availableQuizzes.find((q) => q.id === selectedItemId);
      if (!quiz) return;

      // Check if already added
      if (content.some((c) => c.id === quiz.id && c.type === 'quiz')) {
        setSelectedItemId('');
        return;
      }

      const newItem: ContentItem = {
        id: quiz.id,
        type: 'quiz',
        name: quiz.name,
        duration_minutes: quiz.duration_minutes,
        number_of_questions: quiz.number_of_questions,
        sort_order: content.length,
        is_required: true,
      };

      const newContent = [...content, newItem];
      setContent(newContent);
      onChange?.(newContent);
      setSelectedItemId('');
    }
  };

  const handleRemoveContent = (itemId: string, itemType: 'lesson' | 'quiz') => {
    const newContent = content
      .filter((c) => !(c.id === itemId && c.type === itemType))
      .map((c, index) => ({ ...c, sort_order: index }));
    setContent(newContent);
    onChange?.(newContent);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(content);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort_order
    const reorderedContent = items.map((item, index) => ({
      ...item,
      sort_order: index,
    }));

    setContent(reorderedContent);
    onChange?.(reorderedContent);
  };

  // Filter out already selected items
  const availableLessonOptions = availableLessons
    .filter((lesson) => !content.some((c) => c.id === lesson.id && c.type === 'lesson'))
    .map((lesson) => ({
      value: lesson.id,
      label: lesson.title,
    }));

  const availableQuizOptions = availableQuizzes
    .filter((quiz) => !content.some((c) => c.id === quiz.id && c.type === 'quiz'))
    .map((quiz) => ({
      value: quiz.id,
      label: quiz.name,
    }));

  const currentOptions = selectedItemType === 'lesson' ? availableLessonOptions : availableQuizOptions;

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="block text-sm font-medium text-luna-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Add Content Dropdown */}
      <div className="flex gap-2">
        <div className="w-32">
          <LunaSearchableSelect
            placeholder="Type"
            options={[
              { value: 'lesson', label: 'Lesson' },
              { value: 'quiz', label: 'Quiz' },
            ]}
            value={selectedItemType}
            onValueChange={(value) => {
              setSelectedItemType(value as 'lesson' | 'quiz');
              setSelectedItemId('');
            }}
          />
        </div>
        <div className="flex-1">
          <LunaSearchableSelect
            placeholder={`Select a ${selectedItemType} to add...`}
            options={currentOptions}
            value={selectedItemId}
            onValueChange={setSelectedItemId}
          />
        </div>
        <LunaButton
          type="button"
          onClick={handleAddContent}
          disabled={!selectedItemId}
          size="sm"
        >
          Add {selectedItemType === 'lesson' ? 'Lesson' : 'Quiz'}
        </LunaButton>
      </div>

      {helperText && (
        <p className="text-xs text-luna-gray-600">{helperText}</p>
      )}

      {/* Selected Content List */}
      {content.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="content">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {content.map((item, index) => (
                  <Draggable key={`${item.type}-${item.id}`} draggableId={`${item.type}-${item.id}`} index={index}>
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

                        <div className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-full",
                          item.type === 'lesson' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                        )}>
                          {item.type === 'lesson' ? (
                            <Video className="w-4 h-4" />
                          ) : (
                            <ClipboardList className="w-4 h-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-luna-gray-900 truncate">
                            {item.type === 'lesson' ? item.title : item.name}
                          </p>
                          <p className="text-xs text-luna-gray-500">
                            {item.type === 'lesson' ? (
                              `${item.duration_minutes} min • Lesson`
                            ) : (
                              `${item.duration_minutes} min • ${item.number_of_questions} questions • Quiz`
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-luna-gray-600">Required</span>
                            <LunaSwitch
                              checked={item.is_required}
                              onCheckedChange={(checked) => {
                                const newContent = content.map((c) =>
                                  c.id === item.id && c.type === item.type ? { ...c, is_required: checked } : c
                                );
                                setContent(newContent);
                                onChange?.(newContent);
                              }}
                            />
                          </div>

                          <LunaButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveContent(item.id, item.type)}
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

      {content.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-luna-gray-200 rounded-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Video className="w-12 h-12 text-luna-gray-300" />
            <ClipboardList className="w-12 h-12 text-luna-gray-300" />
          </div>
          <p className="text-sm text-luna-gray-500">No content added yet</p>
          <p className="text-xs text-luna-gray-400">Add lessons and quizzes from the dropdown above</p>
        </div>
      )}
    </div>
  );
}


