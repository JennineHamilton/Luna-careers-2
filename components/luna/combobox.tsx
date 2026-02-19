'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LunaInput } from './input';
import { LunaBadge } from './badge';

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface LunaComboboxProps {
  /** Available options */
  options: ComboboxOption[];
  /** Selected values */
  value: string[];
  /** Value change handler */
  onChange: (value: string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Maximum selections */
  maxSelections?: number;
  /** Additional className */
  className?: string;
}

/**
 * LunaCombobox - Searchable multi-select component.
 *
 * @example
 * ```tsx
 * const [selected, setSelected] = useState<string[]>([]);
 * <LunaCombobox
 *   options={[
 *     { value: 'react', label: 'React' },
 *     { value: 'vue', label: 'Vue' }
 *   ]}
 *   value={selected}
 *   onChange={setSelected}
 *   label="Technologies"
 * />
 * ```
 */
export function LunaCombobox({
  options,
  value,
  onChange,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
  label,
  helperText,
  error,
  disabled = false,
  maxSelections,
  className,
}: LunaComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      if (maxSelections && value.length >= maxSelections) return;
      onChange([...value, optionValue]);
    }
  };

  const removeValue = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const selectedLabels = value
    .map((v) => options.find((opt) => opt.value === v)?.label)
    .filter(Boolean);

  return (
    <div data-slot="luna-combobox" className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-luna-gray-900 mb-1.5">
          {label}
        </label>
      )}

      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'inline-flex items-center justify-between gap-2 rounded-md transition-colors text-sm',
              'w-full font-normal min-h-[36px] px-3 py-2',
              'border border-luna-border-default bg-white hover:bg-luna-gray-50',
              'focus:outline-none focus:border-luna-blue focus:ring-2 focus:ring-luna-blue/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500'
            )}
          >
            <div className="flex flex-wrap gap-1.5 flex-1 items-center">
              {value.length === 0 ? (
                <span className="text-luna-gray-450">{placeholder}</span>
              ) : (
                selectedLabels.map((label, index) => (
                  <LunaBadge
                    key={index}
                    variant="default"
                    size="sm"
                    className="flex items-center gap-1 pl-2 pr-1"
                  >
                    <span className="text-xs">{label}</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        removeValue(value[index]);
                      }}
                      className="hover:bg-luna-gray-300 rounded-sm p-0.5 cursor-pointer transition-colors inline-flex items-center"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          removeValue(value[index]);
                        }
                      }}
                    >
                      <X className="w-3 h-3" />
                    </span>
                  </LunaBadge>
                ))
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            className="z-50 w-[var(--radix-popover-trigger-width)] bg-white rounded-lg border border-luna-gray-200 shadow-lg"
            style={{ maxHeight: 'var(--radix-popover-content-available-height)' }}
          >
            <div className="p-2 border-b border-luna-gray-100">
              <LunaInput
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div
              className="overflow-y-scroll overscroll-contain p-1"
              style={{
                maxHeight: '300px',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin'
              }}
              onWheel={(e) => {
                e.stopPropagation();
              }}
            >
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-luna-gray-450">
                  No results found.
                </div>
              ) : (
                <>
                  {/* Selected items first */}
                  {filteredOptions
                    .filter((option) => value.includes(option.value))
                    .map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleOption(option.value)}
                        className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md transition-colors hover:bg-luna-blue/5 bg-luna-blue/10"
                      >
                        <div className="flex items-center justify-center w-4 h-4 border rounded-sm bg-luna-blue border-luna-blue">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="flex-1 text-left font-medium text-luna-gray-900">
                          {option.label}
                        </span>
                      </button>
                    ))}

                  {/* Divider if there are selected items */}
                  {value.length > 0 && filteredOptions.some(opt => !value.includes(opt.value)) && (
                    <div className="my-1 border-t border-luna-gray-100" />
                  )}

                  {/* Unselected items */}
                  {filteredOptions
                    .filter((option) => !value.includes(option.value))
                    .map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleOption(option.value)}
                        className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md transition-colors hover:bg-luna-gray-50"
                      >
                        <div className="flex items-center justify-center w-4 h-4 border rounded-sm border-luna-gray-300">
                        </div>
                        <span className="flex-1 text-left text-luna-gray-700">
                          {option.label}
                        </span>
                      </button>
                    ))}
                </>
              )}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {helperText && !error && (
        <p className="mt-1.5 text-xs text-luna-gray-600">{helperText}</p>
      )}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

