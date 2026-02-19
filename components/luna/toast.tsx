'use client';

import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LunaToastProps extends React.ComponentProps<typeof ToastPrimitive.Root> {
  /** Toast variant */
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  /** Toast title */
  title?: string;
  /** Toast description */
  description?: string;
  /** Show close button */
  showClose?: boolean;
}

export interface LunaToastProviderProps extends React.ComponentProps<typeof ToastPrimitive.Provider> {}

export interface LunaToastViewportProps extends React.ComponentProps<typeof ToastPrimitive.Viewport> {}

/**
 * LunaToast - Toast notification component.
 *
 * @example
 * ```tsx
 * // In your root layout:
 * <LunaToastProvider>
 *   {children}
 *   <LunaToastViewport />
 * </LunaToastProvider>
 *
 * // In your component:
 * const [open, setOpen] = useState(false);
 * <LunaToast open={open} onOpenChange={setOpen} variant="success" title="Success!" />
 * ```
 */
export function LunaToastProvider({ children, ...props }: LunaToastProviderProps) {
  return <ToastPrimitive.Provider {...props}>{children}</ToastPrimitive.Provider>;
}

export function LunaToastViewport({ className, ...props }: LunaToastViewportProps) {
  return (
    <ToastPrimitive.Viewport
      className={cn(
        'fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-auto sm:bottom-0 sm:right-0 sm:flex-col md:max-w-[420px]',
        className
      )}
      {...props}
    />
  );
}

export function LunaToast({
  variant = 'default',
  title,
  description,
  showClose = true,
  className,
  ...props
}: LunaToastProps) {
  const variantStyles = {
    default: 'bg-white border-luna-gray-200',
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  };

  const iconMap = {
    default: null,
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
  };

  return (
    <ToastPrimitive.Root
      data-slot="luna-toast"
      className={cn(
        'group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 shadow-lg transition-all',
        'data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {iconMap[variant] && <div className="flex-shrink-0">{iconMap[variant]}</div>}

      <div className="flex-1 grid gap-1">
        {title && (
          <ToastPrimitive.Title className="text-sm font-semibold text-luna-gray-900">
            {title}
          </ToastPrimitive.Title>
        )}
        {description && (
          <ToastPrimitive.Description className="text-sm text-luna-gray-600">
            {description}
          </ToastPrimitive.Description>
        )}
      </div>

      {showClose && (
        <ToastPrimitive.Close className="flex-shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-1 focus:ring-luna-blue">
          <X className="h-4 w-4" />
        </ToastPrimitive.Close>
      )}
    </ToastPrimitive.Root>
  );
}

