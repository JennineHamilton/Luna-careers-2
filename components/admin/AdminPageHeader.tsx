'use client';

import type { ReactNode } from 'react';
import { LunaButton } from '@/components/luna/button';
import { getIcon } from '@/lib/utils/icon-map';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: string; // Icon name as string
  };
  backLink?: {
    href: string;
    label: string;
  };
  children?: ReactNode;
}

/**
 * AdminPageHeader - Consistent header for admin pages
 * Clean, sophisticated design with optional action button and back link
 */
export function AdminPageHeader({
  title,
  description,
  action,
  backLink,
  children,
}: AdminPageHeaderProps) {
  const ActionIcon = action?.icon ? getIcon(action.icon) : null;

  return (
    <div className="mb-6">
      {backLink && (
        <Link
          href={backLink.href}
          className="inline-flex items-center gap-1 text-sm text-luna-gray-600 hover:text-luna-primary-600 transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          {backLink.label}
        </Link>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-luna-gray-900 mb-1">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-luna-gray-600">
              {description}
            </p>
          )}
        </div>
        {action && (
          <LunaButton
            onClick={action.onClick}
            variant="primary"
          >
            {ActionIcon && <ActionIcon className="w-4 h-4" />}
            {action.label}
          </LunaButton>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

