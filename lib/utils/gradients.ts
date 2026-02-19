import type { Gradient } from '@/types/layout';

/**
 * Get gradient for context avatar
 * Fetches from database if available, falls back to default gradients
 */
export function getContextGradient(
  contextType: 'personal' | 'organization',
  organizationGradient?: Gradient
): Gradient {
  if (contextType === 'personal') {
    return { from: '#1449E8', to: '#0F3AB8' };
  }

  // If organization has custom gradient in DB, use it
  if (organizationGradient) {
    return organizationGradient;
  }

  // Otherwise, use default organization gradients (rotate through them)
  const defaultGradients: Gradient[] = [
    { from: '#EA580C', to: '#F59E0B' }, // Orange
    { from: '#059669', to: '#22C55E' }, // Green
    { from: '#6366F1', to: '#9333EA' }, // Purple
  ];

  // Use a simple hash of organization ID to consistently pick same gradient
  // This is a fallback - actual gradient should come from DB
  return defaultGradients[0];
}

/**
 * Convert gradient object to inline style
 */
export function gradientToStyle(gradient: Gradient) {
  return {
    background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`
  };
}

