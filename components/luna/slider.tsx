'use client';

import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

export interface LunaSliderProps extends React.ComponentProps<typeof SliderPrimitive.Root> {
  /** Show value label */
  showValue?: boolean;
  /** Value formatter */
  formatValue?: (value: number) => string;
  /** Label */
  label?: string;
}

/**
 * LunaSlider - Range slider component.
 *
 * @example
 * ```tsx
 * const [value, setValue] = useState([50]);
 * <LunaSlider
 *   value={value}
 *   onValueChange={setValue}
 *   min={0}
 *   max={100}
 *   step={1}
 *   showValue
 * />
 * ```
 */
export function LunaSlider({
  className,
  showValue = false,
  formatValue,
  label,
  ...props
}: LunaSliderProps) {
  const value = props.value || props.defaultValue || [0];
  const displayValue = formatValue ? formatValue(value[0]) : value[0];

  return (
    <div data-slot="luna-slider" className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && <label className="text-sm font-medium text-luna-gray-900">{label}</label>}
          {showValue && <span className="text-sm text-luna-gray-600">{displayValue}</span>}
        </div>
      )}

      <SliderPrimitive.Root
        className={cn(
          'relative flex w-full touch-none select-none items-center',
          props.disabled && 'opacity-50 cursor-not-allowed'
        )}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-luna-gray-200">
          <SliderPrimitive.Range className="absolute h-full bg-luna-blue" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-luna-blue bg-white shadow transition-colors focus:outline-none focus:ring-2 focus:ring-luna-blue focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      </SliderPrimitive.Root>
    </div>
  );
}

