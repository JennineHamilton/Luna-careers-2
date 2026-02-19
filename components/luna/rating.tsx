'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LunaRatingProps {
  /** Rating value (0-5) */
  value: number;
  /** Rating change handler */
  onChange?: (value: number) => void;
  /** Maximum rating */
  max?: number;
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Read-only mode */
  readOnly?: boolean;
  /** Show value label */
  showValue?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * LunaRating - Star rating component.
 *
 * @example
 * ```tsx
 * const [rating, setRating] = useState(4);
 * <LunaRating value={rating} onChange={setRating} showValue />
 * ```
 */
export function LunaRating({
  value,
  onChange,
  max = 5,
  size = 'md',
  readOnly = false,
  showValue = false,
  className,
}: LunaRatingProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = (rating: number) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readOnly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(null);
    }
  };

  const displayValue = hoverValue !== null ? hoverValue : value;

  return (
    <div
      data-slot="luna-rating"
      className={cn('flex items-center gap-1', className)}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }, (_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= displayValue;
          const isPartial = starValue === Math.ceil(displayValue) && displayValue % 1 !== 0;

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
              disabled={readOnly}
              className={cn(
                'transition-colors',
                !readOnly && 'cursor-pointer hover:scale-110',
                readOnly && 'cursor-default'
              )}
              aria-label={`Rate ${starValue} out of ${max}`}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  'transition-all',
                  isFilled && 'fill-luna-yellow text-luna-yellow',
                  !isFilled && 'fill-transparent text-luna-gray-300'
                )}
              />
            </button>
          );
        })}
      </div>

      {showValue && (
        <span className="text-sm font-medium text-luna-gray-900 ml-1">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

