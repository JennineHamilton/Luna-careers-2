'use client';

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * LunaDropdownMenu - Root component for dropdown menus.
 */
export function LunaDropdownMenu(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Root>
) {
  return <DropdownMenuPrimitive.Root data-slot="luna-dropdown-menu" {...props} />;
}

/**
 * LunaDropdownMenuTrigger - Button/element that opens the menu.
 */
export function LunaDropdownMenuTrigger(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>
) {
  return (
    <DropdownMenuPrimitive.Trigger data-slot="luna-dropdown-menu-trigger" {...props} />
  );
}

/**
 * LunaDropdownMenuGroup - Groups menu items together.
 */
export function LunaDropdownMenuGroup(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Group>
) {
  return (
    <DropdownMenuPrimitive.Group data-slot="luna-dropdown-menu-group" {...props} />
  );
}

export interface LunaDropdownMenuContentProps
  extends React.ComponentProps<typeof DropdownMenuPrimitive.Content> {}

/**
 * LunaDropdownMenuContent - The dropdown menu content container.
 */
export function LunaDropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: LunaDropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="luna-dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[8rem] overflow-hidden rounded-md border border-luna-border-default bg-white shadow-lg',
          'p-1',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2',
          'data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2',
          'data-[side=top]:slide-in-from-bottom-2',
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export interface LunaDropdownMenuItemProps
  extends React.ComponentProps<typeof DropdownMenuPrimitive.Item> {
  /** Render as destructive/danger item */
  destructive?: boolean;
}

/**
 * LunaDropdownMenuItem - A menu item.
 */
export function LunaDropdownMenuItem({
  className,
  destructive = false,
  ...props
}: LunaDropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="luna-dropdown-menu-item"
      data-destructive={destructive}
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none transition-colors',
        'focus:bg-luna-gray-100',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        '[&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-luna-gray-500',
        destructive && 'text-luna-error focus:bg-luna-error/10 [&_svg]:text-luna-error',
        className
      )}
      {...props}
    />
  );
}

export interface LunaDropdownMenuLabelProps
  extends React.ComponentProps<typeof DropdownMenuPrimitive.Label> {}

/**
 * LunaDropdownMenuLabel - A label for grouping items.
 */
export function LunaDropdownMenuLabel({
  className,
  ...props
}: LunaDropdownMenuLabelProps) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="luna-dropdown-menu-label"
      className={cn('px-3 py-1.5 text-xs font-medium text-luna-gray-500', className)}
      {...props}
    />
  );
}

export interface LunaDropdownMenuSeparatorProps
  extends React.ComponentProps<typeof DropdownMenuPrimitive.Separator> {}

/**
 * LunaDropdownMenuSeparator - A separator between menu items.
 */
export function LunaDropdownMenuSeparator({
  className,
  ...props
}: LunaDropdownMenuSeparatorProps) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="luna-dropdown-menu-separator"
      className={cn('-mx-1 my-1 h-px bg-luna-border-light', className)}
      {...props}
    />
  );
}

/**
 * LunaDropdownMenuSub - Sub-menu container.
 */
export function LunaDropdownMenuSub(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>
) {
  return <DropdownMenuPrimitive.Sub data-slot="luna-dropdown-menu-sub" {...props} />;
}

export interface LunaDropdownMenuSubTriggerProps
  extends React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> {}

/**
 * LunaDropdownMenuSubTrigger - Trigger for a sub-menu.
 */
export function LunaDropdownMenuSubTrigger({
  className,
  children,
  ...props
}: LunaDropdownMenuSubTriggerProps) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="luna-dropdown-menu-sub-trigger"
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-sm px-3 py-2 text-sm outline-none',
        'focus:bg-luna-gray-100',
        'data-[state=open]:bg-luna-gray-100',
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

export interface LunaDropdownMenuSubContentProps
  extends React.ComponentProps<typeof DropdownMenuPrimitive.SubContent> {}

/**
 * LunaDropdownMenuSubContent - Content for a sub-menu.
 */
export function LunaDropdownMenuSubContent({
  className,
  ...props
}: LunaDropdownMenuSubContentProps) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="luna-dropdown-menu-sub-content"
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden rounded-md border border-luna-border-default bg-white shadow-lg p-1',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2',
        'data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2',
        'data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  );
}

export interface LunaDropdownMenuCheckboxItemProps
  extends React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> {}

/**
 * LunaDropdownMenuCheckboxItem - A checkbox menu item.
 */
export function LunaDropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: LunaDropdownMenuCheckboxItemProps) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="luna-dropdown-menu-checkbox-item"
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-sm py-2 pl-8 pr-3 text-sm outline-none transition-colors',
        'focus:bg-luna-gray-100',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

export interface LunaDropdownMenuRadioGroupProps
  extends React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup> {}

/**
 * LunaDropdownMenuRadioGroup - A group of radio menu items.
 */
export function LunaDropdownMenuRadioGroup(
  props: LunaDropdownMenuRadioGroupProps
) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="luna-dropdown-menu-radio-group"
      {...props}
    />
  );
}

export interface LunaDropdownMenuRadioItemProps
  extends React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem> {}

/**
 * LunaDropdownMenuRadioItem - A radio menu item.
 */
export function LunaDropdownMenuRadioItem({
  className,
  children,
  ...props
}: LunaDropdownMenuRadioItemProps) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="luna-dropdown-menu-radio-item"
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-sm py-2 pl-8 pr-3 text-sm outline-none transition-colors',
        'focus:bg-luna-gray-100',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <Circle className="h-2 w-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

