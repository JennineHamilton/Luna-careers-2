import type { NavSection } from '@/types/layout';

/**
 * Admin Portal Navigation Configuration
 * Clean, sophisticated structure for platformAdmin users
 */
export const adminNavigation: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/cmd/dashboard', icon: 'LayoutDashboard' },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Users', href: '/cmd/users', icon: 'Users' },
      { label: 'Employers', href: '/cmd/employers', icon: 'Building2' },
      { label: 'Vacancies', href: '/cmd/vacancies', icon: 'Briefcase' },
      { label: 'Team', href: '/cmd/team', icon: 'UserCog' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Learning', href: '/cmd/learning', icon: 'GraduationCap' },
      { label: 'Pre-Screening', href: '/cmd/screening', icon: 'Keyboard' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Payments', href: '/cmd/payments', icon: 'CreditCard' },
      { label: 'Scholarships', href: '/cmd/scholarships', icon: 'GraduationCap' },
      { label: 'Verifications', href: '/cmd/verifications', icon: 'CheckCircle' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Settings', href: '/cmd/settings', icon: 'Settings' },
    ],
  },
  {
    label: 'Development',
    items: [
      { label: 'Design System', href: '/cmd/design-system', icon: 'Palette' },
    ],
  },
];

