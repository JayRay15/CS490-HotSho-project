import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '../../../pages/auth/Dashboard';

const mockSignOut = vi.fn();
const mockGetToken = vi.fn().mockResolvedValue('tok');

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: true, signOut: mockSignOut, getToken: mockGetToken }),
  useUser: () => ({ user: { fullName: 'Tester', primaryEmailAddress: { emailAddress: 't@e.com' } } }),
  RedirectToSignIn: () => <div>Redirect</div>,
}));

vi.mock('../../../api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
  setAuthToken: vi.fn(),
}));

import api from '../../../api/axios';

describe('Dashboard API flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('loads user data when available', async () => {
    api.get.mockResolvedValueOnce({ data: { data: { name: 'User', skills: [] } } });
    render(<Dashboard />);
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/api/users/me'));
    expect(screen.getByText(/you are successfully logged in/i)).toBeInTheDocument();
  });

  it('registers on 404 and then loads data', async () => {
    api.get
      .mockRejectedValueOnce({ response: { status: 404 } })
      .mockResolvedValueOnce({ data: { data: { name: 'New', skills: [] } } });
    api.post.mockResolvedValueOnce({ data: { success: true } });

    render(<Dashboard />);
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/api/auth/register'));
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    expect(screen.getByText(/you are successfully logged in/i)).toBeInTheDocument();
  });

  it('forces logout on 403 and stores message', async () => {
    api.get.mockRejectedValueOnce({ response: { status: 403, data: { message: 'Deleted' } } });
    render(<Dashboard />);
    await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
    expect(sessionStorage.getItem('logoutMessage')).toContain('Deleted');
  });
});


