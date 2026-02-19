'use client';

import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * LunaAccordion - Root accordion component.
 */
export function LunaAccordion(
  props: React.ComponentProps<typeof AccordionPrimitive.Root>
) {
  return <AccordionPrimitive.Root data-slot="luna-accordion" {...props} />;
}

export interface LunaAccordionItemProps
  extends React.ComponentProps<typeof AccordionPrimitive.Item> {}

/**
 * LunaAccordionItem - Individual accordion item.
 */
export function LunaAccordionItem({
  className,
  ...props
}: LunaAccordionItemProps) {
  return (
    <AccordionPrimitive.Item
      data-slot="luna-accordion-item"
      className={cn('border-b border-luna-border-default', className)}
      {...props}
    />
  );
}

export interface LunaAccordionTriggerProps
  extends React.ComponentProps<typeof AccordionPrimitive.Trigger> {}

/**
 * LunaAccordionTrigger - Clickable header that toggles the accordion item.
 */
export function LunaAccordionTrigger({
  className,
  children,
  ...props
}: LunaAccordionTriggerProps) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="luna-accordion-trigger"
        className={cn(
          'flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all',
          'hover:text-luna-blue focus:outline-none',
          'text-luna-gray-900',
          '[&[data-state=open]>svg]:rotate-180',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 text-luna-gray-600 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export interface LunaAccordionContentProps
  extends React.ComponentProps<typeof AccordionPrimitive.Content> {}

/**
 * LunaAccordionContent - Collapsible content area.
 */
export function LunaAccordionContent({
  className,
  children,
  ...props
}: LunaAccordionContentProps) {
  return (
    <AccordionPrimitive.Content
      data-slot="luna-accordion-content"
      className={cn(
        'overflow-hidden text-sm text-luna-gray-600',
        'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down'
      )}
      {...props}
    >
      <div className={cn('pb-4 pt-0', className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

