import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      spacing: {
        'luna-page-bottom': '100px', // Standard bottom padding for all pages
        'luna-section': '24px', // Standard section spacing
        'luna-card-padding': '30px', // Standard card inner padding
      },
      colors: {
        luna: {
          // Brand Colors
          navy: '#00185F',
          blue: '#1449E8',
          yellow: '#FFDF2B',

          // Neutrals
          gray: {
            50: '#F8F9FB',
            100: '#F1F3F6',
            200: '#E4E7EC',
            300: '#D0D5DD',
            400: '#98A2B3',
            450: '#AFB3BF', // Muted text, subtle labels
            500: '#667085',
            600: '#5A637B',
            700: '#344054',
            800: '#1D2939',
            900: '#0C141D',
          },

          // Semantic
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',

          // Portal Accents
          personal: '#1449E8',
          organization: '#7C3AED',
          admin: '#6B7280',

          // Backgrounds
          'bg-primary': '#FFFFFF',
          'bg-secondary': '#F8F9FB',
          'bg-tertiary': 'rgba(0, 24, 95, 0.04)',

          // Borders
          'border-light': 'rgba(0, 24, 95, 0.04)',
          'border-default': '#E4E7EC',
          'border-strong': '#00185F',
        },
      },
      boxShadow: {
        'luna-sm': '0px 2px 12px 1px rgba(0, 0, 0, 0.05)',
        'luna-md': '0px 4px 16px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'luna-gradient-personal': 'linear-gradient(138.18deg, #1449E8 7.36%, #0F3AB8 97.64%)',
        'luna-gradient-org-orange': 'linear-gradient(313.45deg, #EA580C 7.43%, #F59E0B 100%)',
        'luna-gradient-org-green': 'linear-gradient(313.45deg, #059669 7.43%, #22C55E 100%)',
        'luna-gradient-org-purple': 'linear-gradient(134.49deg, #6366F1 0%, #9333EA 94.17%)',
      },
      backdropBlur: {
        'luna-glass': '10px',
      },
      transitionDuration: {
        fast: '150ms',
        slow: '300ms',
      },
      borderRadius: {
        md: '5px',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;

