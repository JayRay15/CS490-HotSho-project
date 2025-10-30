import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({
    isSignedIn: true,
    getToken: vi.fn().mockResolvedValue('tok'),
    signOut: signOutMock,
  }),
}));

vi.mock('../../api/axios', () => ({
  default: {
    get: vi.fn(),
  },
  setAuthToken: vi.fn(),
}));

import api from '../../api/axios';
import { useAccountDeletionCheck } from '../../hooks/useAccountDeletionCheck';

const signOutMock = vi.fn();

describe('useAccountDeletionCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('does nothing on success', async () => {
    api.get.mockResolvedValue({ data: { ok: true } });
    const { result } = renderHook(() => useAccountDeletionCheck());
    expect(result).toBeTruthy();
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/users/me');
    });
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it('signs out and stores message on 403', async () => {
    api.get.mockRejectedValue({ response: { status: 403, data: { message: 'Account scheduled for deletion' } } });
    renderHook(() => useAccountDeletionCheck());

    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalled();
    });

    expect(sessionStorage.getItem('logoutMessage')).toContain('scheduled for deletion');
  });
});


