'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayout } from '@/components/hooks/useLayout';
import { useAuth } from '@/lib/auth';
import type { NavSection } from '@/types/layout';
import { getIcon } from '@/lib/utils/icon-map';
import {
  LunaTooltip,
  LunaTooltipTrigger,
  LunaTooltipContent,
  LunaTooltipProvider,
} from '@/components/luna/tooltip';

interface NavigationProps {
  isCollapsed: boolean;
  navSections: NavSection[];
}

export default function Navigation({ isCollapsed, navSections }: NavigationProps) {
  const pathname = usePathname();
  const { isMobile, setMobileMenuOpen } = useLayout();
  const { user } = useAuth();

  const handleLinkClick = () => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <LunaTooltipProvider delayDuration={300}>
      <div>
        {navSections.map((section, sectionIndex) => {
          const isLabelHidden = section.label === 'Main Menu' && user?.accountType !== 'hybrid';
          const showLabel = !isCollapsed && !isLabelHidden;

          return (
            <div key={sectionIndex} className={`mb-6 ${isLabelHidden && sectionIndex === 0 ? '-mt-2' : ''}`}>
              {/* Section Label (only when expanded; "Main Menu" only for hybrid users) */}
              {showLabel && (
                <div className="flex items-center mb-2">
                  <span className="font-medium text-[11px] uppercase tracking-wider text-luna-gray-400">
                    {section.label}
                  </span>
                  <div className="flex-1 border-t border-luna-gray-200 ml-3" />
                </div>
              )}

              {/* Separator (only when collapsed) */}
              {isCollapsed && sectionIndex > 0 && (
                <div className="border-t border-luna-gray-200 mb-3" />
              )}

              {/* Nav Items */}
              {section.items.map((item, itemIndex) => {
                const Icon = getIcon(item.icon);
                const isActive = pathname === item.href;

                const navLink = (
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`
                      flex items-center gap-3 transition-colors duration-150
                      ${isCollapsed ? 'justify-center p-2 rounded-md' : 'h-8 px-2 rounded-r-md'}
                      ${
                        isActive
                          ? 'text-luna-blue'
                          : 'text-luna-gray-600 rounded-md hover:bg-luna-gray-50 hover:text-luna-gray-900'
                      }
                    `}
                    style={isActive ? { backgroundColor: 'rgba(20, 73, 232, 0.06)', borderLeft: '3px solid #1449E8', borderRadius: '0 6px 6px 0' } : undefined}
                  >
                    <Icon
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-luna-blue' : 'text-luna-gray-500'
                      }`}
                    />
                    {!isCollapsed && (
                      <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                    )}
                  </Link>
                );

                return (
                  <div key={itemIndex} className="mb-0.5">
                    {isCollapsed ? (
                      <LunaTooltip>
                        <LunaTooltipTrigger asChild>{navLink}</LunaTooltipTrigger>
                        <LunaTooltipContent side="right">
                          {item.label}
                        </LunaTooltipContent>
                      </LunaTooltip>
                    ) : (
                      navLink
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </LunaTooltipProvider>
  );
}

