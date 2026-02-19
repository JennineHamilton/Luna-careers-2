import MainLayout from '@/components/layout/MainLayout';
import { adminNavigation } from '@/lib/navigation/admin-nav';

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainLayout
      navSections={adminNavigation}
      showContextSwitcher={false}
      showPointsTracker={false}
    >
      {children}
    </MainLayout>
  );
}

