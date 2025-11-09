import { render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock Clerk and api before importing the component so hooks and network calls are mocked
vi.mock('@clerk/clerk-react', () => ({
  __esModule: true,
  ClerkProvider: ({ children }) => <>{children}</>,
  SignedIn: ({ children }) => <>{children}</>,
  SignedOut: ({ children }) => <>{children}</>,
  UserButton: () => <div />,
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue('tok'), isSignedIn: true }),
  useUser: () => ({ user: { id: 'u1' } }),
}));

vi.mock('../../api/axios', () => ({
  __esModule: true,
  default: { get: vi.fn() },
  setAuthToken: vi.fn(),
}));

import Navbar from '../Navbar.jsx';

describe('Navbar mobile active link behavior (comprehensive)', () => {
  const signedInPaths = [
    ['/dashboard', 'Dashboard'],
    ['/profile', 'Profile'],
    ['/jobs', 'Jobs'],
    ['/salary-benchmarks', 'Salary Benchmarks'],
    ['/resumes', 'Resumes'],
  ];

  for (const [path, label] of signedInPaths) {
    test(`mobile link '${label}' is active when route is '${path}' and others are not`, async () => {
      const api = (await import('../../api/axios')).default;
      api.get.mockResolvedValue({ data: { data: {} } });

      const { container } = render(
        <MemoryRouter initialEntries={[path]}>
          <Navbar />
        </MemoryRouter>
      );

      // open mobile menu and wait for DOM update
      const toggle = container.querySelector('button[aria-label="Toggle navigation menu"]');
      fireEvent.click(toggle);
      const mobile = container.querySelector('#mobile-menu');

      await waitFor(() => {
        const target = mobile.querySelector(`a[aria-label="${label}"]`);
        expect(target).toBeTruthy();
        expect(target.className).toContain('bg-primary-900'); // active styling
      });

      // pick another link (first entry) and ensure it's not active when route differs
      const other = mobile.querySelector('a[aria-label="Dashboard"]');
      if (label !== 'Dashboard') {
        expect(other.classList.contains('bg-primary-900')).toBe(false);
      }
    });
  }

  // Note: signed-out mobile active tests are covered in Navbar.signedout.test.jsx
});
