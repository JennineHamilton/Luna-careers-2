/**
 * Luna Phone Input Component
 * International phone input with country code selector
 */

'use client';

import * as React from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';

export interface LunaPhoneInputProps {
  /** Label text displayed above the input */
  label?: string;
  /** Phone number value in E.164 format */
  value: string;
  /** Callback when phone number changes */
  onChange: (value: string | undefined) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Mark input as required (shows asterisk) */
  required?: boolean;
  /** Disable the input */
  disabled?: boolean;
  /** Error message (shows error state when present) */
  error?: string;
  /** Helper text displayed below the input */
  helperText?: string;
}

/**
 * LunaPhoneInput - International phone input with country code selector.
 *
 * @example
 * ```tsx
 * <LunaPhoneInput
 *   label="Phone Number"
 *   value={phone}
 *   onChange={setPhone}
 *   required
 * />
 * ```
 */
export function LunaPhoneInput({
  label,
  value,
  onChange,
  placeholder = 'Enter phone number',
  required = false,
  disabled = false,
  error,
  helperText,
}: LunaPhoneInputProps) {
  const inputId = React.useId();
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const hasError = !!error;

  return (
    <div data-slot="luna-phone-input-wrapper" className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-luna-gray-700 mb-1.5"
        >
          {label}
          {required && (
            <span className="text-luna-error ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      <PhoneInput
        id={inputId}
        international
        defaultCountry="US"
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={hasError}
        aria-describedby={
          [errorId, helperId].filter(Boolean).join(' ') || undefined
        }
        className={cn(
          'luna-phone-input',
          hasError && 'luna-phone-input-error',
          disabled && 'luna-phone-input-disabled'
        )}
      />
      {error && (
        <p
          id={errorId}
          className="text-sm text-luna-error mt-1.5"
          role="alert"
        >
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={helperId} className="text-sm text-luna-gray-500 mt-1.5">
          {helperText}
        </p>
      )}
      <style jsx global>{`
        .luna-phone-input {
          display: flex;
          align-items: stretch;
          gap: 0;
        }

        .luna-phone-input .PhoneInputCountry {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 12px;
          border: 1px solid #E4E7EC;
          border-right: none;
          border-radius: 6px 0 0 6px;
          background: white;
          cursor: pointer;
          transition: all 0.15s;
          position: relative;
        }

        .luna-phone-input .PhoneInputCountry:hover {
          border-color: #1449E8;
        }

        .luna-phone-input .PhoneInputCountryIcon {
          width: 20px;
          height: 14px;
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
        }

        .luna-phone-input .PhoneInputCountrySelectArrow {
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 5px solid #667085;
          opacity: 1;
          margin-left: 2px;
        }

        .luna-phone-input .PhoneInputInput {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #E4E7EC;
          border-radius: 0 6px 6px 0;
          background: white;
          color: #111827;
          font-size: 16px;
          line-height: 1.5;
          transition: all 0.15s;
        }

        .luna-phone-input .PhoneInputInput:focus {
          outline: none;
          border-color: #1449E8;
        }

        .luna-phone-input .PhoneInputCountry:has(+ .PhoneInputInput:focus) {
          border-color: #1449E8;
        }

        .luna-phone-input .PhoneInputInput::placeholder {
          color: #98A2B3;
        }

        .luna-phone-input-error .PhoneInputInput {
          border-color: #EF4444;
          color: #EF4444;
        }

        .luna-phone-input-error .PhoneInputCountry {
          border-color: #EF4444;
        }

        .luna-phone-input-error .PhoneInputInput:focus {
          border-color: #EF4444;
        }

        .luna-phone-input-error .PhoneInputCountry:has(+ .PhoneInputInput:focus) {
          border-color: #EF4444;
        }

        .luna-phone-input-disabled .PhoneInputInput {
          background: #F1F3F6;
          cursor: not-allowed;
          color: #98A2B3;
        }

        .luna-phone-input-disabled .PhoneInputCountry {
          background: #F1F3F6;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .PhoneInputCountrySelect {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

