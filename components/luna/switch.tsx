'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

export interface LunaSwitchProps
  extends React.ComponentProps<typeof SwitchPrimitives.Root> {
  /** Label for the switch */
  label?: string;
  /** Description text */
  description?: string;
}

/**
 * LunaSwitch - A toggle switch component with Luna branding.
 *
 * @example
 * ```tsx
 * <LunaSwitch
 *   label="Enable notifications"
 *   description="Receive email updates"
 *   checked={enabled}
 *   onCheckedChange={setEnabled}
 * />
 * ```
 */
export function LunaSwitch({
  className,
  label,
  description,
  id,
  ...props
}: LunaSwitchProps) {
  const switchId = id || React.useId();

  const switchElement = (
    <SwitchPrimitives.Root
      id={switchId}
      data-slot="luna-switch"
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luna-blue focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-luna-blue data-[state=unchecked]:bg-luna-gray-300',
        className
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        data-slot="luna-switch-thumb"
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform',
          'data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0'
        )}
      />
    </SwitchPrimitives.Root>
  );

  if (!label && !description) {
    return switchElement;
  }

  return (
    <div data-slot="luna-switch-wrapper" className="flex items-start gap-3">
      {switchElement}
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <label
              htmlFor={switchId}
              className="text-sm font-medium text-luna-gray-900 cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-sm text-luna-gray-600">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}

