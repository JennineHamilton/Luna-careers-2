'use client';

import * as React from 'react';
import { Eye, EyeOff, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Country } from 'country-state-city';

// Get all country codes with flags from country-state-city library
const getAllCountryCodes = () => {
  const countries = Country.getAllCountries();
  return countries
    .map((country) => ({
      code: `+${country.phonecode}`,
      country: country.name,
      isoCode: country.isoCode,
      flag: country.flag,
    }))
    .filter((c) => c.code !== '+') // Remove countries without phone codes
    .sort((a, b) => a.country.localeCompare(b.country)); // Sort alphabetically
};

const COUNTRY_CODES = getAllCountryCodes();

export interface LunaInputLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

/**
 * LunaInputLabel - Standalone label for form inputs.
 */
export function LunaInputLabel({
  className,
  required,
  children,
  ...props
}: LunaInputLabelProps) {
  return (
    <label
      data-slot="luna-input-label"
      className={cn(
        'block text-sm font-medium text-luna-gray-700 mb-1.5',
        className
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-luna-error ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

export interface LunaInputErrorProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

/**
 * LunaInputError - Error message display for form inputs.
 */
export function LunaInputError({
  className,
  children,
  ...props
}: LunaInputErrorProps) {
  if (!children) return null;
  return (
    <p
      data-slot="luna-input-error"
      className={cn('text-sm text-luna-error mt-1.5', className)}
      role="alert"
      {...props}
    >
      {children}
    </p>
  );
}

export interface LunaInputHelperProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

/**
 * LunaInputHelper - Helper text for form inputs.
 */
export function LunaInputHelper({
  className,
  ...props
}: LunaInputHelperProps) {
  return (
    <p
      data-slot="luna-input-helper"
      className={cn('text-sm text-luna-gray-500 mt-1.5', className)}
      {...props}
    />
  );
}

export interface LunaInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text displayed above the input */
  label?: string;
  /** Mark input as required (shows asterisk) */
  required?: boolean;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Error message (shows error state when present) */
  error?: string;
  /** Icon displayed on the left side of input */
  leftIcon?: React.ReactNode;
  /** Icon displayed on the right side of input */
  rightIcon?: React.ReactNode;
  /** Country code for phone inputs (e.g., '+1', '+44') */
  countryCode?: string;
  /** Callback when country code changes */
  onCountryCodeChange?: (code: string) => void;
}

/**
 * LunaInput - A form input component with Luna styling.
 *
 * @example
 * ```tsx
 * <LunaInput
 *   label="Email"
 *   required
 *   placeholder="Enter your email"
 *   helperText="We'll never share your email"
 * />
 *
 * <LunaInput
 *   label="Password"
 *   type="password"
 *   error="Password is required"
 * />
 * ```
 */
export function LunaInput({
  className,
  label,
  required,
  helperText,
  error,
  leftIcon,
  rightIcon,
  disabled,
  id,
  type,
  countryCode,
  onCountryCodeChange,
  ...props
}: LunaInputProps) {
  const inputId = id || React.useId();
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const hasError = !!error;

  // Country code selector for phone inputs
  const [showCountryCodeDropdown, setShowCountryCodeDropdown] = React.useState(false);
  const [countrySearch, setCountrySearch] = React.useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const isPhoneField = type === 'tel' && countryCode !== undefined;
  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

  // Filter countries based on search
  const filteredCountries = React.useMemo(() => {
    if (!countrySearch) return COUNTRY_CODES;
    const query = countrySearch.toLowerCase();
    return COUNTRY_CODES.filter(
      (c) =>
        c.country.toLowerCase().includes(query) ||
        c.code.includes(query) ||
        c.isoCode.toLowerCase().includes(query)
    );
  }, [countrySearch]);

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (showCountryCodeDropdown && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showCountryCodeDropdown]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    if (!showCountryCodeDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryCodeDropdown(false);
        setCountrySearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCountryCodeDropdown]);

  // Password reveal functionality
  const [showPassword, setShowPassword] = React.useState(false);
  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPassword ? 'text' : type;

  // Determine if we should show the password toggle
  const hasPasswordToggle = isPasswordField && !rightIcon;
  const effectiveRightIcon = hasPasswordToggle ? (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="text-luna-gray-400 hover:text-luna-gray-600 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luna-blue focus-visible:ring-offset-2"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      tabIndex={-1}
    >
      {showPassword ? (
        <EyeOff className="w-5 h-5" />
      ) : (
        <Eye className="w-5 h-5" />
      )}
    </button>
  ) : rightIcon;

  return (
    <div data-slot="luna-input-wrapper" className="w-full">
      {label && (
        <LunaInputLabel htmlFor={inputId} required={required}>
          {label}
        </LunaInputLabel>
      )}
      <div className="relative">
        {/* Country Code Selector for Phone Inputs */}
        {isPhoneField && (
          <div className="absolute left-0 top-0 bottom-0 flex items-center" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowCountryCodeDropdown(!showCountryCodeDropdown)}
              disabled={disabled}
              className={cn(
                'flex items-center gap-1 px-3 h-full border-r border-luna-border-default',
                'hover:bg-luna-gray-50 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <span className="text-base">{selectedCountry.flag}</span>
              <span className="text-sm text-luna-gray-700">{selectedCountry.code}</span>
              <ChevronDown className="w-3 h-3 text-luna-gray-500" />
            </button>

            {/* Dropdown Menu */}
            {showCountryCodeDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-luna-border-default rounded-md shadow-lg z-50 w-80">
                {/* Search Input */}
                <div className="p-2 border-b border-luna-border-default">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-luna-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      placeholder="Search countries..."
                      autoComplete="off"
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-luna-border-default rounded-md focus:outline-none focus:border-luna-blue focus-visible:ring-2 focus-visible:ring-luna-blue/20"
                    />
                  </div>
                </div>

                {/* Country List */}
                <div className="max-h-60 overflow-y-auto">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((country) => (
                      <button
                        key={`${country.isoCode}-${country.code}`}
                        type="button"
                        onClick={() => {
                          onCountryCodeChange?.(country.code);
                          setShowCountryCodeDropdown(false);
                          setCountrySearch('');
                        }}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-luna-gray-50 transition-colors',
                          country.code === countryCode && 'bg-luna-blue/10 text-luna-blue font-medium'
                        )}
                      >
                        <span className="text-lg">{country.flag}</span>
                        <span className="font-medium min-w-[3rem]">{country.code}</span>
                        <span className="text-luna-gray-700 truncate">{country.country}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-sm text-luna-gray-500 text-center">
                      No countries found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {leftIcon && !isPhoneField && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-luna-gray-400">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          type={inputType}
          data-slot="luna-input"
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={
            [errorId, helperId].filter(Boolean).join(' ') || undefined
          }
          className={cn(
            'w-full rounded-md px-3 text-sm transition-colors',
            'border border-luna-border-default bg-white',
            'placeholder:text-luna-gray-400',
            'focus:outline-none focus:border-luna-blue focus-visible:ring-2 focus-visible:ring-luna-blue/20',
            hasError && 'border-luna-error text-luna-error focus:border-luna-error',
            disabled && 'bg-luna-gray-100 cursor-not-allowed text-luna-gray-400',
            leftIcon && !isPhoneField && 'pl-10',
            isPhoneField && 'pl-28',
            (effectiveRightIcon || hasPasswordToggle) && 'pr-10',
            // Default height unless overridden by className
            !className?.includes('h-') && 'h-10',
            className
          )}
          {...props}
        />
        {effectiveRightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-luna-gray-400">
            {effectiveRightIcon}
          </span>
        )}
      </div>
      {error && <LunaInputError id={errorId}>{error}</LunaInputError>}
      {helperText && !error && (
        <LunaInputHelper id={helperId}>{helperText}</LunaInputHelper>
      )}
    </div>
  );
}

