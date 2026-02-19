'use client';

import type { UserContext } from '@/types/auth.types';

interface ContextSwitcherProps {
  currentContext: UserContext;
  onSwitch?: (newContext: UserContext) => void;
}

/**
 * Context Switcher Component
 * Allows hybrid users to switch between personal and organization contexts
 * 
 * TODO: Implement UI with dropdown menu
 * - Show current context indicator
 * - Dropdown with personal/organization options
 * - Call /api/auth/switch-context on selection
 * - Handle loading state during switch
 * - Redirect to appropriate dashboard after switch
 */
export function ContextSwitcher({ currentContext, onSwitch }: ContextSwitcherProps) {
  const handleSwitch = async (newContext: UserContext) => {
    if (newContext === currentContext) return;

    try {
      const response = await fetch('/api/auth/switch-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: newContext }),
      });

      const data = await response.json();

      if (data.success && data.redirectUrl) {
        onSwitch?.(newContext);
        window.location.href = data.redirectUrl;
      }
    } catch (error) {
      console.error('Failed to switch context:', error);
    }
  };

  // Placeholder - actual UI will be implemented later
  return (
    <div className="context-switcher">
      <span>Current: {currentContext}</span>
      <button 
        onClick={() => handleSwitch(currentContext === 'personal' ? 'organization' : 'personal')}
        type="button"
      >
        Switch to {currentContext === 'personal' ? 'Organization' : 'Personal'}
      </button>
    </div>
  );
}

