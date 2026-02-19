'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LunaBadge } from './badge';

export interface LunaTagInputProps {
  /** Array of tags */
  value: string[];
  /** Tag change handler */
  onChange: (tags: string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Label */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Maximum number of tags */
  maxTags?: number;
  /** Additional className */
  className?: string;
}

/**
 * LunaTagInput - Tag input component for skills, interests, etc.
 *
 * @example
 * ```tsx
 * const [tags, setTags] = useState(['React', 'TypeScript']);
 * <LunaTagInput
 *   value={tags}
 *   onChange={setTags}
 *   label="Skills"
 *   placeholder="Add a skill..."
 * />
 * ```
 */
export function LunaTagInput({
  value,
  onChange,
  placeholder = 'Add tag...',
  label,
  helperText,
  error,
  disabled = false,
  maxTags,
  className,
}: LunaTagInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const addTag = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue === '') return;
    if (value.includes(trimmedValue)) {
      setInputValue('');
      return;
    }
    if (maxTags && value.length >= maxTags) return;

    onChange([...value, trimmedValue]);
    setInputValue('');
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div data-slot="luna-tag-input" className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-luna-gray-900 mb-1.5">
          {label}
        </label>
      )}

      <div
        onClick={handleContainerClick}
        className={cn(
          'flex flex-wrap gap-2 min-h-[42px] w-full rounded-md border px-3 py-2 text-sm transition-colors',
          'focus-within:border-luna-blue',
          error ? 'border-red-500' : 'border-luna-gray-300',
          disabled && 'opacity-50 cursor-not-allowed bg-luna-gray-50',
          'cursor-text'
        )}
      >
        {value.map((tag, index) => (
          <LunaBadge
            key={index}
            variant="default"
            className="flex items-center gap-1 pl-2 pr-1 py-0.5"
          >
            <span>{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(index);
                }}
                className="hover:bg-luna-gray-300 rounded-sm p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </LunaBadge>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          disabled={disabled || (maxTags !== undefined && value.length >= maxTags)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none bg-transparent placeholder:text-luna-gray-450 disabled:cursor-not-allowed"
        />
      </div>

      {helperText && !error && (
        <p className="mt-1.5 text-xs text-luna-gray-600">{helperText}</p>
      )}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

