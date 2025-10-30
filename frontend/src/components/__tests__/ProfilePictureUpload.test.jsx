import { render } from '@testing-library/react';
import ProfilePictureUpload from '../ProfilePictureUpload.jsx';

vi.mock('../../api/axios', () => ({
  __esModule: true,
  default: { post: vi.fn(), delete: vi.fn() },
  setAuthToken: vi.fn(),
}));

vi.mock('@clerk/clerk-react', () => ({
  __esModule: true,
  ClerkProvider: ({ children }) => <>{children}</>,
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue('tok') }),
}));

describe('ProfilePictureUpload', () => {
  test('renders without crashing', () => {
    render(<ProfilePictureUpload />);
  });
});


