'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import 'react-day-picker/dist/style.css';

export type LunaCalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * LunaCalendar - Calendar component for date selection.
 *
 * @example
 * ```tsx
 * const [date, setDate] = useState<Date>();
 * <LunaCalendar mode="single" selected={date} onSelect={setDate} />
 * ```
 */
export function LunaCalendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: LunaCalendarProps) {
  return (
    <DayPicker
      data-slot="luna-calendar"
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium text-luna-gray-900',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md hover:bg-luna-gray-100 transition-colors'
        ),
        nav_button_previous: 'absolute left-1',
        nav_button_next: 'absolute right-1',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-luna-gray-600 rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: cn(
          'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-luna-gray-50',
          props.mode === 'range'
            ? '[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md'
            : '[&:has([aria-selected])]:rounded-md'
        ),
        day: cn(
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-luna-gray-100 rounded-md transition-colors inline-flex items-center justify-center'
        ),
        day_range_start: 'day-range-start',
        day_range_end: 'day-range-end',
        day_selected: cn(
          'bg-luna-blue text-white hover:bg-luna-blue hover:text-white focus:bg-luna-blue focus:text-white'
        ),
        day_today: 'bg-luna-gray-100 text-luna-gray-900',
        day_outside: 'text-luna-gray-400 opacity-50',
        day_disabled: 'text-luna-gray-400 opacity-50',
        day_range_middle: 'aria-selected:bg-luna-gray-50 aria-selected:text-luna-gray-900',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}

