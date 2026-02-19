/**
 * Credit Conversion Utilities
 *
 * Handles conversion between dollars and credits based on platform settings.
 * Default: 100 credits = $1 (1 credit = $0.01)
 */

/**
 * Convert dollar amount to credits
 * @param dollars - Amount in dollars
 * @param creditsPerDollar - Conversion rate (default: 100 credits per dollar)
 * @returns Amount in credits
 *
 * @example
 * dollarsToCredits(10) // Returns 1000 credits
 * dollarsToCredits(50) // Returns 5000 credits
 * dollarsToCredits(0.50) // Returns 50 credits
 */
export function dollarsToCredits(dollars: number, creditsPerDollar: number = 100): number {
  return Math.round(dollars * creditsPerDollar);
}

/**
 * Convert credits to USD amount
 * @param credits - Amount in credits
 * @param creditsPerDollar - Conversion rate (default: 100 credits per dollar)
 * @returns Amount in USD
 * 
 * @example
 * creditsToDollars(1000) // Returns 10
 * creditsToDollars(5000) // Returns 50
 * creditsToDollars(50) // Returns 0.50
 */
export function creditsToDollars(credits: number, creditsPerDollar: number = 100): number {
  return credits / creditsPerDollar;
}

/**
 * Calculate credits earned from completing content (10% cashback)
 * @param contentPrice - Price of the content in USD
 * @param creditsPerDollar - Conversion rate (default: 100 credits per dollar)
 * @param cashbackPercent - Cashback percentage (default: 10%)
 * @returns Credits earned
 * 
 * @example
 * calculateCreditsEarned(50) // Returns 500 credits (10% of $50 = $5 = 500 credits)
 * calculateCreditsEarned(10) // Returns 100 credits (10% of $10 = $1 = 100 credits)
 */
export function calculateCreditsEarned(
  contentPrice: number,
  creditsPerDollar: number = 100,
  cashbackPercent: number = 10
): number {
  const cashbackAmount = contentPrice * (cashbackPercent / 100);
  return dollarsToCredits(cashbackAmount, creditsPerDollar);
}

/**
 * Format credits for display
 * @param credits - Amount in credits
 * @returns Formatted string
 * 
 * @example
 * formatCredits(1000) // Returns "1,000"
 * formatCredits(500) // Returns "500"
 */
export function formatCredits(credits: number): string {
  return credits.toLocaleString();
}

/**
 * Format dollars for display (no currency symbol)
 * @param dollars - Amount in dollars
 * @returns Formatted string
 *
 * @example
 * formatDollars(10) // Returns "10.00"
 * formatDollars(50.5) // Returns "50.50"
 */
export function formatDollars(dollars: number | undefined | null): string {
  if (dollars === undefined || dollars === null || isNaN(dollars)) {
    return '0.00';
  }
  return dollars.toFixed(2);
}

/**
 * Format price with both dollars and credits
 * @param dollars - Amount in dollars
 * @param creditsPerDollar - Conversion rate (default: 100 credits per dollar)
 * @returns Object with formatted strings
 *
 * @example
 * formatPriceWithCredits(10)
 * // Returns { dollars: "10.00", credits: "1,000", combined: "10.00 (1,000 credits)" }
 */
export function formatPriceWithCredits(
  dollars: number,
  creditsPerDollar: number = 100
): {
  dollars: string;
  credits: string;
  combined: string;
} {
  const credits = dollarsToCredits(dollars, creditsPerDollar);
  const dollarsFormatted = formatDollars(dollars);
  const creditsFormatted = formatCredits(credits);
  
  return {
    dollars: dollarsFormatted,
    credits: creditsFormatted,
    combined: `${dollarsFormatted} (${creditsFormatted} credits)`,
  };
}

