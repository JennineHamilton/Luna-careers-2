'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CommandItem {
  /** Item value */
  value: string;
  /** Item label */
  label: string;
  /** Item icon */
  icon?: React.ReactNode;
  /** Item keywords for search */
  keywords?: string[];
  /** Item action */
  onSelect?: () => void;
}

export interface CommandGroup {
  /** Group heading */
  heading: string;
  /** Group items */
  items: CommandItem[];
}

export interface LunaCommandPaletteProps {
  /** Open state */
  open: boolean;
  /** Open state change handler */
  onOpenChange: (open: boolean) => void;
  /** Command groups */
  groups: CommandGroup[];
  /** Placeholder text */
  placeholder?: string;
  /** Empty state text */
  emptyText?: string;
}

/**
 * LunaCommandPalette - Command palette for quick navigation (Cmd+K).
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * useEffect(() => {
 *   const down = (e: KeyboardEvent) => {
 *     if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
 *       e.preventDefault();
 *       setOpen((open) => !open);
 *     }
 *   };
 *   document.addEventListener('keydown', down);
 *   return () => document.removeEventListener('keydown', down);
 * }, []);
 *
 * <LunaCommandPalette
 *   open={open}
 *   onOpenChange={setOpen}
 *   groups={[
 *     {
 *       heading: 'Navigation',
 *       items: [
 *         { value: 'dashboard', label: 'Dashboard', onSelect: () => router.push('/dashboard') }
 *       ]
 *     }
 *   ]}
 * />
 * ```
 */
export function LunaCommandPalette({
  open,
  onOpenChange,
  groups,
  placeholder = 'Type a command or search...',
  emptyText = 'No results found.',
}: LunaCommandPaletteProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <CommandPrimitive
            data-slot="luna-command-palette"
            className="overflow-hidden rounded-lg border border-luna-gray-200 bg-white shadow-lg"
          >
            <div className="flex items-center border-b border-luna-gray-200 px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandPrimitive.Input
                placeholder={placeholder}
                className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-luna-gray-450 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <CommandPrimitive.List className="max-h-[400px] overflow-y-auto p-2">
              <CommandPrimitive.Empty className="py-6 text-center text-sm text-luna-gray-450">
                {emptyText}
              </CommandPrimitive.Empty>

              {groups.map((group, groupIndex) => (
                <CommandPrimitive.Group
                  key={groupIndex}
                  heading={group.heading}
                  className="overflow-hidden [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-luna-gray-600"
                >
                  {group.items.map((item) => (
                    <CommandPrimitive.Item
                      key={item.value}
                      value={item.value}
                      keywords={item.keywords}
                      onSelect={() => {
                        item.onSelect?.();
                        onOpenChange(false);
                      }}
                      className={cn(
                        'relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-2 text-sm outline-none',
                        'data-[selected=true]:bg-luna-gray-50 data-[selected=true]:text-luna-gray-900',
                        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                      )}
                    >
                      {item.icon && (
                        <div className="flex h-4 w-4 items-center justify-center">
                          {item.icon}
                        </div>
                      )}
                      <span>{item.label}</span>
                    </CommandPrimitive.Item>
                  ))}
                </CommandPrimitive.Group>
              ))}
            </CommandPrimitive.List>
          </CommandPrimitive>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

