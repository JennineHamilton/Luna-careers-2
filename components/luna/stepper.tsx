'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  /** Step label */
  label: string;
  /** Step description */
  description?: string;
}

export interface LunaStepperProps {
  /** Array of steps */
  steps: Step[];
  /** Current active step (0-indexed) */
  currentStep: number;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Additional className */
  className?: string;
}

/**
 * LunaStepper - Multi-step indicator for forms and processes.
 *
 * @example
 * ```tsx
 * <LunaStepper
 *   steps={[
 *     { label: 'Personal Info', description: 'Basic details' },
 *     { label: 'Experience', description: 'Work history' },
 *     { label: 'Review', description: 'Confirm details' }
 *   ]}
 *   currentStep={1}
 * />
 * ```
 */
export function LunaStepper({
  steps,
  currentStep,
  orientation = 'horizontal',
  className,
}: LunaStepperProps) {
  return (
    <div
      data-slot="luna-stepper"
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col',
        className
      )}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isUpcoming = index > currentStep;

        return (
          <React.Fragment key={index}>
            {/* Step */}
            <div
              className={cn(
                'flex items-center gap-3',
                orientation === 'vertical' && 'pb-8 last:pb-0'
              )}
            >
              {/* Step Circle */}
              <div
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all',
                  isCompleted && 'bg-luna-blue border-luna-blue text-white',
                  isCurrent && 'border-luna-blue text-luna-blue bg-white',
                  isUpcoming && 'border-luna-gray-300 text-luna-gray-400 bg-white'
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>

              {/* Step Content */}
              <div className="flex flex-col">
                <span
                  className={cn(
                    'text-sm font-medium',
                    (isCompleted || isCurrent) && 'text-luna-gray-900',
                    isUpcoming && 'text-luna-gray-400'
                  )}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="text-xs text-luna-gray-600">{step.description}</span>
                )}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'transition-all',
                  orientation === 'horizontal'
                    ? 'flex-1 h-0.5 mx-2'
                    : 'w-0.5 h-8 ml-4 -mt-8',
                  index < currentStep ? 'bg-luna-blue' : 'bg-luna-gray-300'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

