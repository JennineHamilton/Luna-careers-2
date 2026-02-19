/**
 * LunaMultiTextInput Component
 * Allows users to add/remove multiple text items dynamically
 */

'use client';

import { useState } from 'react';
import { LunaInput } from './input';
import { LunaButton } from './button';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LunaMultiTextInputProps {
  label?: string;
  placeholder?: string;
  helperText?: string;
  value?: string[];
  onChange?: (values: string[]) => void;
  required?: boolean;
  className?: string;
  maxItems?: number;
  addButtonLabel?: string;
}

export function LunaMultiTextInput({
  label,
  placeholder = 'Enter text...',
  helperText,
  value = [],
  onChange,
  required = false,
  className,
  maxItems,
  addButtonLabel = 'Add Item',
}: LunaMultiTextInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [items, setItems] = useState<string[]>(value);

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    if (maxItems && items.length >= maxItems) return;

    const newItems = [...items, inputValue.trim()];
    setItems(newItems);
    onChange?.(newItems);
    setInputValue('');
  };

  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    onChange?.(newItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-luna-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input with Add Button */}
      <div className="flex gap-2">
        <LunaInput
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <LunaButton
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim() || (maxItems ? items.length >= maxItems : false)}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" />
          {addButtonLabel}
        </LunaButton>
      </div>

      {helperText && (
        <p className="text-xs text-luna-gray-600">{helperText}</p>
      )}

      {/* Items List */}
      {items.length > 0 && (
        <div className="space-y-2 mt-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-luna-gray-50 border border-luna-gray-200 rounded-lg group hover:border-luna-gray-300 transition-colors"
            >
              <span className="flex-1 text-sm text-luna-gray-900">{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-luna-gray-400 hover:text-red-600 transition-colors"
                aria-label="Remove item"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {maxItems && (
        <p className="text-xs text-luna-gray-500">
          {items.length} / {maxItems} items
        </p>
      )}
    </div>
  );
}

