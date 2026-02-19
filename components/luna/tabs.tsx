'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export interface LunaTabsProps extends React.ComponentProps<typeof TabsPrimitive.Root> {}

export interface LunaTabsListProps extends React.ComponentProps<typeof TabsPrimitive.List> {}

export interface LunaTabsTriggerProps extends React.ComponentProps<typeof TabsPrimitive.Trigger> {}

export interface LunaTabsContentProps extends React.ComponentProps<typeof TabsPrimitive.Content> {}

/**
 * LunaTabs - Tabbed content container.
 *
 * @example
 * ```tsx
 * <LunaTabs defaultValue="tab1">
 *   <LunaTabsList>
 *     <LunaTabsTrigger value="tab1">Tab 1</LunaTabsTrigger>
 *     <LunaTabsTrigger value="tab2">Tab 2</LunaTabsTrigger>
 *   </LunaTabsList>
 *   <LunaTabsContent value="tab1">Content 1</LunaTabsContent>
 *   <LunaTabsContent value="tab2">Content 2</LunaTabsContent>
 * </LunaTabs>
 * ```
 */
export function LunaTabs(props: LunaTabsProps) {
  return <TabsPrimitive.Root data-slot="luna-tabs" {...props} />;
}

export function LunaTabsList({ className, ...props }: LunaTabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex h-10 items-center justify-start rounded-md bg-luna-gray-50 p-1 text-luna-gray-600',
        'border border-luna-gray-200',
        className
      )}
      {...props}
    />
  );
}

export function LunaTabsTrigger({ className, ...props }: LunaTabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5',
        'text-sm font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luna-blue focus-visible:ring-offset-1',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:bg-white data-[state=active]:text-luna-gray-900 data-[state=active]:shadow-sm',
        'data-[state=inactive]:text-luna-gray-600 data-[state=inactive]:hover:text-luna-gray-900',
        className
      )}
      {...props}
    />
  );
}

export function LunaTabsContent({ className, ...props }: LunaTabsContentProps) {
  return (
    <TabsPrimitive.Content
      className={cn(
        'mt-4 focus:outline-none',
        className
      )}
      {...props}
    />
  );
}

