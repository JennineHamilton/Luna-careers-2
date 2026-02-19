/**
 * Performance Monitoring Utilities
 * Provides tools for measuring and optimizing application performance
 */

/**
 * Measure the execution time of a function
 * Returns [result, duration in ms]
 */
export async function measureAsync<T>(
  fn: () => Promise<T>,
  label?: string
): Promise<[T, number]> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  if (label && process.env.NODE_ENV === 'development') {
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
  }

  return [result, duration];
}

/**
 * Measure the execution time of a synchronous function
 * Returns [result, duration in ms]
 */
export function measureSync<T>(
  fn: () => T,
  label?: string
): [T, number] {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  if (label && process.env.NODE_ENV === 'development') {
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
  }

  return [result, duration];
}

/**
 * Create a performance mark for Web Vitals tracking
 */
export function mark(name: string): void {
  if (typeof window !== 'undefined' && window.performance) {
    performance.mark(name);
  }
}

/**
 * Measure the duration between two performance marks
 */
export function measure(name: string, startMark: string, endMark: string): number | null {
  if (typeof window !== 'undefined' && window.performance) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      return measure?.duration || null;
    } catch (error) {
      console.warn('Performance measurement failed:', error);
      return null;
    }
  }
  return null;
}

/**
 * Log Web Vitals metrics
 * Use with Next.js reportWebVitals in _app.tsx
 */
export function logWebVitals(metric: {
  id: string;
  name: string;
  label: string;
  value: number;
}): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 ${metric.name}:`, {
      value: metric.value,
      label: metric.label,
      id: metric.id,
    });
  }

  // TODO: Send to analytics service in production
  // Example:
  // if (process.env.NODE_ENV === 'production') {
  //   analytics.track('Web Vitals', {
  //     metric: metric.name,
  //     value: metric.value,
  //     label: metric.label,
  //   });
  // }
}

/**
 * Debounce function to limit execution rate
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function to limit execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load a component with retry logic
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3
): Promise<{ default: T }> {
  return new Promise((resolve, reject) => {
    componentImport()
      .then(resolve)
      .catch((error) => {
        if (retries === 0) {
          reject(error);
          return;
        }

        // Retry after a delay
        setTimeout(() => {
          lazyWithRetry(componentImport, retries - 1).then(resolve, reject);
        }, 1000);
      });
  });
}

