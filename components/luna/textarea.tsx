'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { LunaInputLabel, LunaInputError, LunaInputHelper } from './input';

export interface LunaTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label text displayed above the textarea */
  label?: string;
  /** Mark textarea as required (shows asterisk) */
  required?: boolean;
  /** Helper text displayed below the textarea */
  helperText?: string;
  /** Error message (shows error state when present) */
  error?: string;
  /** Number of visible text rows */
  rows?: number;
  /** Maximum character limit */
  maxLength?: number;
  /** Show character count below textarea */
  showCount?: boolean;
  /** Enable auto-resize based on content */
  autoResize?: boolean;
}

/**
 * LunaTextarea - A multiline text input with Luna styling.
 *
 * @example
 * ```tsx
 * <LunaTextarea
 *   label="Description"
 *   placeholder="Enter a description..."
 *   rows={4}
 *   maxLength={500}
 *   showCount
 * />
 * ```
 */
export function LunaTextarea({
  className,
  label,
  required,
  helperText,
  error,
  rows = 3,
  maxLength,
  showCount = false,
  autoResize = false,
  disabled,
  id,
  value,
  defaultValue,
  onChange,
  ...props
}: LunaTextareaProps) {
  const textareaId = id || React.useId();
  const errorId = error ? `${textareaId}-error` : undefined;
  const helperId = helperText ? `${textareaId}-helper` : undefined;
  const hasError = !!error;

  const [internalValue, setInternalValue] = React.useState(
    defaultValue?.toString() || ''
  );
  const currentValue = value !== undefined ? value.toString() : internalValue;
  const characterCount = currentValue.length;

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (value === undefined) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);

    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  React.useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [autoResize, currentValue]);

  return (
    <div data-slot="luna-textarea-wrapper" className="w-full">
      {label && (
        <LunaInputLabel htmlFor={textareaId} required={required}>
          {label}
        </LunaInputLabel>
      )}
      <textarea
        ref={textareaRef}
        id={textareaId}
        data-slot="luna-textarea"
        rows={autoResize ? 1 : rows}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={
          [errorId, helperId].filter(Boolean).join(' ') || undefined
        }
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        onChange={handleChange}
        className={cn(
          'w-full rounded-md px-3 py-2 text-sm transition-colors resize-y',
          'border border-luna-border-default bg-white',
          'placeholder:text-luna-gray-400',
          'focus:outline-none focus:border-luna-blue focus-visible:ring-2 focus-visible:ring-luna-blue/20',
          hasError &&
            'border-luna-error text-luna-error focus:border-luna-error',
          disabled && 'bg-luna-gray-100 cursor-not-allowed text-luna-gray-400 resize-none',
          autoResize && 'resize-none overflow-hidden',
          className
        )}
        {...props}
      />
      <div className="flex justify-between items-center mt-1.5">
        <div>
          {error && <LunaInputError id={errorId}>{error}</LunaInputError>}
          {helperText && !error && (
            <LunaInputHelper id={helperId}>{helperText}</LunaInputHelper>
          )}
        </div>
        {showCount && (
          <span
            className={cn(
              'text-sm text-luna-gray-500',
              maxLength && characterCount >= maxLength && 'text-luna-error'
            )}
          >
            {characterCount}
            {maxLength && `/${maxLength}`}
          </span>
        )}
      </div>
    </div>
  );
}

