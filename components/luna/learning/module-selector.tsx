/**
 * LunaModuleSelector Component
 * Multi-select dropdown with drag-and-drop reordering for Modules
 */

'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { LunaSearchableSelect } from '@/components/luna/searchable-select';
import { LunaButton } from '@/components/luna/button';
import { GripVertical, X, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Module {
  id: string;
  title: string;
  duration_minutes?: number;
}

export interface SelectedModule extends Module {
  sort_order: number;
  is_required: boolean;
}

export interface LunaModuleSelectorProps {
  availableModules: Module[];
  selectedModules?: SelectedModule[];
  onChange?: (Modules: SelectedModule[]) => void;
  label?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

export function LunaModuleSelector({
  availableModules,
  selectedModules = [],
  onChange,
  label = 'Modules',
  helperText,
  required = false,
  className,
}: LunaModuleSelectorProps) {
  const [Modules, setModules] = useState<SelectedModule[]>(selectedModules);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');

  useEffect(() => {
    setModules(selectedModules);
  }, [selectedModules]);

  const handleAddModule = () => {
    if (!selectedModuleId) return;

    const Module = availableModules.find((l) => l.id === selectedModuleId);
    if (!Module) return;

    // Check if already added
    if (Modules.some((l) => l.id === Module.id)) {
      setSelectedModuleId('');
      return;
    }

    const newModule: SelectedModule = {
      ...Module,
      sort_order: Modules.length,
      is_required: true,
    };

    const newModules = [...Modules, newModule];
    setModules(newModules);
    onChange?.(newModules);
    setSelectedModuleId('');
  };

  const handleRemoveModule = (ModuleId: string) => {
    const newModules = Modules
      .filter((l) => l.id !== ModuleId)
      .map((l, index) => ({ ...l, sort_order: index }));
    setModules(newModules);
    onChange?.(newModules);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(Modules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update sort_order
    const reorderedModules = items.map((item, index) => ({
      ...item,
      sort_order: index,
    }));

    setModules(reorderedModules);
    onChange?.(reorderedModules);
  };

  // Filter out already selected Modules
  const availableOptions = availableModules
    .filter((Module) => !Modules.some((l) => l.id === Module.id))
    .map((Module) => ({
      value: Module.id,
      label: Module.title,
    }));

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="block text-sm font-medium text-luna-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Add Module Dropdown */}
      <div className="flex gap-2">
        <div className="flex-1">
          <LunaSearchableSelect
            placeholder="Select a Module to add..."
            options={availableOptions}
            value={selectedModuleId}
            onValueChange={setSelectedModuleId}
          />
        </div>
        <LunaButton
          type="button"
          onClick={handleAddModule}
          disabled={!selectedModuleId}
          size="sm"
        >
          Add Module
        </LunaButton>
      </div>

      {helperText && (
        <p className="text-xs text-luna-gray-600">{helperText}</p>
      )}

      {/* Selected Modules with Drag & Drop */}
      {Modules.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-luna-gray-700 mb-2">
            Selected Modules ({Modules.length})
          </p>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="Modules">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {Modules.map((Module, index) => (
                    <Draggable key={Module.id} draggableId={Module.id} index={index}>
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

                          {/* Module Icon */}
                          <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4 text-cyan-600" />
                          </div>

                          {/* Module Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-luna-gray-900 truncate">
                              {Module.title}
                            </p>
                            {Module.duration_minutes && (
                              <p className="text-xs text-luna-gray-600">
                                {Module.duration_minutes} minutes
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
                            onClick={() => handleRemoveModule(Module.id)}
                            className="shrink-0 w-8 h-8 flex items-center justify-center rounded hover:bg-red-50 text-luna-gray-400 hover:text-red-600 transition-colors"
                            aria-label="Remove Module"
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

