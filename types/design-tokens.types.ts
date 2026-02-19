/**
 * Luna Design System Type Definitions
 * TypeScript types for design tokens
 */

/** Luna brand colors */
export type LunaBrandColor = 'luna-navy' | 'luna-blue' | 'luna-yellow';

/** Luna gray scale */
export type LunaGrayColor =
  | 'luna-gray-50'
  | 'luna-gray-100'
  | 'luna-gray-200'
  | 'luna-gray-300'
  | 'luna-gray-400'
  | 'luna-gray-500'
  | 'luna-gray-600'
  | 'luna-gray-700'
  | 'luna-gray-800'
  | 'luna-gray-900';

/** Luna semantic colors */
export type LunaSemanticColor =
  | 'luna-success'
  | 'luna-warning'
  | 'luna-error'
  | 'luna-info';

/** Luna portal accent colors */
export type LunaPortalColor =
  | 'luna-personal'
  | 'luna-organization'
  | 'luna-admin';

/** All Luna colors */
export type LunaColor =
  | LunaBrandColor
  | LunaGrayColor
  | LunaSemanticColor
  | LunaPortalColor;

/** Colors safe for text on white backgrounds (WCAG AA compliant) */
export type LunaTextColor =
  | 'luna-navy'
  | 'luna-blue'
  | 'luna-gray-600'
  | 'luna-gray-700'
  | 'luna-gray-800'
  | 'luna-gray-900'
  | 'luna-success'
  | 'luna-warning'
  | 'luna-error'
  | 'luna-info';

/** Luna background colors */
export type LunaBackgroundColor =
  | 'luna-bg-primary'
  | 'luna-bg-secondary'
  | 'luna-bg-tertiary'
  | 'luna-navy'
  | 'luna-blue'
  | 'luna-gray-50'
  | 'luna-gray-100';

/** Luna border colors */
export type LunaBorderColor =
  | 'luna-border-light'
  | 'luna-border-default'
  | 'luna-border-strong';

/** Color values mapping for runtime usage */
export const LUNA_COLORS = {
  // Brand
  'luna-navy': '#00185F',
  'luna-blue': '#1449E8',
  'luna-yellow': '#FFDF2B',

  // Grays
  'luna-gray-50': '#F8F9FB',
  'luna-gray-100': '#F1F3F6',
  'luna-gray-200': '#E4E7EC',
  'luna-gray-300': '#D0D5DD',
  'luna-gray-400': '#98A2B3',
  'luna-gray-500': '#667085',
  'luna-gray-600': '#5A637B',
  'luna-gray-700': '#344054',
  'luna-gray-800': '#1D2939',
  'luna-gray-900': '#0C141D',

  // Semantic
  'luna-success': '#10B981',
  'luna-warning': '#F59E0B',
  'luna-error': '#EF4444',
  'luna-info': '#3B82F6',

  // Portal
  'luna-personal': '#1449E8',
  'luna-organization': '#7C3AED',
  'luna-admin': '#6B7280',
} as const;

/** Backgrounds values mapping */
export const LUNA_BACKGROUNDS = {
  'luna-bg-primary': '#FFFFFF',
  'luna-bg-secondary': '#F8F9FB',
  'luna-bg-tertiary': 'rgba(0, 24, 95, 0.04)',
} as const;

/** Border values mapping */
export const LUNA_BORDERS = {
  'luna-border-light': 'rgba(0, 24, 95, 0.04)',
  'luna-border-default': '#E4E7EC',
  'luna-border-strong': '#00185F',
} as const;

