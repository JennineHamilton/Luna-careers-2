'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useLayout } from '@/components/hooks/useLayout';
import type { NavSection } from '@/types/layout';
import ContextSwitcher from './ContextSwitcher';
import Navigation from './Navigation';
import SidebarFooter from './SidebarFooter';

interface SidebarProps {
  navSections: NavSection[];
  showContextSwitcher?: boolean;
}

export default function Sidebar({ navSections, showContextSwitcher = true }: SidebarProps) {
  const { isSidebarCollapsed, isMobile, isMobileMenuOpen, setMobileMenuOpen } = useLayout();

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isMobileMenuOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen flex flex-col bg-white border-r border-luna-border-default
          transition-all duration-300 z-50
          ${isMobile
            ? `w-[280px] ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl`
            : `${isSidebarCollapsed ? 'w-16' : 'w-[250px]'}`
          }
        `}
      >
      {/* Logo Header */}
      <div className="flex items-center justify-between border-b border-luna-border-default h-[65px] px-3">
        {isSidebarCollapsed && !isMobile ? (
          <div className="relative w-14 h-14">
            <Image
              src="/img/Luna_logo_icon.png"
              alt="Luna"
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <div className="relative w-full h-14">
            <Image
              src="/img/Luna_logo_dark.png"
              alt="Luna Careers"
              fill
              className="object-contain object-left"
            />
          </div>
        )}

        {/* Mobile Close Button */}
        {isMobile && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-md hover:bg-luna-gray-50 transition-colors ml-2"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-luna-gray-600" />
          </button>
        )}
      </div>

      {/* Context Switcher */}
      {showContextSwitcher && (
        <div className="mx-3 mt-5 mb-4">
          <ContextSwitcher isCollapsed={!isMobile && isSidebarCollapsed} />
        </div>
      )}

      {/* Navigation */}
      <div className={`flex-1 overflow-y-auto px-3 ${showContextSwitcher ? 'py-4' : 'py-5 mt-5'}`}>
        <Navigation isCollapsed={!isMobile && isSidebarCollapsed} navSections={navSections} />
      </div>

      {/* Footer */}
      {(!isSidebarCollapsed || isMobile) && <SidebarFooter />}
    </aside>
    </>
  );
}

