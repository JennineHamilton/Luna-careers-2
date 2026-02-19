'use client';

import { useState } from 'react';
import { Home, Inbox, Settings, Monitor, LogOut, Building2 } from 'lucide-react';
import Image from 'next/image';
import {
  LunaDropdownMenu,
  LunaDropdownMenuTrigger,
  LunaDropdownMenuContent,
  LunaDropdownMenuSeparator,
} from '@/components/luna';
import { getContextGradient, gradientToStyle } from '@/lib/utils/gradients';
import { useAuth } from '@/lib/auth';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut, isLoading } = useAuth();

  // Get user display info
  const displayName = user?.fullName || 'User';
  const displayEmail = user?.email || '';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const currentContext = user?.currentContext || 'personal';

  const currentGradient = getContextGradient(currentContext);

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
  };

  // Determine which avatar to show
  const avatarUrl = currentContext === 'personal' ? user?.avatarUrl : user?.organizationLogoUrl;

  return (
    <LunaDropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <LunaDropdownMenuTrigger asChild>
        <button
          className="flex items-center justify-center w-9 h-9 rounded-md font-semibold text-sm text-white hover:opacity-90 transition-opacity overflow-hidden"
          style={avatarUrl ? {} : gradientToStyle(currentGradient)}
          aria-label="User menu"
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
            initials || 'U'
          ) : (
            <Building2 className="w-[18px] h-[18px]" />
          )}
        </button>
      </LunaDropdownMenuTrigger>

      <LunaDropdownMenuContent className="w-[260px] p-3" align="end">
        {/* User Info Card */}
        <div className="flex items-center gap-2 rounded-md p-[5px] bg-luna-gray-50 mb-3">
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
            ) : (
              initials || 'U'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-luna-gray-900 truncate leading-tight">
              {isLoading ? 'Loading...' : displayName}
            </p>
            <p className="text-sm text-luna-gray-600 truncate leading-tight">
              {displayEmail}
            </p>
          </div>
        </div>

        <LunaDropdownMenuSeparator />

        {/* Menu Items */}
        <div className="space-y-1 my-3">
          <button className="w-full flex items-center gap-3 rounded-md p-2 hover:bg-luna-gray-50 transition-colors">
            <Inbox className="w-[18px] h-[18px] text-luna-gray-600" />
            <span className="text-sm font-normal text-luna-gray-600">Inbox</span>
          </button>

          <button className="w-full flex items-center gap-3 rounded-md p-2 hover:bg-luna-gray-50 transition-colors">
            <Home className="w-[18px] h-[18px] text-luna-gray-600" />
            <span className="text-sm font-normal text-luna-gray-600">
              Homepage
            </span>
          </button>

          <button className="w-full flex items-center gap-3 rounded-md p-2 hover:bg-luna-gray-50 transition-colors">
            <Settings className="w-[18px] h-[18px] text-luna-gray-600" />
            <span className="text-sm font-normal text-luna-gray-600">
              Settings
            </span>
          </button>

          <button className="w-full flex items-center gap-3 rounded-md p-2 hover:bg-luna-gray-50 transition-colors">
            <Monitor className="w-[18px] h-[18px] text-luna-gray-600" />
            <span className="text-sm font-normal text-luna-gray-600">
              Preferences
            </span>
          </button>
        </div>

        <LunaDropdownMenuSeparator />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-md p-2 mt-3 hover:bg-red-50 transition-colors group"
        >
          <LogOut className="w-[18px] h-[18px] text-luna-gray-600 group-hover:text-luna-error" />
          <span className="text-sm font-normal text-luna-gray-600 group-hover:text-luna-error">
            Log out
          </span>
        </button>
      </LunaDropdownMenuContent>
    </LunaDropdownMenu>
  );
}

