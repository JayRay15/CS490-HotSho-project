import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../Navbar.jsx';

vi.mock('@clerk/clerk-react', () => ({
  __esModule: true,
  ClerkProvider: ({ children }) => <>{children}</>,
  SignedIn: ({ children }) => <>{children}</>,
  SignedOut: ({ children }) => <>{children}</>,
  UserButton: () => <div />,
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue('tok'), isSignedIn: true }),
  useUser: () => ({ user: { id: 'u1' } }),
}));

describe('Navbar', () => {
  test('renders without crashing', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
  });
});


