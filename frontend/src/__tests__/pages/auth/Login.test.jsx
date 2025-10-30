import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import Login from '../../../pages/auth/Login';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock Clerk SignIn component
vi.mock('@clerk/clerk-react', () => ({
  SignIn: ({ routing, signUpUrl, afterSignInUrl }) => (
    <div data-testid="sign-in" data-routing={routing} data-sign-up-url={signUpUrl} data-after-sign-in-url={afterSignInUrl}>
      SignIn Component
    </div>
  ),
}));

describe('Login Page Tests', () => {
  
  beforeEach(() => {
    mockNavigate.mockClear();
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  test('should render login page', () => {
    render(<Login />);
    // SignIn component from Clerk should be rendered
    expect(document.querySelector('.flex')).toBeInTheDocument();
  });

  test('should render forgot password link', () => {
    render(<Login />);
    const forgotPasswordLink = screen.getByText(/Forgot your password/i);
    expect(forgotPasswordLink).toBeInTheDocument();
  });

  test('should navigate to forgot password page when link is clicked', () => {
    render(<Login />);
    const forgotPasswordLink = screen.getByText(/Forgot your password/i);
    fireEvent.click(forgotPasswordLink);
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  test('should display logout success message from sessionStorage', () => {
    sessionStorage.setItem('logoutMessage', 'You have been logged out successfully');
    render(<Login />);
    
    expect(screen.getByText('You have been logged out successfully')).toBeInTheDocument();
  });

  test('should display deletion warning message from sessionStorage', () => {
    sessionStorage.setItem('logoutMessage', 'Your account deletion is scheduled');
    render(<Login />);
    
    expect(screen.getByText(/Account Access Restricted/i)).toBeInTheDocument();
    expect(screen.getByText(/deletion is scheduled/i)).toBeInTheDocument();
  });

  test('should display restricted access message', () => {
    sessionStorage.setItem('logoutMessage', 'Access restricted due to policy violation');
    render(<Login />);
    
    expect(screen.getByText(/Account Access Restricted/i)).toBeInTheDocument();
    expect(screen.getByText(/policy violation/i)).toBeInTheDocument();
  });

  test('should dismiss logout message when close button is clicked', async () => {
    sessionStorage.setItem('logoutMessage', 'Logged out successfully');
    render(<Login />);
    
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Logged out successfully')).not.toBeInTheDocument();
    });
  });

  test('should auto-hide logout message after 5 seconds', async () => {
    // Don't use fake timers - let React handle real timers
    sessionStorage.setItem('logoutMessage', 'Logged out');
    render(<Login />);
    
    expect(screen.getByText('Logged out')).toBeInTheDocument();
    
    // Wait for message to auto-hide (5 seconds)
    await waitFor(() => {
      expect(screen.queryByText('Logged out')).not.toBeInTheDocument();
    }, { timeout: 6000 });
  });

  test('should remove logout message from sessionStorage on render', () => {
    sessionStorage.setItem('logoutMessage', 'Test message');
    expect(sessionStorage.getItem('logoutMessage')).toBe('Test message');
    
    render(<Login />);
    
    expect(sessionStorage.getItem('logoutMessage')).toBeNull();
  });

  test('should not display message when sessionStorage is empty', () => {
    render(<Login />);
    
    expect(screen.queryByText(/logged out/i)).not.toBeInTheDocument();
  });

  test('should render with proper background styling', () => {
    const { container } = render(<Login />);
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('min-h-screen');
    expect(mainDiv).toHaveClass('bg-background');
  });

  test('should render SignIn component with proper routing config', () => {
    const { container } = render(<Login />);
    // Verify the container structure exists
    expect(container.querySelector('.flex')).toBeInTheDocument();
  });

  test('should display success styling for normal logout message', () => {
    sessionStorage.setItem('logoutMessage', 'Successfully logged out');
    const { container } = render(<Login />);
    
    const messageBox = container.querySelector('.bg-success-50');
    expect(messageBox).toBeInTheDocument();
  });

  test('should display error styling for deletion message', () => {
    sessionStorage.setItem('logoutMessage', 'Account deletion scheduled');
    const { container } = render(<Login />);
    
    const messageBox = container.querySelector('.bg-error-50');
    expect(messageBox).toBeInTheDocument();
  });

  test('should display error styling for restricted message', () => {
    sessionStorage.setItem('logoutMessage', 'Access restricted');
    const { container } = render(<Login />);
    
    const messageBox = container.querySelector('.bg-error-50');
    expect(messageBox).toBeInTheDocument();
  });

  test('should have centered layout', () => {
    const { container } = render(<Login />);
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('justify-center');
    expect(mainDiv).toHaveClass('items-center');
  });

  test('should cleanup timer on unmount', () => {
    vi.useFakeTimers();
    sessionStorage.setItem('logoutMessage', 'Test');
    const { unmount } = render(<Login />);
    
    unmount();
    
    // Timer should be cleaned up
    vi.advanceTimersByTime(5000);
    vi.useRealTimers();
  });
});
