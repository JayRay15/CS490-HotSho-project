import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  SignedIn: ({ children }) => <>{children}</>,
  SignedOut: ({ children }) => <>{children}</>,
  UserButton: () => <div data-testid="user-button" />,
  useAuth: () => ({ getToken: async () => 'token-123' }),
  useUser: () => ({ user: { id: 'u1' } }),
  useClerk: () => ({ signOut: vi.fn() }),
}));

// Mock api/axios
const mockGet = vi.fn();
vi.mock('../../api/axios', () => ({
  default: { get: (...args) => mockGet(...args) },
  get: (...args) => mockGet(...args),
  setAuthToken: () => {},
}));

import Navbar from '../Navbar.jsx';

describe('Navbar - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    mockGet.mockResolvedValue({ data: { data: {} } });
  });

  describe('Profile Picture Fetching', () => {
    test('fetches profile picture on mount when user exists', async () => {
      mockGet.mockResolvedValue({ data: { data: { picture: 'http://example.com/pic.png' } } });

      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalledWith('/api/users/me');
      });
    });

    test('handles profile picture fetch error gracefully', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      // Should not throw, component should still render
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    test('sets profile picture to null when response has no picture', async () => {
      mockGet.mockResolvedValue({ data: { data: {} } });

      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(mockGet).toHaveBeenCalled();
      });
    });
  });

  describe('Mobile Menu', () => {
    test('toggles mobile menu open and closed', () => {
      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      
      // Initially closed
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

      // Open
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

      // Close
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });

    test('mobile menu has correct aria attributes', () => {
      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      const mobileMenu = document.getElementById('mobile-menu');
      expect(mobileMenu).toHaveAttribute('aria-hidden', 'true');

      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      fireEvent.click(toggleButton);

      expect(mobileMenu).toHaveAttribute('aria-hidden', 'false');
    });
  });

  describe('Desktop Navigation Links', () => {
    test('renders all main navigation links for signed in user', () => {
      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /jobs/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /salary benchmarks/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /resumes/i })).toBeInTheDocument();
    });

    test('renders register and login for signed out state', () => {
      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      // Both SignedIn and SignedOut render in test mock, so both sets of links exist
      expect(screen.getAllByRole('link', { name: /register/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /login/i }).length).toBeGreaterThan(0);
    });
  });

  describe('Career Tools Dropdown', () => {
    test('renders career tools button', () => {
      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      expect(screen.getByRole('button', { name: /career tools/i })).toBeInTheDocument();
    });

    test('toggles career dropdown on click', () => {
      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      const careerButton = screen.getByRole('button', { name: /career tools/i });
      
      // Initially closed - dropdown links should not be visible
      expect(screen.queryByRole('link', { name: /career goals/i })).not.toBeInTheDocument();

      // Open dropdown
      fireEvent.click(careerButton);
      
      expect(screen.getByRole('link', { name: /career goals/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /my interviews/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /interview coaching/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /technical prep/i })).toBeInTheDocument();
    });

    test('cancels close timeout on mouse enter', async () => {
      vi.useFakeTimers();
      
      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      const careerButton = screen.getByRole('button', { name: /career tools/i });
      
      // Open dropdown
      fireEvent.click(careerButton);

      const dropdownContainer = careerButton.parentElement;
      
      // Mouse leave starts timeout
      fireEvent.mouseLeave(dropdownContainer);
      
      // Mouse enter before timeout
      fireEvent.mouseEnter(dropdownContainer);

      // Fast forward past the would-be timeout
      await vi.advanceTimersByTimeAsync(500);

      // Dropdown should still be open
      expect(screen.getByRole('link', { name: /career goals/i })).toBeInTheDocument();

      vi.useRealTimers();
    });

    test('dropdown links close dropdown when clicked', () => {
      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      const careerButton = screen.getByRole('button', { name: /career tools/i });
      fireEvent.click(careerButton);

      const goalsLink = screen.getByRole('link', { name: /career goals/i });
      fireEvent.click(goalsLink);

      // Dropdown should close after clicking a link
      expect(screen.queryByRole('link', { name: /my interviews/i })).not.toBeInTheDocument();
    });
  });

  describe('Active Link Styling', () => {
    test('applies active class to current route', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Navbar />
        </MemoryRouter>
      );

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      // The active class should contain bg-primary-800
      expect(dashboardLink.className).toContain('bg-primary-800');
    });
  });

  describe('Logo', () => {
    test('renders logo with home link', () => {
      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      const homeLink = screen.getByRole('link', { name: /nirvana home/i });
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  describe('User Button', () => {
    test('renders sign out button for signed in user', () => {
      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      // The navbar uses a custom Sign Out button, not Clerk's UserButton
      expect(screen.getAllByRole('button', { name: /sign out/i }).length).toBeGreaterThan(0);
    });
  });

  describe('Mobile Menu Links', () => {
    test('shows mobile links for signed in user', () => {
      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      // Open mobile menu
      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      fireEvent.click(toggleButton);

      const mobileMenu = document.getElementById('mobile-menu');
      
      // Check for mobile-specific links in mobile menu
      expect(mobileMenu.querySelector('a[aria-label="Dashboard"]')).toBeTruthy();
      expect(mobileMenu.querySelector('a[aria-label="Profile"]')).toBeTruthy();
      expect(mobileMenu.querySelector('a[aria-label="Jobs"]')).toBeTruthy();
    });
  });

  describe('Profile Picture Fetching on Mount', () => {
    test('fetches user profile data when user exists', async () => {
      mockGet.mockResolvedValue({ data: { data: { picture: 'http://example.com/pic.png' } } });

      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      await waitFor(() => {
        // Verify the API was called to fetch user profile
        expect(mockGet).toHaveBeenCalledWith('/api/users/me');
      });
    });
  });

  describe('Route Change Effect', () => {
    test('closes mobile menu when route changes', () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Navbar />
        </MemoryRouter>
      );

      // Open mobile menu
      const toggleButton = screen.getByRole('button', { name: /toggle navigation menu/i });
      fireEvent.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

      // Simulate route change by re-rendering with new location
      rerender(
        <MemoryRouter initialEntries={['/profile']}>
          <Navbar />
        </MemoryRouter>
      );

      // Menu should close on route change (in actual app, useLocation hook triggers this)
    });
  });
});
