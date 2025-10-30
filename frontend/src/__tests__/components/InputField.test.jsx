import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import InputField from '../../components/InputField';

describe('InputField Component Tests', () => {
  
  test('should render input with label', () => {
    render(<InputField label="Email" id="email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  test('should render without label', () => {
    render(<InputField placeholder="Enter text" id="test" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  test('should handle onChange events', () => {
    const handleChange = vi.fn();
    render(<InputField onChange={handleChange} id="test" />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    expect(handleChange).toHaveBeenCalled();
  });

  test('should display error message', () => {
    render(<InputField error="This field is required" id="test" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  test('should display helper text', () => {
    render(<InputField helperText="Helper text here" id="test" />);
    expect(screen.getByText('Helper text here')).toBeInTheDocument();
  });

  test('should render password input', () => {
    const { container } = render(<InputField type="password" id="password" />);
    const input = container.querySelector('input[type="password"]');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'password');
  });

  test('should render email input', () => {
    render(<InputField type="email" id="email" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  test('should be required when required prop is true', () => {
    render(<InputField required label="Required Field" id="required" />);
    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
    // Required asterisk should be shown
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  test('should be disabled when disabled prop is true', () => {
    render(<InputField disabled id="disabled" />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  test('should apply custom className to input', () => {
    const { container } = render(<InputField className="custom-input" id="test" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('custom-input');
  });

  test('should render with placeholder', () => {
    render(<InputField placeholder="Enter your name" id="name" />);
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
  });

  test('should render with value prop (controlled)', () => {
    render(<InputField value="Controlled value" onChange={vi.fn()} id="test" />);
    expect(screen.getByDisplayValue('Controlled value')).toBeInTheDocument();
  });

  test('should show error styling when error prop is provided', () => {
    const { container } = render(<InputField error="Error message" id="test" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('border-error');
  });

  test('should handle focus events', () => {
    const handleFocus = vi.fn();
    render(<InputField onFocus={handleFocus} id="test" />);
    
    const input = screen.getByRole('textbox');
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalled();
  });

  test('should handle blur events', () => {
    const handleBlur = vi.fn();
    render(<InputField onBlur={handleBlur} id="test" />);
    
    const input = screen.getByRole('textbox');
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalled();
  });

  test('should associate label with input via htmlFor', () => {
    const { container } = render(<InputField id="email-input" label="Email Address" />);
    const label = container.querySelector('label[for="email-input"]');
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent('Email Address');
  });

  test('should have proper base styling', () => {
    const { container } = render(<InputField id="test" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('w-full');
    expect(input).toHaveClass('rounded-lg');
    expect(input).toHaveClass('border');
  });

  test('should show disabled styling', () => {
    const { container } = render(<InputField disabled id="test" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('cursor-not-allowed');
  });

  test('should have aria-invalid when error exists', () => {
    render(<InputField error="Error" id="test" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  test('should not have aria-invalid when no error', () => {
    render(<InputField id="test" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  test('should render number input', () => {
    render(<InputField type="number" id="quantity" />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('type', 'number');
  });
});
