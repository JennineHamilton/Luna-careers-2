'use client';

import * as React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LunaCard, LunaCardContent } from './card';
import { LunaBadge } from './badge';

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  badge?: {
    label: string;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'yellow';
  };
  metadata?: Array<{ label: string; value: string }>;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
  color?: string;
}

export interface LunaKanbanBoardProps {
  /** Kanban columns */
  columns: KanbanColumn[];
  /** Drag end handler */
  onDragEnd: (result: DropResult) => void;
  /** Card click handler */
  onCardClick?: (card: KanbanCard) => void;
  /** Card menu handler */
  onCardMenu?: (card: KanbanCard) => void;
  /** Additional class name */
  className?: string;
}

/**
 * LunaKanbanBoard - Kanban board for application tracking and workflow management.
 *
 * @example
 * ```tsx
 * <LunaKanbanBoard
 *   columns={[
 *     {
 *       id: 'applied',
 *       title: 'Applied',
 *       cards: [
 *         { id: '1', title: 'Software Engineer at Tech Co', badge: { label: 'Remote' } }
 *       ]
 *     }
 *   ]}
 *   onDragEnd={handleDragEnd}
 *   onCardClick={handleCardClick}
 * />
 * ```
 */
export function LunaKanbanBoard({
  columns,
  onDragEnd,
  onCardClick,
  onCardMenu,
  className,
}: LunaKanbanBoardProps) {
  return (
    <div className={cn('overflow-x-auto', className)} data-slot="luna-kanban-board">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 min-h-[500px]">
          {columns.map((column) => (
            <div key={column.id} className="flex-shrink-0 w-80">
              {/* Column Header */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-luna-gray-900 flex items-center gap-2">
                    {column.color && (
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: column.color }}
                      />
                    )}
                    {column.title}
                    <span className="text-luna-gray-450 font-normal">
                      ({column.cards.length})
                    </span>
                  </h3>
                </div>
              </div>

              {/* Droppable Column */}
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'bg-luna-gray-50 rounded-lg p-3 min-h-[400px] transition-colors',
                      snapshot.isDraggingOver && 'bg-luna-gray-100'
                    )}
                  >
                    <div className="space-y-3">
                      {column.cards.map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <LunaCard
                                className={cn(
                                  'cursor-pointer transition-shadow hover:shadow-md',
                                  snapshot.isDragging && 'shadow-lg rotate-2'
                                )}
                                onClick={() => onCardClick?.(card)}
                              >
                                <LunaCardContent className="p-4">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <h4 className="text-sm font-medium text-luna-gray-900 flex-1">
                                      {card.title}
                                    </h4>
                                    {onCardMenu && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onCardMenu(card);
                                        }}
                                        className="p-1 hover:bg-luna-gray-100 rounded transition-colors"
                                      >
                                        <MoreVertical className="w-4 h-4 text-luna-gray-600" />
                                      </button>
                                    )}
                                  </div>

                                  {card.description && (
                                    <p className="text-xs text-luna-gray-600 mb-3 line-clamp-2">
                                      {card.description}
                                    </p>
                                  )}

                                  {card.badge && (
                                    <div className="mb-3">
                                      <LunaBadge variant={card.badge.variant || 'default'}>
                                        {card.badge.label}
                                      </LunaBadge>
                                    </div>
                                  )}

                                  {card.metadata && card.metadata.length > 0 && (
                                    <div className="space-y-1">
                                      {card.metadata.map((meta, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between text-xs"
                                        >
                                          <span className="text-luna-gray-600">{meta.label}</span>
                                          <span className="text-luna-gray-900 font-medium">
                                            {meta.value}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </LunaCardContent>
                              </LunaCard>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

