'use client';

import { PanelLeft, Menu } from 'lucide-react';
import { useLayout } from '@/components/hooks/useLayout';
import { cn } from '@/lib/utils';
import PointsTracker from './PointsTracker';
import NotificationsMenu from './NotificationsMenu';
import UserMenu from './UserMenu';

interface HeaderProps {
  /** Page title to display */
  pageTitle?: string;
  /** Show points tracker (default: true) */
  showPointsTracker?: boolean;
  /** Notification scope for dropdown: personal (default) or organization */
  notificationScope?: 'personal' | 'organization';
  /** Organization slug when notificationScope is organization */
  organizationSlug?: string;
}

export default function Header({
  pageTitle,
  showPointsTracker = true,
  notificationScope = 'personal',
  organizationSlug,
}: HeaderProps) {
  const { isSidebarCollapsed, toggleSidebar, isMobile, toggleMobileMenu } = useLayout();

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-[65px] bg-white border-b border-luna-border-default flex items-center justify-between z-30 transition-all duration-300",
        // Padding
        isMobile ? "px-4" : "px-6",
        // Left position based on sidebar state
        isMobile ? "left-0" : (isSidebarCollapsed ? "left-16" : "left-[250px]")
      )}
    >
      {/* Left Side */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Toggle / Desktop Sidebar Toggle */}
        <button
          onClick={isMobile ? toggleMobileMenu : toggleSidebar}
          className="p-2 rounded-md hover:bg-luna-gray-100 transition-colors active:scale-95"
          aria-label={isMobile ? 'Open menu' : 'Toggle sidebar'}
        >
          {isMobile ? (
            <Menu className="w-5 h-5 text-luna-gray-600" />
          ) : (
            <PanelLeft className="w-[18px] h-[18px] text-luna-gray-500" />
          )}
        </button>

        {/* Divider - Hidden on mobile */}
        {!isMobile && <div className="w-px h-5 bg-luna-gray-200" />}

        {/* Page Title - Truncated on mobile */}
        {pageTitle && (
          <span className="text-[15px] font-semibold text-luna-gray-900 truncate max-w-[150px] md:max-w-none">
            {pageTitle}
          </span>
        )}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2 md:gap-2.5">
        {/* Points Tracker - Conditional */}
        {showPointsTracker && <PointsTracker />}

        {/* Notifications */}
        <NotificationsMenu
          scope={notificationScope}
          organizationSlug={organizationSlug}
        />

        {/* User Menu */}
        <UserMenu />
      </div>
    </header>
  );
}

