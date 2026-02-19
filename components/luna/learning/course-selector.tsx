/**
 * LunaCourseSelector Component
 * Multi-select dropdown with drag-and-drop reordering for Courses
 */

'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { LunaSearchableSelect } from '@/components/luna/searchable-select';
import { LunaButton } from '@/components/luna/button';
import { GripVertical, X, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Course {
  id: string;
  title: string;
  duration_minutes?: number;
}

export interface SelectedCourse extends Course {
  sort_order: number;
  is_required: boolean;
}

export interface LunaCourseSelectorProps {
  availableCourses: Course[];
  selectedCourses?: SelectedCourse[];
  onChange?: (Courses: SelectedCourse[]) => void;
  label?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

export function LunaCourseSelector({
  availableCourses,
  selectedCourses = [],
  onChange,
  label = 'Courses',
  helperText,
  required = false,
  className,
}: LunaCourseSelectorProps) {
  const [Courses, setCourses] = useState<SelectedCourse[]>(selectedCourses);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  useEffect(() => {
    setCourses(selectedCourses);
  }, [selectedCourses]);

  const handleAddCourse = () => {
    if (!selectedCourseId) return;

    const Course = availableCourses.find((l) => l.id === selectedCourseId);
    if (!Course) return;

    // Check if already added
    if (Courses.some((l) => l.id === Course.id)) {
      setSelectedCourseId('');
      return;
    }

    const newCourse: SelectedCourse = {
      ...Course,
      sort_order: Courses.length,
      is_required: true,
    };

    const newCourses = [...Courses, newCourse];
    setCourses(newCourses);
    onChange?.(newCourses);
    setSelectedCourseId('');
  };

  const handleRemoveCourse = (CourseId: string) => {
    const newCourses = Courses
      .filter((l) => l.id !== CourseId)
      .map((l, index) => ({ ...l, sort_order: index }));
    setCourses(newCourses);
    onChange?.(newCourses);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(Courses);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort_order
    const reorderedCourses = items.map((item, index) => ({
      ...item,
      sort_order: index,
    }));

    setCourses(reorderedCourses);
    onChange?.(reorderedCourses);
  };

  // Filter out already selected Courses
  const availableOptions = availableCourses
    .filter((Course) => !Courses.some((l) => l.id === Course.id))
    .map((Course) => ({
      value: Course.id,
      label: Course.title,
    }));

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="block text-sm font-medium text-luna-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Add Course Dropdown */}
      <div className="flex gap-2">
        <div className="flex-1">
          <LunaSearchableSelect
            placeholder="Select a Course to add..."
            options={availableOptions}
            value={selectedCourseId}
            onValueChange={setSelectedCourseId}
          />
        </div>
        <LunaButton
          type="button"
          onClick={handleAddCourse}
          disabled={!selectedCourseId}
          size="sm"
        >
          Add Course
        </LunaButton>
      </div>

      {helperText && (
        <p className="text-xs text-luna-gray-600">{helperText}</p>
      )}

      {/* Selected Courses with Drag & Drop */}
      {Courses.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-luna-gray-700 mb-2">
            Selected Courses ({Courses.length})
          </p>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="Courses">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {Courses.map((Course, index) => (
                    <Draggable key={Course.id} draggableId={Course.id} index={index}>
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

                          {/* Course Icon */}
                          <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                            <GraduationCap className="w-4 h-4 text-cyan-600" />
                          </div>

                          {/* Course Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-luna-gray-900 truncate">
                              {Course.title}
                            </p>
                            {Course.duration_minutes && (
                              <p className="text-xs text-luna-gray-600">
                                {Course.duration_minutes} minutes
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
                            onClick={() => handleRemoveCourse(Course.id)}
                            className="shrink-0 w-8 h-8 flex items-center justify-center rounded hover:bg-red-50 text-luna-gray-400 hover:text-red-600 transition-colors"
                            aria-label="Remove Course"
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


