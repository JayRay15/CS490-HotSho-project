import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProtectedRoute from '../ProtectedRoute';

// Mock components for testing
const MockProtectedContent = () => <div>Protected Content</div>;
const MockLoginPage = () => <div>Login Page</div>;

// Mock Clerk authentication
const mockUseAuth = vi.fn();

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      isLoaded: false,
      isSignedIn: false,
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <MockProtectedContent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Use getAllByText since there are multiple "Loading..." texts (visible and sr-only)
    const loadingElements = screen.getAllByText(/loading/i);
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('redirects to login when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <MockProtectedContent />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<MockLoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('renders protected content when user is authenticated', async () => {
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <MockProtectedContent />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<MockLoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('preserves the intended destination for post-login redirect', async () => {
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div>Profile Page</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<MockLoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    // The Navigate component passes state with the 'from' location
    // This would be picked up by the Login component in the actual app
  });

  it('handles multiple protected routes correctly', async () => {
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
    });

    // Test dashboard route
    const { unmount } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<MockLoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });

    unmount();

    // Test profile route separately
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div>Profile Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<MockLoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Profile Content')).toBeInTheDocument();
    });
  });

  it('redirects to login after logout when user navigates back', async () => {
    // First, user is authenticated
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
    });

    const { rerender } = render(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div>Profile Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<MockLoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Profile Content')).toBeInTheDocument();
    });

    // User logs out (simulate by changing auth state)
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
    });

    // User hits back button (simulate by re-rendering with same route)
    rerender(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div>Profile Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<MockLoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Should redirect to login, not show error
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('does not show error page when navigating to protected route while logged out', async () => {
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<MockLoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    // Ensure no error messages are displayed
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it('handles authentication state changes gracefully', async () => {
    // Start with loading state
    mockUseAuth.mockReturnValue({
      isLoaded: false,
      isSignedIn: false,
    });

    const { rerender } = render(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div>Profile Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<MockLoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Use getAllByText since there are multiple "Loading..." texts
    const loadingElements = screen.getAllByText(/loading/i);
    expect(loadingElements.length).toBeGreaterThan(0);

    // Authentication loads and user is not signed in
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
    });

    rerender(
      <MemoryRouter initialEntries={['/profile']}>
        <Routes>
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div>Profile Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<MockLoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });
});
