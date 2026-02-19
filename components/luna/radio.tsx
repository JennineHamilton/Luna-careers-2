'use client';

import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '@/lib/utils';
import { LunaInputLabel, LunaInputError } from './input';

export interface LunaRadioGroupProps
  extends React.ComponentProps<typeof RadioGroupPrimitive.Root> {
  /** Label for the radio group */
  label?: string;
  /** Error message for the group */
  error?: string;
  /** Mark as required */
  required?: boolean;
}

/**
 * LunaRadioGroup - A wrapper for radio button options.
 *
 * @example
 * ```tsx
 * <LunaRadioGroup label="Select an option" defaultValue="option1">
 *   <LunaRadio value="option1" label="Option 1" />
 *   <LunaRadio value="option2" label="Option 2" description="With description" />
 * </LunaRadioGroup>
 * ```
 */
export function LunaRadioGroup({
  className,
  label,
  error,
  required,
  children,
  ...props
}: LunaRadioGroupProps) {
  const groupId = React.useId();

  return (
    <div data-slot="luna-radio-group-wrapper" className="w-full">
      {label && (
        <LunaInputLabel htmlFor={groupId} required={required}>
          {label}
        </LunaInputLabel>
      )}
      <RadioGroupPrimitive.Root
        id={groupId}
        data-slot="luna-radio-group"
        className={cn('grid gap-3', className)}
        {...props}
      >
        {children}
      </RadioGroupPrimitive.Root>
      {error && <LunaInputError>{error}</LunaInputError>}
    </div>
  );
}

export interface LunaRadioProps
  extends React.ComponentProps<typeof RadioGroupPrimitive.Item> {
  /** Label text displayed next to the radio */
  label?: string;
  /** Small description text below the label */
  description?: string;
}

/**
 * LunaRadio - A single radio button item.
 */
export function LunaRadio({
  className,
  label,
  description,
  id,
  disabled,
  ...props
}: LunaRadioProps) {
  const radioId = id || React.useId();

  return (
    <div data-slot="luna-radio-wrapper" className="flex items-start gap-2">
      <RadioGroupPrimitive.Item
        id={radioId}
        data-slot="luna-radio"
        disabled={disabled}
        className={cn(
          'peer h-4 w-4 shrink-0 rounded-full border-2 transition-colors',
          'border-luna-gray-300 bg-white',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luna-blue focus-visible:ring-offset-2',
          'disabled:bg-luna-gray-100 disabled:border-luna-gray-300 disabled:cursor-not-allowed',
          'data-[state=checked]:border-luna-blue',
          className
        )}
        {...props}
      >
        <RadioGroupPrimitive.Indicator
          data-slot="luna-radio-indicator"
          className="flex items-center justify-center"
        >
          <span className="h-2 w-2 rounded-full bg-luna-blue" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <label
              htmlFor={radioId}
              className={cn(
                'text-sm font-medium text-luna-gray-900 cursor-pointer',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p
              className={cn(
                'text-sm text-luna-gray-500',
                disabled && 'opacity-50'
              )}
            >
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

