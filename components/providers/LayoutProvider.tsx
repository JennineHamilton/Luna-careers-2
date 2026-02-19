'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { LayoutState } from '@/types/layout';

interface LayoutContextType extends LayoutState {
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  isMobile: boolean;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    setMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when switching to desktop
  useEffect(() => {
    if (!isMobile && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile, isMobileMenuOpen]);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const setSidebarCollapsed = (collapsed: boolean) =>
    setIsSidebarCollapsed(collapsed);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <LayoutContext.Provider
      value={{
        isSidebarCollapsed,
        isDarkMode,
        toggleSidebar,
        toggleDarkMode,
        setSidebarCollapsed,
        isMobileMenuOpen,
        setMobileMenuOpen: setIsMobileMenuOpen,
        toggleMobileMenu,
        isMobile,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayoutContext() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext must be used within LayoutProvider');
  }
  return context;
}

