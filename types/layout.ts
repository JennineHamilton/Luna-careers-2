// Navigation types
export interface NavItem {
  label: string;
  href: string;
  icon: string; // Icon name as string (e.g., 'LayoutDashboard', 'Users')
  active?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

// Context types
export interface Gradient {
  from: string;
  to: string;
}

export interface Context {
  id: string;
  name: string;
  type: 'personal' | 'organization';
  role?: string;
  email?: string;
  gradient: Gradient;
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  accountType: 'personal' | 'organization' | 'hybrid' | 'platformAdmin';
  currentContext: 'personal' | 'organization';
}

// Points types
export interface PointsData {
  totalEarned: number;
  availableBalance: number;
  pointsPerModule: number;
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'success' | 'info' | 'warning' | 'error';
}

// Layout state
export interface LayoutState {
  isSidebarCollapsed: boolean;
  isDarkMode: boolean;
  isMobileMenuOpen?: boolean;
  isMobile?: boolean;
}

