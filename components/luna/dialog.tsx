'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * LunaDialog - Root component for modal dialogs.
 */
export function LunaDialog(
  props: React.ComponentProps<typeof DialogPrimitive.Root>
) {
  return <DialogPrimitive.Root data-slot="luna-dialog" {...props} />;
}

/**
 * LunaDialogTrigger - Button/element that opens the dialog.
 */
export function LunaDialogTrigger(
  props: React.ComponentProps<typeof DialogPrimitive.Trigger>
) {
  return <DialogPrimitive.Trigger data-slot="luna-dialog-trigger" {...props} />;
}

/**
 * LunaDialogClose - Button/element that closes the dialog.
 */
export function LunaDialogClose(
  props: React.ComponentProps<typeof DialogPrimitive.Close>
) {
  return <DialogPrimitive.Close data-slot="luna-dialog-close" {...props} />;
}

export interface LunaDialogContentProps
  extends React.ComponentProps<typeof DialogPrimitive.Content> {
  /** Show close button in top right corner */
  showCloseButton?: boolean;
}

/**
 * LunaDialogContent - The modal content wrapper.
 */
export function LunaDialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: LunaDialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        data-slot="luna-dialog-overlay"
        className="fixed inset-0 z-50 bg-luna-navy/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
      />
      <DialogPrimitive.Content
        data-slot="luna-dialog-content"
        className={cn(
          'fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]',
          'bg-white shadow-xl rounded-lg',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
          'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          'duration-200',
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            className="absolute right-6 top-6 z-10 rounded-sm p-1 text-luna-gray-500 opacity-70 transition-opacity hover:opacity-100 hover:text-luna-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luna-blue focus-visible:ring-offset-2"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export interface LunaDialogHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * LunaDialogHeader - Header section with title and description.
 * Has Luna light background and proper padding.
 */
export function LunaDialogHeader({
  className,
  ...props
}: LunaDialogHeaderProps) {
  return (
    <div
      data-slot="luna-dialog-header"
      className={cn(
        'flex flex-col gap-2 bg-luna-gray-50 px-6 py-5 border-b border-luna-border-light',
        className
      )}
      {...props}
    />
  );
}

export interface LunaDialogTitleProps
  extends React.ComponentProps<typeof DialogPrimitive.Title> {}

/**
 * LunaDialogTitle - The dialog title.
 */
export function LunaDialogTitle({
  className,
  ...props
}: LunaDialogTitleProps) {
  return (
    <DialogPrimitive.Title
      data-slot="luna-dialog-title"
      className={cn('text-luna-gray-900 font-semibold text-xl', className)}
      {...props}
    />
  );
}

export interface LunaDialogDescriptionProps
  extends React.ComponentProps<typeof DialogPrimitive.Description> {}

/**
 * LunaDialogDescription - The dialog description.
 */
export function LunaDialogDescription({
  className,
  ...props
}: LunaDialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      data-slot="luna-dialog-description"
      className={cn('text-luna-gray-600 text-sm', className)}
      {...props}
    />
  );
}

export interface LunaDialogBodyProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Disable automatic scrolling behavior. Default: false (scrolling enabled) */
  disableScroll?: boolean;
}

/**
 * LunaDialogBody - Main content area with standard padding.
 * By default, content is scrollable between header and footer with max-h-[calc(100vh-200px)] overflow-y-auto.
 * Set disableScroll={true} to disable this behavior.
 */
export function LunaDialogBody({
  className,
  disableScroll = false,
  ...props
}: LunaDialogBodyProps) {
  return (
    <div
      data-slot="luna-dialog-body"
      className={cn(
        'px-6 py-6',
        !disableScroll && 'max-h-[calc(100vh-200px)] overflow-y-auto',
        className
      )}
      {...props}
    />
  );
}

export interface LunaDialogFooterProps
  extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * LunaDialogFooter - Footer section with action buttons.
 * Has Luna light background and proper padding.
 */
export function LunaDialogFooter({
  className,
  ...props
}: LunaDialogFooterProps) {
  return (
    <div
      data-slot="luna-dialog-footer"
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end gap-3 bg-luna-gray-50 px-6 py-4 border-t border-luna-border-light',
        className
      )}
      {...props}
    />
  );
}

