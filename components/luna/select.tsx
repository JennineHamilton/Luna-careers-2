'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LunaInputLabel, LunaInputError, LunaInputHelper } from './input';

export interface LunaSelectProps
  extends React.ComponentProps<typeof SelectPrimitive.Root> {
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
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Additional className for the trigger */
  className?: string;
  /** The children (LunaSelectItem components) */
  children?: React.ReactNode;
}

/**
 * LunaSelect - A select dropdown with Luna styling.
 *
 * @example
 * ```tsx
 * <LunaSelect label="Country" placeholder="Select a country">
 *   <LunaSelectItem value="us">United States</LunaSelectItem>
 *   <LunaSelectItem value="uk">United Kingdom</LunaSelectItem>
 * </LunaSelect>
 * ```
 */
export function LunaSelect({
  label,
  required,
  error,
  helperText,
  placeholder,
  disabled,
  className,
  children,
  ...props
}: LunaSelectProps) {
  const selectId = React.useId();
  const hasError = !!error;

  return (
    <div data-slot="luna-select-wrapper" className="w-full">
      {label && (
        <LunaInputLabel htmlFor={selectId} required={required}>
          {label}
        </LunaInputLabel>
      )}
      <SelectPrimitive.Root disabled={disabled} {...props}>
        <SelectPrimitive.Trigger
          id={selectId}
          data-slot="luna-select-trigger"
          aria-invalid={hasError}
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-base',
            'bg-white border-luna-border-default',
            'placeholder:text-luna-gray-400',
            'focus:outline-none focus:border-luna-blue focus-visible:ring-2 focus-visible:ring-luna-blue/20',
            'disabled:bg-luna-gray-100 disabled:cursor-not-allowed disabled:text-luna-gray-400',
            hasError && 'border-luna-error focus:border-luna-error',
            className
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDownIcon className="h-4 w-4 text-luna-gray-500" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            data-slot="luna-select-content"
            className="bg-white border border-luna-border-default shadow-lg rounded-md z-50 overflow-hidden w-[var(--radix-select-trigger-width)]"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1">
              <ChevronUpIcon className="h-4 w-4 text-luna-gray-500" />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport className="p-1">
              {children}
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1">
              <ChevronDownIcon className="h-4 w-4 text-luna-gray-500" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error && <LunaInputError>{error}</LunaInputError>}
      {helperText && !error && <LunaInputHelper>{helperText}</LunaInputHelper>}
    </div>
  );
}

export interface LunaSelectItemProps
  extends React.ComponentProps<typeof SelectPrimitive.Item> {}

/**
 * LunaSelectItem - An option in a LunaSelect dropdown.
 */
export function LunaSelectItem({
  className,
  children,
  ...props
}: LunaSelectItemProps) {
  return (
    <SelectPrimitive.Item
      data-slot="luna-select-item"
      className={cn(
        'relative flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none select-none',
        'hover:bg-luna-gray-100 focus:bg-luna-gray-100',
        'data-[state=checked]:bg-luna-blue/10 data-[state=checked]:text-luna-blue data-[state=checked]:font-medium',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex h-4 w-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

export interface LunaSelectGroupProps
  extends React.ComponentProps<typeof SelectPrimitive.Group> {}

/**
 * LunaSelectGroup - A group of select items with an optional label.
 */
export function LunaSelectGroup(props: LunaSelectGroupProps) {
  return <SelectPrimitive.Group data-slot="luna-select-group" {...props} />;
}

export interface LunaSelectLabelProps
  extends React.ComponentProps<typeof SelectPrimitive.Label> {}

/**
 * LunaSelectLabel - A label for a LunaSelectGroup.
 */
export function LunaSelectLabel({
  className,
  ...props
}: LunaSelectLabelProps) {
  return (
    <SelectPrimitive.Label
      data-slot="luna-select-label"
      className={cn('px-3 py-1.5 text-xs text-luna-gray-500 font-medium', className)}
      {...props}
    />
  );
}

