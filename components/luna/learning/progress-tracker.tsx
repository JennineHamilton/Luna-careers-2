'use client';

/**
 * Progress Tracker Component
 * Displays detailed progress through content hierarchy
 */

import { LunaCard, LunaProgress, LunaBadge } from '@/components/luna';
import { CheckCircle2, Circle, Lock } from 'lucide-react';

export interface ProgressItem {
  id: string;
  title: string;
  type: 'lesson' | 'module' | 'course';
  progress: number;
  isCompleted: boolean;
  isLocked: boolean;
  children?: ProgressItem[];
}

export interface ProgressTrackerProps {
  items: ProgressItem[];
  onItemClick?: (item: ProgressItem) => void;
}

export function ProgressTracker({ items, onItemClick }: ProgressTrackerProps) {
  const renderItem = (item: ProgressItem, level: number = 0) => {
    const Icon = item.isCompleted ? CheckCircle2 : item.isLocked ? Lock : Circle;
    const iconColor = item.isCompleted
      ? 'text-green-600'
      : item.isLocked
      ? 'text-gray-400'
      : 'text-blue-600';

    return (
      <div key={item.id} className="space-y-2">
        <div
          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
            item.isLocked
              ? 'bg-gray-50 cursor-not-allowed'
              : 'bg-white hover:bg-luna-gray-50 cursor-pointer'
          }`}
          style={{ marginLeft: `${level * 24}px` }}
          onClick={() => !item.isLocked && onItemClick?.(item)}
        >
          <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-medium text-sm truncate ${item.isLocked ? 'text-gray-400' : ''}`}>
                {item.title}
              </h4>
              <LunaBadge variant="default" className="text-xs">
                {item.type}
              </LunaBadge>
            </div>
            
            {!item.isLocked && (
              <div className="flex items-center gap-2">
                <LunaProgress value={item.progress} className="h-1.5 flex-1" />
                <span className="text-xs text-gray-600 whitespace-nowrap">
                  {item.progress}%
                </span>
              </div>
            )}
          </div>

          {item.isCompleted && (
            <LunaBadge variant="success" className="text-xs">
              Complete
            </LunaBadge>
          )}
        </div>

        {item.children && item.children.length > 0 && (
          <div className="space-y-2">
            {item.children.map((child) => renderItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <LunaCard className="p-4">
      <h3 className="font-semibold text-lg mb-4">Your Progress</h3>
      <div className="space-y-2">
        {items.map((item) => renderItem(item))}
      </div>
    </LunaCard>
  );
}

