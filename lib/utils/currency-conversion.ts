/**
 * Currency Conversion Utilities
 * 
 * Default currency: BZD (Belize Dollar)
 * Provides conversion to other currencies for international users
 */

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Rate relative to BZD
}

// Common currency rates (relative to 1 BZD)
// These should ideally be fetched from an API in production
export const CURRENCY_RATES: Record<string, CurrencyRate> = {
  BZD: {
    code: 'BZD',
    name: 'Belize Dollar',
    symbol: '$',
    rate: 1.0,
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    rate: 0.5, // 1 BZD = 0.5 USD (approximate)
  },
  // Caribbean Currencies
  JMD: {
    code: 'JMD',
    name: 'Jamaican Dollar',
    symbol: 'J$',
    rate: 77.5, // 1 BZD = 77.5 JMD (approximate)
  },
  TTD: {
    code: 'TTD',
    name: 'Trinidad & Tobago Dollar',
    symbol: 'TT$',
    rate: 3.4, // 1 BZD = 3.4 TTD (approximate)
  },
  BBD: {
    code: 'BBD',
    name: 'Barbadian Dollar',
    symbol: 'Bds$',
    rate: 1.0, // 1 BZD = 1 BBD (pegged to USD at 2:1)
  },
  XCD: {
    code: 'XCD',
    name: 'East Caribbean Dollar',
    symbol: 'EC$',
    rate: 1.35, // 1 BZD = 1.35 XCD (approximate)
  },
  HTG: {
    code: 'HTG',
    name: 'Haitian Gourde',
    symbol: 'G',
    rate: 66.0, // 1 BZD = 66 HTG (approximate)
  },
  DOP: {
    code: 'DOP',
    name: 'Dominican Peso',
    symbol: 'RD$',
    rate: 30.0, // 1 BZD = 30 DOP (approximate)
  },
  // Central American Currencies
  GTQ: {
    code: 'GTQ',
    name: 'Guatemalan Quetzal',
    symbol: 'Q',
    rate: 3.85, // 1 BZD = 3.85 GTQ (approximate)
  },
  HNL: {
    code: 'HNL',
    name: 'Honduran Lempira',
    symbol: 'L',
    rate: 12.3, // 1 BZD = 12.3 HNL (approximate)
  },
  NIO: {
    code: 'NIO',
    name: 'Nicaraguan Córdoba',
    symbol: 'C$',
    rate: 18.4, // 1 BZD = 18.4 NIO (approximate)
  },
  CRC: {
    code: 'CRC',
    name: 'Costa Rican Colón',
    symbol: '₡',
    rate: 255.0, // 1 BZD = 255 CRC (approximate)
  },
  PAB: {
    code: 'PAB',
    name: 'Panamanian Balboa',
    symbol: 'B/.',
    rate: 0.5, // 1 BZD = 0.5 PAB (pegged to USD)
  },
  // Other Common Currencies
  MXN: {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: '$',
    rate: 10.0, // 1 BZD = 10 MXN (approximate)
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: '$',
    rate: 0.68, // 1 BZD = 0.68 CAD (approximate)
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    rate: 0.46, // 1 BZD = 0.46 EUR (approximate)
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    rate: 0.39, // 1 BZD = 0.39 GBP (approximate)
  },
};

/**
 * Convert BZD amount to another currency
 * @param amountBZD - Amount in BZD
 * @param targetCurrency - Target currency code
 * @returns Converted amount
 */
export function convertFromBZD(amountBZD: number, targetCurrency: string): number {
  const rate = CURRENCY_RATES[targetCurrency]?.rate || 1.0;
  return amountBZD * rate;
}

/**
 * Format currency amount with symbol
 * @param amount - Amount to format
 * @param currencyCode - Currency code
 * @returns Formatted string
 */
export function formatCurrency(amount: number, currencyCode: string = 'BZD'): string {
  const currency = CURRENCY_RATES[currencyCode] || CURRENCY_RATES.BZD;
  return `${currency.symbol}${amount.toFixed(2)}`;
}

/**
 * Get list of available currencies
 * @returns Array of currency codes
 */
export function getAvailableCurrencies(): string[] {
  return Object.keys(CURRENCY_RATES);
}

/**
 * Get currency info
 * @param currencyCode - Currency code
 * @returns Currency rate object
 */
export function getCurrencyInfo(currencyCode: string): CurrencyRate | null {
  return CURRENCY_RATES[currencyCode] || null;
}

