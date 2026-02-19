import type { NavSection } from '@/types/layout';

/**
 * Personal Portal Navigation Configuration
 * For personal/jobseeker users
 */
export const personalNavigation: NavSection[] = [
  {
    label: 'Main Menu',
    items: [
      { label: 'Dashboard', href: '/u/dashboard', icon: 'Home' },
      { label: 'Profile', href: '/u/profile', icon: 'User' },
    ],
  },
  {
    label: 'Learning',
    items: [
      { label: 'Learning', href: '/u/learning', icon: 'BookOpen' },
      { label: 'Pre-Screening', href: '/u/screening', icon: 'Keyboard' },
      { label: 'Scholarships', href: '/u/scholarships', icon: 'HandshakeIcon' },
    ],
  },
  {
    label: 'Career',
    items: [
      { label: 'Job Board', href: '/u/jobs', icon: 'Briefcase' },
      { label: 'My Applications', href: '/u/applications', icon: 'FileText' },
      { label: 'Interviews', href: '/u/interviews', icon: 'Calendar' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Settings', href: '/u/settings', icon: 'Settings' },
    ],
  },
];

