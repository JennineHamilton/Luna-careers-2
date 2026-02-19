'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Luna Avatar size variants.
 */
const lunaAvatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        xs: 'h-6 w-6',
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

/**
 * Text size mapping for fallback initials.
 */
const textSizeMap: Record<string, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

/**
 * Status indicator colors.
 */
const statusColorMap: Record<string, string> = {
  online: 'bg-luna-success',
  offline: 'bg-luna-gray-400',
  busy: 'bg-luna-error',
};

export interface LunaAvatarProps
  extends React.ComponentProps<typeof AvatarPrimitive.Root>,
    VariantProps<typeof lunaAvatarVariants> {
  /** Image source URL */
  src?: string;
  /** Alt text for the image */
  alt?: string;
  /** Fallback text (initials) or React node when image fails to load */
  fallback?: string | React.ReactNode;
  /** Status indicator */
  status?: 'online' | 'offline' | 'busy';
  /** Add ring (useful for stacked avatars) */
  ring?: boolean;
}

/**
 * LunaAvatar - User avatar display with Luna styling.
 *
 * @example
 * ```tsx
 * <LunaAvatar
 *   src="/user.jpg"
 *   alt="John Doe"
 *   fallback="JD"
 *   size="lg"
 *   status="online"
 * />
 * ```
 */
export function LunaAvatar({
  className,
  size = 'md',
  src,
  alt,
  fallback,
  status,
  ring = false,
  ...props
}: LunaAvatarProps) {
  const textSize = textSizeMap[size || 'md'];

  return (
    <div className="relative inline-block">
      <AvatarPrimitive.Root
        data-slot="luna-avatar"
        data-size={size}
        className={cn(
          lunaAvatarVariants({ size }),
          ring && 'ring-2 ring-white',
          className
        )}
        {...props}
      >
        {src && (
          <AvatarPrimitive.Image
            data-slot="luna-avatar-image"
            src={src}
            alt={alt}
            className="aspect-square h-full w-full object-cover"
          />
        )}
        <AvatarPrimitive.Fallback
          data-slot="luna-avatar-fallback"
          className={cn(
            'flex h-full w-full items-center justify-center rounded-full bg-luna-blue text-white font-medium',
            textSize
          )}
        >
          {fallback || alt?.charAt(0)?.toUpperCase() || '?'}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
      {status && (
        <span
          data-slot="luna-avatar-status"
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
            size === 'xs' && 'h-1.5 w-1.5',
            size === 'sm' && 'h-2 w-2',
            size === 'md' && 'h-2.5 w-2.5',
            size === 'lg' && 'h-3 w-3',
            size === 'xl' && 'h-4 w-4',
            statusColorMap[status]
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

export { lunaAvatarVariants };

