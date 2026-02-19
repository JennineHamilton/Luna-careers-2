'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LunaInputLabel, LunaInputError, LunaInputHelper } from './input';
import { LunaButton } from './button';
import {
  LunaDropdownMenu,
  LunaDropdownMenuTrigger,
  LunaDropdownMenuContent,
} from './dropdown-menu';

export interface SearchableSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface LunaSearchableSelectProps {
  /** Label text displayed above the select */
  label?: string;
  /** Mark select as required (shows asterisk) */
  required?: boolean;
  /** Error message (shows error state when present) */
  error?: string;
  /** Helper text displayed below the select */
  helperText?: string;
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Additional className for the trigger */
  className?: string;
  /** The options to display */
  options: SearchableSelectOption[];
  /** The selected value */
  value?: string;
  /** Callback when value changes */
  onValueChange?: (value: string) => void;
  /** Empty state message when no results found */
  emptyMessage?: string;
}

/**
 * LunaSearchableSelect - A searchable select dropdown with autocomplete.
 *
 * @example
 * ```tsx
 * <LunaSearchableSelect
 *   label="Country"
 *   placeholder="Select a country"
 *   options={[
 *     { value: 'us', label: 'United States' },
 *     { value: 'uk', label: 'United Kingdom' },
 *   ]}
 *   value={selectedCountry}
 *   onValueChange={setSelectedCountry}
 * />
 * ```
 */
export function LunaSearchableSelect({
  label,
  required,
  error,
  helperText,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  disabled,
  className,
  options,
  value,
  onValueChange,
  emptyMessage = 'No results found',
}: LunaSearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const selectId = React.useId();
  const hasError = !!error;

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const handleSelect = (optionValue: string) => {
    onValueChange?.(optionValue);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <div data-slot="luna-searchable-select-wrapper" className="w-full">
      {label && (
        <LunaInputLabel htmlFor={selectId} required={required}>
          {label}
        </LunaInputLabel>
      )}
      <LunaDropdownMenu open={open} onOpenChange={setOpen}>
        <LunaDropdownMenuTrigger asChild>
          <button
            id={selectId}
            type="button"
            disabled={disabled}
            aria-invalid={hasError}
            className={cn(
              'flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-base text-left',
              'bg-white border-luna-border-default',
              'focus:outline-none focus:border-luna-blue',
              'disabled:bg-luna-gray-100 disabled:cursor-not-allowed disabled:text-luna-gray-400',
              hasError && 'border-luna-error focus:border-luna-error',
              !selectedOption && 'text-luna-gray-400',
              className
            )}
          >
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronsUpDown className="h-4 w-4 text-luna-gray-500 flex-shrink-0" />
          </button>
        </LunaDropdownMenuTrigger>
        <LunaDropdownMenuContent
          className="w-[var(--radix-dropdown-menu-trigger-width)] p-0"
          align="start"
        >
          <div className="p-2 border-b border-luna-border-default">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-luna-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-luna-border-default focus:outline-none focus:border-luna-blue"
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-luna-gray-500">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'relative flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none select-none text-left',
                    'hover:bg-luna-gray-100 focus:bg-luna-gray-100',
                    value === option.value && 'bg-luna-blue/10 text-luna-blue font-medium',
                    option.disabled && 'pointer-events-none opacity-50'
                  )}
                >
                  <span className="flex-1 truncate">{option.label}</span>
                  {value === option.value && (
                    <Check className="h-4 w-4 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </LunaDropdownMenuContent>
      </LunaDropdownMenu>
      {error && <LunaInputError>{error}</LunaInputError>}
      {helperText && !error && <LunaInputHelper>{helperText}</LunaInputHelper>}
    </div>
  );
}

