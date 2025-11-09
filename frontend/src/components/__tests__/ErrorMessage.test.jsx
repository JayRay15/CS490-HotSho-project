import { render, screen, fireEvent } from '@testing-library/react';
import ErrorMessage, { FieldError } from '../ErrorMessage.jsx';

describe('ErrorMessage', () => {
  test('renders provided message', () => {
    const error = { customError: { message: 'Something went wrong' } };
    render(<ErrorMessage error={error} />);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  test('shows network heading and Try Again when retryable', () => {
    const onRetry = vi.fn();
    const error = { customError: { isNetworkError: true, canRetry: true, message: 'net fail' } };
    render(<ErrorMessage error={error} onRetry={onRetry} />);

    expect(screen.getByText(/network error/i)).toBeInTheDocument();
    const tryBtn = screen.getByText(/try again/i);
    expect(tryBtn).toBeInTheDocument();
    fireEvent.click(tryBtn);
    expect(onRetry).toHaveBeenCalled();
  });

  test('renders field-specific validation errors', () => {
    const error = { customError: { message: 'bad request', errors: [{ field: 'email', message: 'Invalid email' }] } };
    render(<ErrorMessage error={error} />);

    // should render list item with field and message
    expect(screen.getByText(/email:/i)).toBeInTheDocument();
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });

  test('renders Dismiss and top-right dismiss button and calls onDismiss', () => {
    const onDismiss = vi.fn();
    const error = { customError: { message: 'something' } };
    render(<ErrorMessage error={error} onDismiss={onDismiss} />);

    // There are two dismiss controls: the inline "Dismiss" button and the sr-only X button
    const dismissButtons = screen.getAllByRole('button', { name: /dismiss/i });
    expect(dismissButtons.length).toBeGreaterThanOrEqual(1);

    // Click both if present
    dismissButtons.forEach((btn) => fireEvent.click(btn));
    expect(onDismiss).toHaveBeenCalledTimes(dismissButtons.length);
  });

  describe('FieldError helper', () => {
    test('renders matching field message', () => {
      const err = { customError: { errors: [{ field: 'username', message: 'Required' }] } };
      render(<FieldError error={err} fieldName="username" />);
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });

    test('renders nothing when no matching field', () => {
      const err = { customError: { errors: [{ field: 'password', message: 'Too short' }] } };
      const { container } = render(<FieldError error={err} fieldName="username" />);
      expect(container).toBeEmptyDOMElement();
    });
  });
});


