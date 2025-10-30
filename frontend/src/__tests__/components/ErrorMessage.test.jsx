import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import ErrorMessage from '../../components/ErrorMessage';

describe('ErrorMessage Component Tests', () => {
  
  test('should render error message text', () => {
    const error = { message: 'An error occurred' };
    render(<ErrorMessage error={error} />);
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
  });

  test('should render with custom error object', () => {
    const error = { 
      customError: { 
        message: 'Custom error message' 
      } 
    };
    render(<ErrorMessage error={error} />);
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  test('should not render when error is null', () => {
    const { container } = render(<ErrorMessage error={null} />);
    expect(container.firstChild).toBeNull();
  });

  test('should not render when error is undefined', () => {
    const { container } = render(<ErrorMessage error={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  test('should render with dismiss button when onDismiss is provided', () => {
    const handleDismiss = vi.fn();
    const error = { message: 'Dismissible error' };
    render(<ErrorMessage error={error} onDismiss={handleDismiss} />);
    
    const dismissButtons = screen.getAllByRole('button');
    expect(dismissButtons.length).toBeGreaterThan(0);
  });

  test('should call onDismiss when dismiss button is clicked', () => {
    const handleDismiss = vi.fn();
    const error = { message: 'Click to dismiss' };
    render(<ErrorMessage error={error} onDismiss={handleDismiss} />);
    
    const dismissButtons = screen.getAllByRole('button');
    fireEvent.click(dismissButtons[0]);
    expect(handleDismiss).toHaveBeenCalled();
  });

  test('should render retry button when onRetry is provided', () => {
    const handleRetry = vi.fn();
    const error = { 
      customError: { 
        message: 'Retriable error',
        canRetry: true
      } 
    };
    render(<ErrorMessage error={error} onRetry={handleRetry} />);
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  test('should call onRetry when retry button is clicked', () => {
    const handleRetry = vi.fn();
    const error = { 
      customError: { 
        message: 'Retriable error',
        canRetry: true
      } 
    };
    render(<ErrorMessage error={error} onRetry={handleRetry} />);
    
    fireEvent.click(screen.getByText('Try Again'));
    expect(handleRetry).toHaveBeenCalled();
  });

  test('should render field validation errors', () => {
    const error = { 
      customError: { 
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Invalid email' },
          { field: 'password', message: 'Too short' }
        ]
      } 
    };
    render(<ErrorMessage error={error} />);
    
    expect(screen.getByText(/email:/i)).toBeInTheDocument();
    expect(screen.getByText(/Invalid email/i)).toBeInTheDocument();
    expect(screen.getByText(/password:/i)).toBeInTheDocument();
    expect(screen.getByText(/Too short/i)).toBeInTheDocument();
  });

  test('should render network error title', () => {
    const error = { 
      customError: { 
        message: 'Connection failed',
        isNetworkError: true
      } 
    };
    render(<ErrorMessage error={error} />);
    expect(screen.getByText('Network Error')).toBeInTheDocument();
  });

  test('should render generic Error title for non-network errors', () => {
    const error = { message: 'Regular error' };
    render(<ErrorMessage error={error} />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  test('should render error icon', () => {
    const error = { message: 'Error with icon' };
    const { container } = render(<ErrorMessage error={error} />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  test('should have proper styling', () => {
    const error = { message: 'Styled error' };
    const { container } = render(<ErrorMessage error={error} />);
    const errorDiv = container.firstChild;
    expect(errorDiv).toHaveClass('rounded-lg');
    expect(errorDiv).toHaveClass('border-red-300');
    expect(errorDiv).toHaveClass('bg-red-50');
  });

  test('should apply custom className', () => {
    const error = { message: 'Custom class error' };
    const { container } = render(<ErrorMessage error={error} className="my-custom-class" />);
    const errorDiv = container.firstChild;
    expect(errorDiv).toHaveClass('my-custom-class');
  });

  test('should show dismiss X button when onDismiss provided', () => {
    const handleDismiss = vi.fn();
    const error = { message: 'With X button' };
    const { container } = render(<ErrorMessage error={error} onDismiss={handleDismiss} />);
    
    const dismissButtons = container.querySelectorAll('button');
    expect(dismissButtons.length).toBeGreaterThan(0);
    
    // Should have multiple "Dismiss" texts (button and sr-only)
    const dismissTexts = screen.getAllByText('Dismiss');
    expect(dismissTexts.length).toBeGreaterThan(0);
  });

  test('should not show retry button when canRetry is false', () => {
    const handleRetry = vi.fn();
    const error = { 
      customError: { 
        message: 'Non-retriable error',
        canRetry: false
      } 
    };
    render(<ErrorMessage error={error} onRetry={handleRetry} />);
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  test('should fallback to generic message when no message provided', () => {
    const error = {}; // Empty error object
    render(<ErrorMessage error={error} />);
    expect(screen.getByText('An error occurred')).toBeInTheDocument();
  });
});
