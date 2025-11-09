vi.mock('@clerk/clerk-react', () => ({
  __esModule: true,
  ClerkProvider: ({ children }) => <>{children}</>,
  useAuth: vi.fn(),
}));

vi.mock('../../api/axios', () => ({
  __esModule: true,
  default: { get: vi.fn() },
  setAuthToken: vi.fn(),
}));

import { render, waitFor } from '@testing-library/react';
import { useAccountDeletionCheck } from '../useAccountDeletionCheck';
import { useAuth } from '@clerk/clerk-react';
import apiModule from '../../api/axios';

function TestComp() {
  useAccountDeletionCheck();
  return <div>ok</div>;
}

describe('useAccountDeletionCheck', () => {
  beforeEach(() => {
    // Ensure the mocked api has a fresh get mock in case other tests restored/cleared mocks
    if (!apiModule || typeof apiModule !== 'object') return;
    apiModule.get = vi.fn();
    // ensure sessionStorage is clean
    sessionStorage.removeItem('logoutMessage');
  });
  test('does nothing when not signed in', async () => {
    useAuth.mockReturnValue({ isSignedIn: false });
    render(<TestComp />);
  });

  test('does nothing when api returns user data (account exists)', async () => {
  const api = apiModule;
    const signOut = vi.fn();

    useAuth.mockReturnValue({ isSignedIn: true, getToken: vi.fn().mockResolvedValue('tok'), signOut });
    api.get.mockResolvedValue({ data: { id: 'user' } });

    render(<TestComp />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/users/me');
      expect(signOut).not.toHaveBeenCalled();
    });
  });

  test.each([403, 404])('forces signOut when api responds %i', async (status) => {
  const api = apiModule;
    const signOut = vi.fn();
    const tokenMock = vi.fn().mockResolvedValue('tok');

    useAuth.mockReturnValue({ isSignedIn: true, getToken: tokenMock, signOut });

    const err = new Error('not found');
    err.response = { status, data: { message: 'Account deleted' } };
    api.get.mockRejectedValue(err);

    // clear sessionStorage
    sessionStorage.removeItem('logoutMessage');

    render(<TestComp />);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(sessionStorage.getItem('logoutMessage')).toBe('Account deleted');
    });
  });

  test('forces signOut when customError.isAccountDeleted is true', async () => {
  const api = apiModule;
    const signOut = vi.fn();
    useAuth.mockReturnValue({ isSignedIn: true, getToken: vi.fn().mockResolvedValue('tok'), signOut });

    const err = new Error('acct gone');
    err.customError = { isAccountDeleted: true };
    api.get.mockRejectedValue(err);

    sessionStorage.removeItem('logoutMessage');

    render(<TestComp />);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      // default message when response.data?.message not present
      expect(sessionStorage.getItem('logoutMessage')).toBe('Your account has been deleted.');
    });
  });

  test('does not sign out on other errors (500)', async () => {
  const api = apiModule;
    const signOut = vi.fn();
    useAuth.mockReturnValue({ isSignedIn: true, getToken: vi.fn().mockResolvedValue('tok'), signOut });

    const err = new Error('server');
    err.response = { status: 500 };
    api.get.mockRejectedValue(err);

    render(<TestComp />);

    await waitFor(() => {
      expect(signOut).not.toHaveBeenCalled();
    });
  });
});


