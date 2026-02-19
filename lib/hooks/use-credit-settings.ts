/**
 * Credit Settings Hook (Client-Side)
 * 
 * React hook to fetch and cache credit system settings from the API.
 * Use this in client components that need dynamic credit conversion.
 */

'use client';

import { useState, useEffect } from 'react';

export interface CreditSettings {
  creditsPerDollar: number;
  cashbackPercentage: number;
  creditToUsdRate: number;
}

const DEFAULT_SETTINGS: CreditSettings = {
  creditsPerDollar: 100,
  cashbackPercentage: 10,
  creditToUsdRate: 0.01,
};

// Cache settings in memory to avoid repeated API calls
let cachedSettings: CreditSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to fetch credit settings from the API
 * @returns Credit settings object and loading state
 */
export function useCreditSettings() {
  const [settings, setSettings] = useState<CreditSettings>(cachedSettings || DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(!cachedSettings);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      // Use cache if available and fresh
      const now = Date.now();
      if (cachedSettings && (now - cacheTimestamp) < CACHE_DURATION) {
        setSettings(cachedSettings);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/payments/settings');
        
        if (!response.ok) {
          throw new Error('Failed to fetch payment settings');
        }

        const data = await response.json();
        
        const fetchedSettings: CreditSettings = {
          creditsPerDollar: data.settings.credits_per_dollar || 100,
          cashbackPercentage: data.settings.cashback_percentage || 10,
          creditToUsdRate: data.settings.credit_to_usd_rate || 0.01,
        };

        // Update cache
        cachedSettings = fetchedSettings;
        cacheTimestamp = now;
        
        setSettings(fetchedSettings);
        setError(null);
      } catch (err) {
        console.error('Error fetching credit settings:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Keep using default settings on error
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
}

/**
 * Invalidate the settings cache (call after updating settings)
 */
export function invalidateCreditSettingsCache() {
  cachedSettings = null;
  cacheTimestamp = 0;
}

