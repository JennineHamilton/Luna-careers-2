import type { NavSection } from '@/types/layout';

/**
 * Organization Portal Navigation Configuration
 * For organization/employer users
 */
export const organizationNavigation: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/org/dashboard', icon: 'LayoutDashboard' },
      { label: 'Profile', href: '/org/profile', icon: 'Building2' },
    ],
  },
  {
    label: 'Recruitment',
    items: [
      { label: 'Vacancies', href: '/org/vacancies', icon: 'Briefcase' },
      { label: 'Applicants', href: '/org/applicants', icon: 'UserCheck' },
    ],
  },
  {
    label: 'Team',
    items: [
      { label: 'Team', href: '/org/team', icon: 'Users' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Settings', href: '/org/settings', icon: 'Settings' },
    ],
  },
];

