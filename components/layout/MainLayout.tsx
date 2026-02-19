'use client';

import { type ReactNode } from 'react';
import { LayoutProvider } from '@/components/providers/LayoutProvider';
import type { NavSection } from '@/types/layout';
import Sidebar from './Sidebar/Sidebar';
import Header from './Header/Header';
import MainContent from './MainContent';

interface MainLayoutProps {
  children: ReactNode;
  /** Page title for header */
  pageTitle?: string;
  /** Navigation sections for sidebar */
  navSections: NavSection[];
  /** Show context switcher in sidebar (default: true) */
  showContextSwitcher?: boolean;
  /** Show points tracker in header (default: true) */
  showPointsTracker?: boolean;
}

/**
 * MainLayout - Primary layout wrapper with sidebar and header.
 *
 * Wrap your page content with this component to get the full Luna layout.
 *
 * @example
 * ```tsx
 * export default function DashboardPage() {
 *   return (
 *     <MainLayout pageTitle="Dashboard">
 *       <div>Your page content here</div>
 *     </MainLayout>
 *   );
 * }
 * ```
 */
export default function MainLayout({
  children,
  pageTitle,
  navSections,
  showContextSwitcher = true,
  showPointsTracker = true,
}: MainLayoutProps) {
  return (
    <LayoutProvider>
      <div className="h-screen w-full overflow-hidden bg-luna-bg-secondary">
        {/* Sidebar - Fixed position */}
        <Sidebar navSections={navSections} showContextSwitcher={showContextSwitcher} />

        {/* Header - Fixed position */}
        <Header pageTitle={pageTitle} showPointsTracker={showPointsTracker} />

        {/* Page Content - With proper margins for fixed sidebar/header */}
        <MainContent>{children}</MainContent>
      </div>
    </LayoutProvider>
  );
}

