'use client';

import MainLayout from '@/components/layout/MainLayout';
import { useParams } from 'next/navigation';
import type { NavSection } from '@/types/layout';

export default function OrganizationPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const slug = params?.slug as string;

  // Generate navigation with dynamic slug
  const organizationNavigation: NavSection[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', href: `/org/${slug}/dashboard`, icon: 'LayoutDashboard' },
        { label: 'Profile', href: `/org/${slug}/profile`, icon: 'Building2' },
      ],
    },
    {
      label: 'Recruitment',
      items: [
        { label: 'Vacancies', href: `/org/${slug}/vacancies`, icon: 'Briefcase' },
        { label: 'Applicants', href: `/org/${slug}/applicants`, icon: 'UserCheck' },
      ],
    },
    {
      label: 'Team',
      items: [
        { label: 'Team', href: `/org/${slug}/team`, icon: 'Users' },
      ],
    },
    {
      label: 'Settings',
      items: [
        { label: 'Settings', href: `/org/${slug}/settings`, icon: 'Settings' },
      ],
    },
  ];

  return (
    <MainLayout
      navSections={organizationNavigation}
      showContextSwitcher={true}
      showPointsTracker={true}
    >
      {children}
    </MainLayout>
  );
}

