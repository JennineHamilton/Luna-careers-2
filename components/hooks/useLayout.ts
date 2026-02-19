'use client';

import { useLayoutContext } from '@/components/providers/LayoutProvider';

/**
 * Hook for accessing layout state and controls
 */
export function useLayout() {
  return useLayoutContext();
}

