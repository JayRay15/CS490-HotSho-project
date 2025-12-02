import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock Clerk to prevent import errors
vi.mock('@clerk/clerk-react', () => ({
  SignedIn: ({ children }) => <>{children}</>,
  SignedOut: ({ children }) => <>{children}</>,
  UserButton: () => <div data-testid="user-button" />,
  useAuth: () => ({ getToken: async () => 'token-123' }),
  useUser: () => ({ user: { id: 'u1' } }),
  useClerk: () => ({ signOut: vi.fn() }),
}));

// Mock api/axios
vi.mock('../../api/axios', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: { data: {} } }) },
  setAuthToken: () => {},
}));

import { DynamicInterviewPrepLink, DynamicInterviewPrepLinkMobile } from '../Navbar.jsx';

describe('DynamicInterviewPrepLink', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  describe('with no active job', () => {
    test('links to /jobs when no activeJobId in storage', () => {
      const navLinkClass = () => 'nav-link';
      
      render(
        <MemoryRouter>
          <DynamicInterviewPrepLink navLinkClass={navLinkClass} />
        </MemoryRouter>
      );

      const link = screen.getByRole('link', { name: /interview prep/i });
      expect(link).toHaveAttribute('href', '/jobs');
      expect(link).toHaveAttribute('title', 'Select a job then open Interview Prep');
    });
  });

  describe('with activeJobId in localStorage', () => {
    test('links to /jobs/:id/interview-prep when activeJobId exists', () => {
      window.localStorage.setItem('activeJobId', 'job123');
      const navLinkClass = () => 'nav-link';
      
      render(
        <MemoryRouter>
          <DynamicInterviewPrepLink navLinkClass={navLinkClass} />
        </MemoryRouter>
      );

      const link = screen.getByRole('link', { name: /interview prep/i });
      expect(link).toHaveAttribute('href', '/jobs/job123/interview-prep');
      expect(link).toHaveAttribute('title', 'Open interview prep for active job');
    });
  });

  describe('with currentJobId in localStorage', () => {
    test('links to /jobs/:id/interview-prep when currentJobId exists', () => {
      window.localStorage.setItem('currentJobId', 'currentJob456');
      const navLinkClass = () => 'nav-link';
      
      render(
        <MemoryRouter>
          <DynamicInterviewPrepLink navLinkClass={navLinkClass} />
        </MemoryRouter>
      );

      const link = screen.getByRole('link', { name: /interview prep/i });
      expect(link).toHaveAttribute('href', '/jobs/currentJob456/interview-prep');
    });
  });

  describe('with selectedJobId in sessionStorage', () => {
    test('links to /jobs/:id/interview-prep when selectedJobId exists in sessionStorage', () => {
      window.sessionStorage.setItem('selectedJobId', 'selected789');
      const navLinkClass = () => 'nav-link';
      
      render(
        <MemoryRouter>
          <DynamicInterviewPrepLink navLinkClass={navLinkClass} />
        </MemoryRouter>
      );

      const link = screen.getByRole('link', { name: /interview prep/i });
      expect(link).toHaveAttribute('href', '/jobs/selected789/interview-prep');
    });
  });

  describe('priority order', () => {
    test('activeJobId takes priority over currentJobId', () => {
      window.localStorage.setItem('activeJobId', 'active');
      window.localStorage.setItem('currentJobId', 'current');
      const navLinkClass = () => 'nav-link';
      
      render(
        <MemoryRouter>
          <DynamicInterviewPrepLink navLinkClass={navLinkClass} />
        </MemoryRouter>
      );

      const link = screen.getByRole('link', { name: /interview prep/i });
      expect(link).toHaveAttribute('href', '/jobs/active/interview-prep');
    });
  });
});

describe('DynamicInterviewPrepLinkMobile', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  describe('with no active job', () => {
    test('links to /jobs when no activeJobId in storage', () => {
      render(
        <MemoryRouter>
          <DynamicInterviewPrepLinkMobile />
        </MemoryRouter>
      );

      const link = screen.getByRole('link', { name: /interview prep/i });
      expect(link).toHaveAttribute('href', '/jobs');
      expect(link).toHaveAttribute('title', 'Select a job then open Interview Prep');
    });
  });

  describe('with activeJobId in localStorage', () => {
    test('links to /jobs/:id/interview-prep when activeJobId exists', () => {
      window.localStorage.setItem('activeJobId', 'mobileJob123');
      
      render(
        <MemoryRouter>
          <DynamicInterviewPrepLinkMobile />
        </MemoryRouter>
      );

      const link = screen.getByRole('link', { name: /interview prep/i });
      expect(link).toHaveAttribute('href', '/jobs/mobileJob123/interview-prep');
      expect(link).toHaveAttribute('title', 'Open interview prep for active job');
    });
  });

  describe('active state styling', () => {
    test('applies correct className function', () => {
      render(
        <MemoryRouter initialEntries={['/jobs/test/interview-prep']}>
          <DynamicInterviewPrepLinkMobile />
        </MemoryRouter>
      );

      const link = screen.getByRole('link', { name: /interview prep/i });
      // Link should have the mobile-specific classes
      expect(link.className).toContain('block');
      expect(link.className).toContain('px-4');
      expect(link.className).toContain('py-2');
      expect(link.className).toContain('rounded-lg');
    });
  });

  describe('with currentJobId in localStorage', () => {
    test('uses currentJobId when activeJobId is not present', () => {
      window.localStorage.setItem('currentJobId', 'currentMobile');
      
      render(
        <MemoryRouter>
          <DynamicInterviewPrepLinkMobile />
        </MemoryRouter>
      );

      const link = screen.getByRole('link', { name: /interview prep/i });
      expect(link).toHaveAttribute('href', '/jobs/currentMobile/interview-prep');
    });
  });

  describe('with selectedJobId in sessionStorage', () => {
    test('uses selectedJobId from sessionStorage', () => {
      window.sessionStorage.setItem('selectedJobId', 'sessionJob');
      
      render(
        <MemoryRouter>
          <DynamicInterviewPrepLinkMobile />
        </MemoryRouter>
      );

      const link = screen.getByRole('link', { name: /interview prep/i });
      expect(link).toHaveAttribute('href', '/jobs/sessionJob/interview-prep');
    });
  });
});
