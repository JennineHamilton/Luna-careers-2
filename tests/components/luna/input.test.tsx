/**
 * Tests for LunaInput Component
 * Tests input rendering, validation, error states, and accessibility
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LunaInput } from '@/components/luna/input';

describe('LunaInput', () => {
  describe('Rendering', () => {
    it('should render input with label', () => {
      render(<LunaInput label="Email" />);
      
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('should render input with placeholder', () => {
      render(<LunaInput placeholder="Enter your email" />);
      
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });

    it('should render required indicator', () => {
      render(<LunaInput label="Email" required />);
      
      const label = screen.getByText('Email');
      expect(label.querySelector('[aria-hidden="true"]')).toHaveTextContent('*');
    });

    it('should render helper text', () => {
      render(<LunaInput label="Email" helperText="We'll never share your email" />);
      
      expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
    });

    it('should render error message', () => {
      render(<LunaInput label="Email" error="Email is required" />);
      
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('User Interaction', () => {
    it('should handle text input', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<LunaInput label="Email" onChange={handleChange} />);
      
      const input = screen.getByLabelText('Email');
      await user.type(input, 'test@example.com');
      
      expect(input).toHaveValue('test@example.com');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should handle focus and blur', async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();
      
      render(<LunaInput label="Email" onFocus={handleFocus} onBlur={handleBlur} />);
      
      const input = screen.getByLabelText('Email');
      await user.click(input);
      expect(handleFocus).toHaveBeenCalled();
      
      await user.tab();
      expect(handleBlur).toHaveBeenCalled();
    });

    it('should not allow input when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<LunaInput label="Email" disabled onChange={handleChange} />);
      
      const input = screen.getByLabelText('Email');
      await user.type(input, 'test');
      
      expect(input).toHaveValue('');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Input Types', () => {
    it('should render password input', () => {
      render(<LunaInput label="Password" type="password" />);
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render email input', () => {
      render(<LunaInput label="Email" type="email" />);
      
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render number input', () => {
      render(<LunaInput label="Age" type="number" />);
      
      const input = screen.getByLabelText('Age');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('Validation States', () => {
    it('should show error state', () => {
      render(<LunaInput label="Email" error="Invalid email" />);
      
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('should associate error with input via aria-describedby', () => {
      render(<LunaInput label="Email" error="Invalid email" />);
      
      const input = screen.getByLabelText('Email');
      const errorId = input.getAttribute('aria-describedby');
      
      expect(errorId).toBeTruthy();
      expect(screen.getByText('Invalid email')).toHaveAttribute('id', errorId);
    });

    it('should associate helper text with input via aria-describedby', () => {
      render(<LunaInput label="Email" helperText="Enter your email address" />);
      
      const input = screen.getByLabelText('Email');
      const helperId = input.getAttribute('aria-describedby');
      
      expect(helperId).toBeTruthy();
      expect(screen.getByText('Enter your email address')).toHaveAttribute('id', helperId);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<LunaInput label="Email" required />);
      
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      
      render(<LunaInput label="Email" onChange={handleChange} />);
      
      await user.tab();
      const input = screen.getByLabelText('Email');
      expect(input).toHaveFocus();
      
      await user.keyboard('test@example.com');
      expect(input).toHaveValue('test@example.com');
    });
  });
});

