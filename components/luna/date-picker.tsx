'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LunaButton } from './button';
import { LunaCalendar } from './calendar';

export interface LunaDatePickerProps {
  /** Selected date */
  value?: Date;
  /** Date change handler */
  onChange?: (date: Date | undefined) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Date format */
  dateFormat?: string;
  /** Additional className */
  className?: string;
}

/**
 * LunaDatePicker - Date picker with calendar popover.
 *
 * @example
 * ```tsx
 * const [date, setDate] = useState<Date>();
 * <LunaDatePicker
 *   value={date}
 *   onChange={setDate}
 *   placeholder="Select a date"
 * />
 * ```
 */
export function LunaDatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  dateFormat = 'PPP',
  className,
}: LunaDatePickerProps) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <LunaButton
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-luna-gray-450',
            className
          )}
          disabled={disabled}
          icon={<CalendarIcon className="w-4 h-4" />}
        >
          {value ? format(value, dateFormat) : placeholder}
        </LunaButton>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          className="z-50 w-auto p-0 bg-white rounded-lg border border-luna-gray-200 shadow-lg"
        >
          <LunaCalendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

