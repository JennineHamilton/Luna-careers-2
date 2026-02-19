import {
  LayoutDashboard,
  Users,
  Building2,
  GraduationCap,
  UserCog,
  CheckCircle,
  Settings,
  Home,
  User,
  BookOpen,
  ClipboardCheck,
  HandshakeIcon,
  Briefcase,
  FileText,
  Calendar,
  HelpCircle,
  UserCheck,
  UserPlus,
  TrendingUp,
  Activity,
  Shield,
  Clock,
  Layers,
  type LucideIcon,
} from 'lucide-react';

/**
 * Icon mapping for navigation and components
 * Maps icon name strings to Lucide icon components
 */
export const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Building2,
  GraduationCap,
  UserCog,
  CheckCircle,
  Settings,
  Home,
  User,
  BookOpen,
  ClipboardCheck,
  HandshakeIcon,
  Briefcase,
  FileText,
  Calendar,
  HelpCircle,
  UserCheck,
  UserPlus,
  TrendingUp,
  Activity,
  Shield,
  Clock,
  Layers,
};

/**
 * Get icon component from icon name string
 */
export function getIcon(iconName: string): LucideIcon {
  return iconMap[iconName] || Home; // Fallback to Home icon
}

