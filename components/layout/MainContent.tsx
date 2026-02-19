'use client';

import { type ReactNode } from 'react';
import { useLayout } from '@/components/hooks/useLayout';
import { cn } from '@/lib/utils';
import { ProfileCompletionBarWrapper } from '@/components/profile/profile-completion-bar-wrapper';

interface MainContentProps {
  children: ReactNode;
}

/**
 * MainContent - Wrapper for page content with proper margins for fixed sidebar/header.
 */
export default function MainContent({ children }: MainContentProps) {
  const { isSidebarCollapsed, isMobile } = useLayout();

  return (
    <div
      className={cn(
        "h-full overflow-auto transition-all duration-300",
        "mt-[65px]", // Fixed header height
        // Sidebar margin - mobile has no margin, desktop has margin based on collapsed state
        isMobile ? "ml-0" : (isSidebarCollapsed ? "ml-16" : "ml-[250px]")
      )}
    >
      {/* Profile Completion Bar - Sticky below header */}
      <ProfileCompletionBarWrapper />
      
      {/* Main Content */}
      <div className="pt-4 md:pt-6 px-4 md:px-6 pb-[100px]">
        {children}
      </div>
    </div>
  );
}

