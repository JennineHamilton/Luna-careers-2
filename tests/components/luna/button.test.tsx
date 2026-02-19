/**
 * Tests for Luna Button Component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LunaButton } from '@/components/luna/button';

describe('LunaButton', () => {
  it('should render button with text', () => {
    render(<LunaButton>Click me</LunaButton>);
    
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<LunaButton onClick={handleClick}>Click me</LunaButton>);
    
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<LunaButton disabled>Click me</LunaButton>);
    
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<LunaButton disabled onClick={handleClick}>Click me</LunaButton>);
    
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply variant classes', () => {
    const { rerender } = render(<LunaButton variant="primary">Primary</LunaButton>);
    
    let button = screen.getByRole('button');
    expect(button.className).toContain('bg-luna-purple-600');
    
    rerender(<LunaButton variant="outline">Outline</LunaButton>);
    
    button = screen.getByRole('button');
    expect(button.className).toContain('border');
  });

  it('should apply size classes', () => {
    const { rerender } = render(<LunaButton size="sm">Small</LunaButton>);
    
    let button = screen.getByRole('button');
    expect(button.className).toContain('text-sm');
    
    rerender(<LunaButton size="lg">Large</LunaButton>);
    
    button = screen.getByRole('button');
    expect(button.className).toContain('text-base');
  });

  it('should render as child component when asChild is true', () => {
    render(
      <LunaButton asChild>
        <a href="/test">Link Button</a>
      </LunaButton>
    );
    
    const link = screen.getByRole('link', { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('should apply custom className', () => {
    render(<LunaButton className="custom-class">Button</LunaButton>);
    
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('should show loading state', () => {
    render(<LunaButton loading>Loading</LunaButton>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    // You can add more specific loading state checks based on your implementation
  });
});

