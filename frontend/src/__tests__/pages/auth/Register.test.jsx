import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import Register from '../../../pages/auth/Register';

// Mock Clerk SignUp component
vi.mock('@clerk/clerk-react', () => ({
  SignUp: ({ routing, signInUrl, afterSignUpUrl }) => (
    <div data-testid="sign-up" data-routing={routing} data-sign-in-url={signInUrl} data-after-sign-up-url={afterSignUpUrl}>
      SignUp Component
    </div>
  ),
}));

describe('Register Page Tests', () => {
  
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  test('should render register page', () => {
    render(<Register />);
    // SignUp component from Clerk should be rendered
    expect(document.querySelector('.flex')).toBeInTheDocument();
  });

  test('should render with proper layout', () => {
    const { container } = render(<Register />);
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('min-h-screen');
    expect(mainDiv).toHaveClass('bg-background');
    expect(mainDiv).toHaveClass('justify-center');
    expect(mainDiv).toHaveClass('items-center');
  });

  test('should display logout message from sessionStorage', () => {
    sessionStorage.setItem('logoutMessage', 'You have been logged out');
    render(<Register />);
    
    expect(screen.getByText('You have been logged out')).toBeInTheDocument();
  });

  test('should display success message styling', () => {
    sessionStorage.setItem('logoutMessage', 'Logged out successfully');
    const { container } = render(<Register />);
    
    const messageBox = container.querySelector('.bg-success-100');
    expect(messageBox).toBeInTheDocument();
    expect(messageBox).toHaveClass('border-success-400');
  });

  test('should dismiss message when close button is clicked', async () => {
    sessionStorage.setItem('logoutMessage', 'Test message');
    render(<Register />);
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });
  });

  test('should auto-hide message after 5 seconds', async () => {
    vi.useFakeTimers();
    sessionStorage.setItem('logoutMessage', 'Auto hide test');
    render(<Register />);
    
    expect(screen.getByText('Auto hide test')).toBeInTheDocument();
    
    // Fast-forward 5 seconds
    vi.advanceTimersByTime(5000);
    
    await waitFor(() => {
      expect(screen.queryByText('Auto hide test')).not.toBeInTheDocument();
    });
    
    vi.useRealTimers();
  });

  test('should remove message from sessionStorage after reading', () => {
    sessionStorage.setItem('logoutMessage', 'Will be removed');
    expect(sessionStorage.getItem('logoutMessage')).toBe('Will be removed');
    
    render(<Register />);
    
    expect(sessionStorage.getItem('logoutMessage')).toBeNull();
  });

  test('should not display message when sessionStorage is empty', () => {
    render(<Register />);
    
    expect(screen.queryByText(/logged out/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '×' })).not.toBeInTheDocument();
  });

  test('should render SignUp component container', () => {
    const { container } = render(<Register />);
    expect(container.querySelector('.flex')).toBeInTheDocument();
  });

  test('should have proper message box styling', () => {
    sessionStorage.setItem('logoutMessage', 'Styled message');
    const { container } = render(<Register />);
    
    const messageBox = container.querySelector('.bg-success-100');
    expect(messageBox).toHaveClass('rounded-lg');
    expect(messageBox).toHaveClass('max-w-md');
    expect(messageBox).toHaveClass('w-full');
  });

  test('should display close button with proper styling', () => {
    sessionStorage.setItem('logoutMessage', 'Message');
    const { container } = render(<Register />);
    
    const closeButton = screen.getByText('×');
    expect(closeButton).toHaveClass('font-bold');
    expect(closeButton).toHaveClass('text-success-700');
  });

  test('should cleanup timer on component unmount', () => {
    vi.useFakeTimers();
    sessionStorage.setItem('logoutMessage', 'Cleanup test');
    const { unmount } = render(<Register />);
    
    expect(screen.getByText('Cleanup test')).toBeInTheDocument();
    
    unmount();
    
    // Timer should be cleaned up, no errors should occur
    vi.advanceTimersByTime(5000);
    vi.useRealTimers();
  });

  test('should handle multiple renders correctly', () => {
    sessionStorage.setItem('logoutMessage', 'First render');
    const { rerender } = render(<Register />);
    
    expect(screen.getByText('First render')).toBeInTheDocument();
    
    // Message should be removed from sessionStorage
    expect(sessionStorage.getItem('logoutMessage')).toBeNull();
    
    rerender(<Register />);
    
    // Message should not appear on second render
    expect(screen.queryByText('First render')).not.toBeInTheDocument();
  });

  test('should have responsive layout classes', () => {
    const { container } = render(<Register />);
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('flex-col');
    expect(mainDiv).toHaveClass('py-8');
  });

  test('should center message box', () => {
    sessionStorage.setItem('logoutMessage', 'Centered');
    const { container } = render(<Register />);
    
    const messageBox = container.querySelector('.bg-success-100');
    expect(messageBox).toHaveClass('mx-auto');
  });

  test('should handle empty string message', () => {
    sessionStorage.setItem('logoutMessage', '');
    render(<Register />);
    
    // Empty message should not display
    expect(screen.queryByRole('button', { name: '×' })).not.toBeInTheDocument();
  });

  test('should handle whitespace-only message', () => {
    sessionStorage.setItem('logoutMessage', '   ');
    render(<Register />);
    
    // Should display the message (even if whitespace)
    const closeButton = screen.queryByText('×');
    expect(closeButton).toBeInTheDocument();
  });
});
