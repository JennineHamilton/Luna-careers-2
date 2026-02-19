import MainLayout from '@/components/layout/MainLayout';
import { personalNavigation } from '@/lib/navigation/personal-nav';
import { AuthProvider } from '@/components/providers/AuthProvider';

export default function PersonalPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <MainLayout navSections={personalNavigation}>
        {children}
      </MainLayout>
    </AuthProvider>
  );
}

