'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { format, addMonths } from 'date-fns';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LunaButton } from './button';
import { DayPicker } from 'react-day-picker';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface LunaDateRangePickerProps {
  /** Selected date range */
  value?: DateRange;
  /** Date range change handler */
  onChange?: (range: DateRange | undefined) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * LunaDateRangePicker - Modern date range picker with calendar popover.
 */
export function LunaDateRangePicker({
  value,
  onChange,
  placeholder = 'Pick a date range',
  disabled = false,
  className,
}: LunaDateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(value);

  React.useEffect(() => {
    setTempRange(value);
  }, [value]);

  const handleSelect = (range: any) => {
    setTempRange(range);
  };

  const handleApply = () => {
    onChange?.(tempRange);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempRange(undefined);
    onChange?.(undefined);
  };

  const formatDateRange = () => {
    if (!value?.from) return null;
    if (!value.to) return format(value.from, 'MMM d, yyyy');
    return `${format(value.from, 'MMM d')} - ${format(value.to, 'MMM d, yyyy')}`;
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <LunaButton
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn(
            'h-9 justify-start text-left font-normal text-sm',
            'border-luna-border-default text-luna-gray-900 hover:bg-luna-gray-50 hover:text-luna-gray-900',
            !value?.from && 'text-luna-gray-450',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{formatDateRange() || placeholder}</span>
          {value?.from && (
            <X
              className="ml-auto h-4 w-4 opacity-50 hover:opacity-100 flex-shrink-0"
              onClick={handleClear}
            />
          )}
        </LunaButton>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          className="z-50 w-auto rounded-lg border border-luna-border-default bg-white p-3 shadow-lg outline-none"
          sideOffset={4}
        >
          <DayPicker
            mode="range"
            selected={tempRange}
            onSelect={handleSelect}
            numberOfMonths={2}
            showOutsideDays={false}
            className="p-0"
            classNames={{
              months: 'flex gap-6',
              month: 'space-y-4',
              caption: 'flex justify-center relative items-center h-10 mb-2',
              caption_label: 'text-sm font-semibold text-luna-gray-900',
              nav: 'flex items-center gap-1',
              nav_button: cn(
                'h-8 w-8 bg-transparent p-0 hover:bg-luna-gray-100 inline-flex items-center justify-center rounded-md transition-colors'
              ),
              nav_button_previous: 'absolute left-0',
              nav_button_next: 'absolute right-0',
              table: 'w-full border-collapse border-spacing-0',
              head_row: 'flex w-full',
              head_cell: 'text-luna-gray-600 w-9 h-9 font-medium text-xs flex items-center justify-center',
              row: 'flex w-full mt-0.5',
              cell: cn(
                'relative p-0 text-center text-sm w-9 h-9',
                'focus-within:relative focus-within:z-20'
              ),
              day: cn(
                'h-9 w-9 p-0 font-normal rounded-md transition-colors text-sm',
                'hover:bg-luna-gray-100',
                'inline-flex items-center justify-center'
              ),
              day_range_start: 'bg-luna-blue text-white hover:bg-luna-blue hover:text-white',
              day_range_end: 'bg-luna-blue text-white hover:bg-luna-blue hover:text-white',
              day_selected: 'bg-luna-blue text-white hover:bg-luna-blue hover:text-white',
              day_today: 'bg-luna-gray-100 font-semibold',
              day_outside: 'text-luna-gray-300 opacity-50',
              day_disabled: 'text-luna-gray-300 opacity-50',
              day_range_middle: 'bg-luna-blue/10 text-luna-gray-900 rounded-none',
              day_hidden: 'invisible',
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === 'left' ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                ),
            }}
          />
          <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-luna-border-default">
            <div className="text-xs text-luna-gray-600">
              {tempRange?.from && tempRange?.to
                ? `${format(tempRange.from, 'MMM d')} - ${format(tempRange.to, 'MMM d, yyyy')}`
                : tempRange?.from
                ? `From: ${format(tempRange.from, 'MMM d, yyyy')}`
                : 'Select date range'}
            </div>
            <div className="flex gap-2">
              <LunaButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTempRange(value);
                  setOpen(false);
                }}
                className="h-8 text-xs"
              >
                Cancel
              </LunaButton>
              <LunaButton
                variant="primary"
                size="sm"
                onClick={handleApply}
                disabled={!tempRange?.from || !tempRange?.to}
                className="h-8 text-xs"
              >
                Apply
              </LunaButton>
            </div>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

