'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

/**
 * LunaTooltipProvider - Wraps the app to enable tooltips.
 */
export function LunaTooltipProvider(
  props: React.ComponentProps<typeof TooltipPrimitive.Provider>
) {
  return <TooltipPrimitive.Provider {...props} />;
}

/**
 * LunaTooltip - Root tooltip component.
 */
export function LunaTooltip(
  props: React.ComponentProps<typeof TooltipPrimitive.Root>
) {
  return <TooltipPrimitive.Root {...props} />;
}

/**
 * LunaTooltipTrigger - Element that triggers the tooltip.
 */
export function LunaTooltipTrigger(
  props: React.ComponentProps<typeof TooltipPrimitive.Trigger>
) {
  return <TooltipPrimitive.Trigger data-slot="luna-tooltip-trigger" {...props} />;
}

export interface LunaTooltipContentProps
  extends React.ComponentProps<typeof TooltipPrimitive.Content> {
  /** Side offset from the trigger */
  sideOffset?: number;
}

/**
 * LunaTooltipContent - The tooltip content with Luna styling.
 *
 * @example
 * ```tsx
 * <LunaTooltip>
 *   <LunaTooltipTrigger asChild>
 *     <button>Hover me</button>
 *   </LunaTooltipTrigger>
 *   <LunaTooltipContent>
 *     Tooltip text
 *   </LunaTooltipContent>
 * </LunaTooltip>
 * ```
 */
export function LunaTooltipContent({
  className,
  sideOffset = 8,
  side = 'right',
  ...props
}: LunaTooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="luna-tooltip-content"
        sideOffset={sideOffset}
        side={side}
        className={cn(
          'z-50 overflow-hidden rounded-md px-3 py-2 text-xs font-medium',
          'bg-luna-navy text-white shadow-lg',
          'animate-in fade-in-0 zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'data-[side=bottom]:slide-in-from-top-2',
          'data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2',
          'data-[side=top]:slide-in-from-bottom-2',
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}

