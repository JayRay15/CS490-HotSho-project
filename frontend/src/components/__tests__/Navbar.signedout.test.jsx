import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Re-mock clerk to simulate signed-out user before importing the component
vi.mock('@clerk/clerk-react', () => ({
  __esModule: true,
  ClerkProvider: ({ children }) => <>{children}</>,
  SignedIn: ({ children }) => <>{children}</>,
  SignedOut: ({ children }) => <>{children}</>,
  UserButton: () => <div />,
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue(null), isSignedIn: false }),
  useUser: () => ({ user: null }),
  useClerk: () => ({ signOut: vi.fn() }),
}));

vi.mock('../../api/axios', () => ({
  __esModule: true,
  default: { get: vi.fn() },
  setAuthToken: vi.fn(),
}));

import Navbar from '../Navbar.jsx';

describe('Navbar (signed out)', () => {
  test('renders Register/Login links and does not call profile API', async () => {
    const api = (await import('../../api/axios')).default;

    const { getAllByLabelText } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    // Both desktop and mobile should include Register and Login links (aria-label present)
    const registers = getAllByLabelText('Register');
    const logins = getAllByLabelText('Login');

    expect(registers.length).toBeGreaterThanOrEqual(1);
    expect(logins.length).toBeGreaterThanOrEqual(1);

    // Profile fetch should not have been called when no user
    expect(api.get).not.toHaveBeenCalled();
  });

  test('mobile Register active class when route is /register and mobile Login active when /login', async () => {
    const api = (await import('../../api/axios')).default;

    // Register active
    const { container: c1, rerender } = render(
      <MemoryRouter initialEntries={["/register"]}>
        <Navbar />
      </MemoryRouter>
    );
    // open mobile menu
    const toggle1 = c1.querySelector('button[aria-label="Toggle navigation menu"]');
    toggle1.click();
    const mobile1 = c1.querySelector('#mobile-menu');
    const regLink = mobile1.querySelector('a[aria-label="Register"]');
    expect(regLink.className).toContain('bg-primary-900');

    // Login active
    rerender(
      <MemoryRouter initialEntries={["/login"]}>
        <Navbar />
      </MemoryRouter>
    );
    const toggle2 = c1.querySelector('button[aria-label="Toggle navigation menu"]');
    toggle2.click();
    const mobile2 = c1.querySelector('#mobile-menu');
    const loginLink = mobile2.querySelector('a[aria-label="Login"]');
    expect(loginLink.className).toContain('bg-primary-900');
  });
});
