import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../../App';

// Mock Clerk authentication
const mockUseAuth = vi.fn();
const mockUseUser = vi.fn();

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => mockUseAuth(),
  useUser: () => mockUseUser(),
  SignedIn: ({ children }) => children,
  SignedOut: ({ children }) => children,
  UserButton: () => <div data-testid="user-button">User Button</div>,
  SignIn: () => <div data-testid="sign-in">Sign In Component</div>,
}));

// Mock API calls
vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  setAuthToken: vi.fn(),
}));

// Mock components to avoid complex rendering
vi.mock('../../components/Navbar', () => ({
  default: () => <nav data-testid="navbar">Navbar</nav>,
}));

vi.mock('../../components/Breadcrumb', () => ({
  default: () => <div data-testid="breadcrumb">Breadcrumb</div>,
}));

vi.mock('../../components/ErrorBoundary', () => ({
  default: ({ children }) => <div data-testid="error-boundary">{children}</div>,
}));

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dashboard Protection', () => {
    it('redirects unauthenticated users from dashboard to login', async () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        getToken: vi.fn(),
        signOut: vi.fn(),
      });
      mockUseUser.mockReturnValue({ user: null });

      const { container } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        // Should redirect to login page
        expect(screen.getByTestId('sign-in')).toBeInTheDocument();
      });
    });

    it('allows authenticated users to access dashboard', async () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        getToken: vi.fn().mockResolvedValue('mock-token'),
        signOut: vi.fn(),
      });
      mockUseUser.mockReturnValue({
        user: { id: 'user-123', fullName: 'Test User' },
      });

      // Mock the API response for dashboard data
      const axios = await import('../../api/axios');
      axios.default.get.mockResolvedValue({
        data: {
          data: {
            name: 'Test User',
            email: 'test@example.com',
            employment: [],
            skills: [],
            education: [],
            projects: [],
          },
        },
      });

      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      );

      // Dashboard should load (even if showing loading state initially)
      await waitFor(() => {
        expect(screen.queryByTestId('sign-in')).not.toBeInTheDocument();
      });
    });
  });

  describe('Profile Protection', () => {
    it('redirects unauthenticated users from profile to login', async () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        getToken: vi.fn(),
        signOut: vi.fn(),
      });
      mockUseUser.mockReturnValue({ user: null });

      render(
        <MemoryRouter initialEntries={['/profile']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sign-in')).toBeInTheDocument();
      });
    });

    it('allows authenticated users to access profile', async () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        getToken: vi.fn().mockResolvedValue('mock-token'),
        signOut: vi.fn(),
      });
      mockUseUser.mockReturnValue({
        user: { id: 'user-123', fullName: 'Test User' },
      });

      const axios = await import('../../api/axios');
      axios.default.get.mockResolvedValue({
        data: {
          data: {
            name: 'Test User',
            email: 'test@example.com',
            phone: '123-456-7890',
            location: 'Test City',
            headline: 'Test Headline',
            bio: 'Test Bio',
            industry: 'Technology',
            experienceLevel: 'Mid',
            employment: [],
            skills: [],
            education: [],
            projects: [],
            certifications: [],
          },
        },
      });

      render(
        <MemoryRouter initialEntries={['/profile']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('sign-in')).not.toBeInTheDocument();
      });
    });
  });

  describe('Projects and Portfolio Protection', () => {
    it('redirects unauthenticated users from projects to login', async () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        getToken: vi.fn(),
        signOut: vi.fn(),
      });
      mockUseUser.mockReturnValue({ user: null });

      render(
        <MemoryRouter initialEntries={['/projects']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sign-in')).toBeInTheDocument();
      });
    });

    it('redirects unauthenticated users from portfolio to login', async () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        getToken: vi.fn(),
        signOut: vi.fn(),
      });
      mockUseUser.mockReturnValue({ user: null });

      render(
        <MemoryRouter initialEntries={['/portfolio']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sign-in')).toBeInTheDocument();
      });
    });
  });

  describe('Back Button After Logout Flow', () => {
    it('redirects to login when user hits back after logout from dashboard', async () => {
      // Start authenticated
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        getToken: vi.fn().mockResolvedValue('mock-token'),
        signOut: vi.fn(),
      });
      mockUseUser.mockReturnValue({
        user: { id: 'user-123', fullName: 'Test User' },
      });

      const axios = await import('../../api/axios');
      axios.default.get.mockResolvedValue({
        data: {
          data: {
            name: 'Test User',
            email: 'test@example.com',
            employment: [],
            skills: [],
            education: [],
            projects: [],
          },
        },
      });

      const { rerender } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      );

      // Wait for dashboard to be accessible
      await waitFor(() => {
        expect(screen.queryByTestId('sign-in')).not.toBeInTheDocument();
      });

      // Simulate logout by changing auth state
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        getToken: vi.fn(),
        signOut: vi.fn(),
      });
      mockUseUser.mockReturnValue({ user: null });

      // Simulate back button navigation
      rerender(
        <MemoryRouter initialEntries={['/dashboard']}>
          <App />
        </MemoryRouter>
      );

      // Should redirect to login, not show error
      await waitFor(() => {
        expect(screen.getByTestId('sign-in')).toBeInTheDocument();
      });
    });

    it('redirects to login when user hits back after logout from profile', async () => {
      // Start authenticated
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        getToken: vi.fn().mockResolvedValue('mock-token'),
        signOut: vi.fn(),
      });
      mockUseUser.mockReturnValue({
        user: { id: 'user-123', fullName: 'Test User' },
      });

      const axios = await import('../../api/axios');
      axios.default.get.mockResolvedValue({
        data: {
          data: {
            name: 'Test User',
            email: 'test@example.com',
            phone: '123-456-7890',
            location: 'Test City',
            headline: 'Test Headline',
            bio: 'Test Bio',
            industry: 'Technology',
            experienceLevel: 'Mid',
            employment: [],
            skills: [],
            education: [],
            projects: [],
            certifications: [],
          },
        },
      });

      const { rerender } = render(
        <MemoryRouter initialEntries={['/profile']}>
          <App />
        </MemoryRouter>
      );

      // Wait for profile to be accessible
      await waitFor(() => {
        expect(screen.queryByTestId('sign-in')).not.toBeInTheDocument();
      });

      // Simulate logout
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        getToken: vi.fn(),
        signOut: vi.fn(),
      });
      mockUseUser.mockReturnValue({ user: null });

      // Simulate back button
      rerender(
        <MemoryRouter initialEntries={['/profile']}>
          <App />
        </MemoryRouter>
      );

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByTestId('sign-in')).toBeInTheDocument();
      });
    });
  });

  describe('Public Routes', () => {
    it('allows unauthenticated users to access login page', async () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        getToken: vi.fn(),
        signOut: vi.fn(),
      });
      mockUseUser.mockReturnValue({ user: null });

      render(
        <MemoryRouter initialEntries={['/login']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('sign-in')).toBeInTheDocument();
      });
    });

    it('allows unauthenticated users to access register page', async () => {
      mockUseAuth.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
        getToken: vi.fn(),
        signOut: vi.fn(),
      });
      mockUseUser.mockReturnValue({ user: null });

      render(
        <MemoryRouter initialEntries={['/register']}>
          <App />
        </MemoryRouter>
      );

      // Register page should load
      await waitFor(() => {
        expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner while authentication is loading', async () => {
      mockUseAuth.mockReturnValue({
        isLoaded: false,
        isSignedIn: false,
        getToken: vi.fn(),
        signOut: vi.fn(),
      });
      mockUseUser.mockReturnValue({ user: null });

      render(
        <MemoryRouter initialEntries={['/profile']}>
          <App />
        </MemoryRouter>
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });
});
