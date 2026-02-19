/**
 * Credit Settings Utilities (Server-Side)
 * 
 * Fetches credit system settings from the database dynamically.
 * Use these functions on the server-side (API routes, server components).
 */

import { createAdminClient } from '@/lib/supabase/server';

export interface CreditSettings {
  creditsPerDollar: number;
  cashbackPercentage: number;
  creditToUsdRate: number;
}

/**
 * Fetch credit settings from the database
 * @returns Credit settings object
 */
export async function getCreditSettings(): Promise<CreditSettings> {
  const supabase = createAdminClient();
  
  const { data: settings, error } = await supabase
    .from('payment_settings')
    .select('setting_key, setting_value, setting_type')
    .in('setting_key', ['credits_per_dollar', 'cashback_percentage', 'credit_to_usd_rate'])
    .eq('is_active', true);
  
  if (error) {
    console.error('Error fetching credit settings:', error);
    // Return defaults if fetch fails
    return {
      creditsPerDollar: 100,
      cashbackPercentage: 10,
      creditToUsdRate: 0.01,
    };
  }
  
  // Parse settings
  const settingsMap = settings.reduce((acc, setting) => {
    let value: number = 0;
    
    if (setting.setting_type === 'number') {
      value = parseFloat(setting.setting_value || '0');
    }
    
    acc[setting.setting_key] = value;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    creditsPerDollar: settingsMap['credits_per_dollar'] || 100,
    cashbackPercentage: settingsMap['cashback_percentage'] || 10,
    creditToUsdRate: settingsMap['credit_to_usd_rate'] || 0.01,
  };
}

/**
 * Convert dollar amount to credits (server-side)
 * @param dollars - Amount in dollars
 * @returns Amount in credits (as decimal, not rounded)
 */
export async function dollarsToCreditsServer(dollars: number): Promise<number> {
  const settings = await getCreditSettings();
  return dollars * settings.creditsPerDollar;
}

/**
 * Convert credits to dollar amount (server-side)
 * @param credits - Amount in credits
 * @returns Amount in dollars
 */
export async function creditsToDollarsServer(credits: number): Promise<number> {
  const settings = await getCreditSettings();
  return credits / settings.creditsPerDollar;
}

/**
 * Calculate cashback credits for content completion (server-side)
 * @param priceInDollars - Original price in dollars
 * @param contentType - Type of content (module, course, program)
 * @returns Credits to award
 */
export async function calculateCashbackServer(
  priceInDollars: number,
  contentType: 'module' | 'course' | 'program'
): Promise<number> {
  const settings = await getCreditSettings();
  const cashbackDollars = priceInDollars * (settings.cashbackPercentage / 100);
  return Math.round(cashbackDollars * settings.creditsPerDollar);
}

/**
 * Calculate enrollment pricing with optional credit application (server-side)
 * @param priceInDollars - Original price in dollars
 * @param availableCredits - User's available credits
 * @param applyCredits - Whether to apply credits
 * @returns Pricing breakdown
 */
export async function calculateEnrollmentPriceServer(
  priceInDollars: number,
  availableCredits: number,
  applyCredits: boolean
): Promise<{
  originalPrice: number;
  creditsUsed: number;
  creditDiscount: number;
  finalPrice: number;
  creditsRemaining: number;
}> {
  if (!applyCredits || availableCredits === 0) {
    return {
      originalPrice: priceInDollars,
      creditsUsed: 0,
      creditDiscount: 0,
      finalPrice: priceInDollars,
      creditsRemaining: availableCredits,
    };
  }

  const settings = await getCreditSettings();
  const creditValue = availableCredits / settings.creditsPerDollar;
  const maxCreditsNeeded = Math.round(priceInDollars * settings.creditsPerDollar);
  const creditsUsed = Math.min(availableCredits, maxCreditsNeeded);
  const creditDiscount = creditsUsed / settings.creditsPerDollar;
  const finalPrice = Math.max(0, priceInDollars - creditDiscount);

  return {
    originalPrice: priceInDollars,
    creditsUsed,
    creditDiscount,
    finalPrice,
    creditsRemaining: availableCredits - creditsUsed,
  };
}

