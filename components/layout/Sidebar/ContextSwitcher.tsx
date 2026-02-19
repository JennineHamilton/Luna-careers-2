'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Building2 } from 'lucide-react';
import Image from 'next/image';
import {
  LunaDropdownMenu,
  LunaDropdownMenuTrigger,
  LunaDropdownMenuContent,
} from '@/components/luna';
import { getContextGradient, gradientToStyle } from '@/lib/utils/gradients';
import { useAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';

// Helper function to format user role to human-readable format
function formatUserRole(role: string): string {
  const roleMap: Record<string, string> = {
    'candidate': 'Candidate',
    'org_admin': 'Organization Admin',
    'org_recruiter': 'Recruiter',
    'org_hiring_manager': 'Hiring Manager',
    'super_admin': 'Super Admin',
    'moderator': 'Moderator',
    'support': 'Support',
  };
  return roleMap[role] || role;
}

interface ContextSwitcherProps {
  isCollapsed: boolean;
}

interface OrganizationInfo {
  id: string;
  name: string;
  slug: string | null;
}

export default function ContextSwitcher({ isCollapsed }: ContextSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
  const { user, switchContext, isLoading } = useAuth();

  // Fetch organization info if user is hybrid
  useEffect(() => {
    async function fetchOrganization() {
      if (!user?.organizationId) {
        return;
      }
      const supabase = createClient();
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .eq('id', user.organizationId)
        .single();

      if (data) {
        setOrganization(data);
      }
    }

    fetchOrganization();
  }, [user?.organizationId]);

  const handleContextSwitch = async (newContext: 'personal' | 'organization') => {
    if (!user || user.accountType !== 'hybrid') return;
    if (newContext === user.currentContext) {
      setIsOpen(false);
      return;
    }

    try {
      await switchContext(newContext);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch context:', error);
    }
  };

  if (isLoading || !user) {
    return null;
  }

  // Only show for hybrid users
  if (user.accountType !== 'hybrid') {
    return null;
  }

  const currentContext = user.currentContext || 'personal';
  const currentGradient = getContextGradient(currentContext);
  const displayName = currentContext === 'personal' ? user.fullName : (organization?.name || 'Organization');
  const displayRole = currentContext === 'personal' ? 'Personal' : formatUserRole(user.userRole);

  // Determine which avatar to show
  const avatarUrl = currentContext === 'personal' ? user.avatarUrl : user.organizationLogoUrl;
  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <LunaDropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <LunaDropdownMenuTrigger asChild>
        <button
          className={`
            flex items-center gap-2 rounded-md transition-colors w-full
            hover:bg-luna-gray-50 p-[5px] border border-luna-gray-200
            ${isCollapsed ? 'justify-center' : ''}
          `}
          aria-label="Switch context"
        >
          {/* Avatar - scales down when collapsed to maintain 5px padding on all sides */}
          <div
            className={`flex items-center justify-center font-semibold rounded-md text-white flex-shrink-0 overflow-hidden ${
              isCollapsed ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
            }`}
            style={avatarUrl ? {} : gradientToStyle(currentGradient)}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={isCollapsed ? 28 : 36}
                height={isCollapsed ? 28 : 36}
                className="object-cover w-full h-full"
              />
            ) : currentContext === 'personal' ? (
              initials
            ) : (
              <Building2 className={isCollapsed ? 'w-4 h-4' : 'w-[18px] h-[18px]'} />
            )}
          </div>

          {/* Name & Role (only when expanded) */}
          {!isCollapsed && (
            <>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-medium text-luna-gray-900 truncate leading-tight">
                  {displayName}
                </div>
                <div className="text-xs text-luna-gray-600 truncate leading-tight">
                  {displayRole}
                </div>
              </div>
              <ChevronDown
                className={`w-[18px] h-[18px] text-luna-gray-600 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </>
          )}
        </button>
      </LunaDropdownMenuTrigger>

      <LunaDropdownMenuContent
        className="w-[var(--radix-dropdown-menu-trigger-width)] p-2"
        align={isCollapsed ? 'start' : 'start'}
        sideOffset={8}
      >
        {/* Current Context Section - Active state with background */}
        <div className="mb-2">
          <div className="w-full flex items-center gap-2 rounded-md p-[5px] bg-luna-gray-50">
            {/* Avatar */}
            <div
              className="w-9 h-9 flex items-center justify-center font-semibold rounded-md text-white text-sm flex-shrink-0 overflow-hidden"
              style={avatarUrl ? {} : gradientToStyle(currentGradient)}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={36}
                  height={36}
                  className="object-cover w-full h-full"
                />
              ) : currentContext === 'personal' ? (
                initials
              ) : (
                <Building2 className="w-[18px] h-[18px]" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-luna-gray-900 truncate leading-tight">
                {displayName}
              </p>
              <p className="text-xs text-luna-gray-600 truncate leading-tight">
                {displayRole}
              </p>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-luna-gray-200 my-2" />

        {/* Switch Options - Only show the OTHER context, not the current one */}
        <div className="space-y-1">
          {/* Personal Context - Only show if NOT current context */}
          {currentContext !== 'personal' && (
            <button
              onClick={() => handleContextSwitch('personal')}
              className="w-full flex items-center gap-2 rounded-md p-[5px] transition-colors hover:bg-luna-gray-50"
            >
              <div
                className="w-9 h-9 flex items-center justify-center font-semibold rounded-md text-white text-sm flex-shrink-0 overflow-hidden"
                style={user.avatarUrl ? {} : gradientToStyle(getContextGradient('personal'))}
              >
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.fullName}
                    width={36}
                    height={36}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-luna-gray-900 truncate leading-tight">
                  {user.fullName}
                </p>
                <p className="text-xs text-luna-gray-600 truncate leading-tight">
                  Personal
                </p>
              </div>
            </button>
          )}

          {/* Organization Context - Only show if NOT current context */}
          {currentContext !== 'organization' && organization && (
            <button
              onClick={() => handleContextSwitch('organization')}
              className="w-full flex items-center gap-2 rounded-md p-[5px] transition-colors hover:bg-luna-gray-50"
            >
              <div
                className="w-9 h-9 flex items-center justify-center rounded-md text-white flex-shrink-0 overflow-hidden"
                style={user.organizationLogoUrl ? {} : gradientToStyle(getContextGradient('organization'))}
              >
                {user.organizationLogoUrl ? (
                  <Image
                    src={user.organizationLogoUrl}
                    alt={organization.name}
                    width={36}
                    height={36}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <Building2 className="w-[18px] h-[18px]" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium text-luna-gray-900 truncate leading-tight">
                  {organization.name}
                </p>
                <p className="text-xs text-luna-gray-600 truncate leading-tight">
                  {formatUserRole(user.userRole)}
                </p>
              </div>
            </button>
          )}
        </div>
      </LunaDropdownMenuContent>
    </LunaDropdownMenu>
  );
}

