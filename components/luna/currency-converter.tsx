/**
 * Currency Converter Component
 *
 * Displays a small, unobtrusive currency conversion beside prices
 * Default currency is BZD (Belize Dollar)
 */

'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import { convertFromBZD, formatCurrency, CURRENCY_RATES } from '@/lib/utils/currency-conversion';
import {
  LunaDropdownMenu,
  LunaDropdownMenuTrigger,
  LunaDropdownMenuContent,
  LunaDropdownMenuItem,
} from '@/components/luna';

interface CurrencyConverterProps {
  amountBZD: number;
  className?: string;
  compact?: boolean;
  onCurrencyChange?: (currency: string, amount: number) => void;
}

export function CurrencyConverter({
  amountBZD,
  className = '',
  compact = false,
  onCurrencyChange
}: CurrencyConverterProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<string>('BZD');

  const convertedAmount = convertFromBZD(amountBZD, selectedCurrency);
  const currencyInfo = CURRENCY_RATES[selectedCurrency];

  const handleCurrencyChange = (currency: string) => {
    setSelectedCurrency(currency);
    const amount = convertFromBZD(amountBZD, currency);
    onCurrencyChange?.(currency, amount);
  };

  return (
    <LunaDropdownMenu>
      <LunaDropdownMenuTrigger asChild>
        <button
          className={`inline-flex items-center gap-1.5 text-xs text-luna-gray-500 hover:text-luna-gray-700 transition-colors ${className}`}
          aria-label="Convert currency"
          title="Convert Currency"
        >
          <Globe className="w-3.5 h-3.5" />
          {!compact && <span className="text-xs">Convert Currency</span>}
          {compact && selectedCurrency !== 'BZD' && (
            <span className="text-xs font-medium text-luna-gray-600">
              {currencyInfo.code}
            </span>
          )}
        </button>
      </LunaDropdownMenuTrigger>
      <LunaDropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto">
        <div className="px-2 py-1.5 text-xs font-semibold text-luna-gray-700 border-b border-luna-border-light sticky top-0 bg-white">
          Convert to:
        </div>
        {Object.entries(CURRENCY_RATES).map(([code, info]) => (
          <LunaDropdownMenuItem
            key={code}
            onClick={() => handleCurrencyChange(code)}
            className="text-sm"
          >
            <div className="flex items-center justify-between w-full">
              <span>{info.name}</span>
              <span className="text-luna-gray-500 text-xs">{info.code}</span>
            </div>
          </LunaDropdownMenuItem>
        ))}
      </LunaDropdownMenuContent>
    </LunaDropdownMenu>
  );
}

