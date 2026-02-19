'use client';

import { LunaEmptyState } from '@/components/luna/empty-state';
import { LunaButton } from '@/components/luna/button';
import { getIcon } from '@/lib/utils/icon-map';

interface AdminEmptyStateProps {
  icon: string; // Icon name as string
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * AdminEmptyState - Consistent empty state for admin pages
 */
export function AdminEmptyState({
  icon,
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  const Icon = getIcon(icon);

  return (
    <LunaEmptyState
      icon={Icon}
      title={title}
      description={description}
      action={
        action ? (
          <LunaButton onClick={action.onClick} variant="primary">
            {action.label}
          </LunaButton>
        ) : undefined
      }
    />
  );
}

