import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock Clerk components and hooks
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

import Navbar, { DynamicInterviewPrepLink } from '../Navbar.jsx';

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear storage
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  test('fetches profile picture when user exists', async () => {
    mockGet.mockResolvedValue({ data: { data: { picture: 'http://img' } } });

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/api/users/me'));
  });

  test('mobile menu toggles open/close', async () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const toggle = screen.getByRole('button', { name: /toggle navigation menu/i });
    // initially closed
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('Interview Prep link points to active job when active job set', () => {
    window.localStorage.setItem('activeJobId', 'job-123');

    const { getByText } = render(
      <MemoryRouter>
        <DynamicInterviewPrepLink navLinkClass={() => 'navclass'} />
      </MemoryRouter>
    );

    const link = getByText(/Interview Prep/i).closest('a');
    expect(link).toHaveAttribute('href', '/jobs/job-123/interview-prep');
  });
});



