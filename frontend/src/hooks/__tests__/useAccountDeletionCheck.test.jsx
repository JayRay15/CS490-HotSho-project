import { render } from '@testing-library/react';
import { useAccountDeletionCheck } from '../useAccountDeletionCheck';
import { useAuth } from '@clerk/clerk-react';

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

function TestComp() {
  useAccountDeletionCheck();
  return <div>ok</div>;
}

describe('useAccountDeletionCheck', () => {
  test('does nothing when not signed in', async () => {
    useAuth.mockReturnValue({ isSignedIn: false });
    render(<TestComp />);
  });
});


