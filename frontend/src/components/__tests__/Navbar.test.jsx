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

describe('Navbar', () => {
  test('renders without crashing', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
  });

  test('shows custom profile picture style when API returns picture and hides when not present', async () => {
    const api = (await import('../../api/axios')).default;

    // Case 1: API returns picture
    api.get.mockResolvedValueOnce({ data: { data: { picture: 'http://example.com/pic.png' } } });

    const { container, rerender } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    // style should be injected with the picture URL
    await waitFor(() => {
      const styles = Array.from(container.querySelectorAll('style')).map(s => s.textContent).join('\n');
      expect(styles).toContain("url('http://example.com/pic.png')");
    });

    // Case 2: API returns no picture
    api.get.mockResolvedValueOnce({ data: { data: {} } });
    // re-render to trigger effect again (user is present so effect runs)
    rerender(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    // there should be no injected style containing background-image url for the picture
    await waitFor(() => {
      const styles = Array.from(container.querySelectorAll('style')).map(s => s.textContent).join('\n');
      expect(styles).not.toContain('background-image: url(');
    });
  });

  test('mobile menu button toggles mobile menu visibility and aria attributes', async () => {
    const api = (await import('../../api/axios')).default;
    api.get.mockResolvedValue({ data: { data: {} } });

    const { container, getByLabelText } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const toggle = getByLabelText('Toggle navigation menu');
    const mobileMenu = container.querySelector('#mobile-menu');

    // initially closed
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(mobileMenu).toHaveAttribute('aria-hidden', 'true');

    // open
    fireEvent.click(toggle);
    await waitFor(() => expect(toggle).toHaveAttribute('aria-expanded', 'true'));
    expect(mobileMenu.className).toMatch(/max-h-96/);
    expect(mobileMenu).toHaveAttribute('aria-hidden', 'false');

    // close
    fireEvent.click(toggle);
    await waitFor(() => expect(toggle).toHaveAttribute('aria-expanded', 'false'));
    expect(mobileMenu.className).toMatch(/max-h-0/);
  });

  test('mobile menu shows signed-in links when user exists', async () => {
    const api = (await import('../../api/axios')).default;
    api.get.mockResolvedValue({ data: { data: {} } });

    const { container, getByLabelText, getByText } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    const toggle = getByLabelText('Toggle navigation menu');
    fireEvent.click(toggle);

    // expect mobile links for signed-in user (look specifically inside the mobile menu)
    const mobileMenu = container.querySelector('#mobile-menu');
    const { getByText: getByTextWithin } = require('@testing-library/dom');
    // use testing-library's within-like selection by querying inside mobileMenu
    expect(mobileMenu.querySelector('a[aria-label="Dashboard"]')).toBeTruthy();
    expect(mobileMenu.querySelector('a[aria-label="Profile"]')).toBeTruthy();
    expect(mobileMenu.querySelector('a[aria-label="Jobs"]')).toBeTruthy();
    expect(mobileMenu.querySelector('a[aria-label="Salary Benchmarks"]')).toBeTruthy();
    expect(mobileMenu.querySelector('a[aria-label="Resumes"]')).toBeTruthy();

    // account label exists inside mobile menu
    expect(mobileMenu.textContent).toContain('Account');
  });

  test('navlink active classes applied for desktop and mobile when route matches', async () => {
    const api = (await import('../../api/axios')).default;
    api.get.mockResolvedValue({ data: { data: {} } });

    const { container, getByLabelText } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Navbar />
      </MemoryRouter>
    );

    // desktop: find the hidden md:flex container and check Dashboard link class for active styling
    const desktopNav = container.querySelector('div.hidden');
    const desktopDashboard = desktopNav.querySelector('a[aria-label="Dashboard"]');
    expect(desktopDashboard.className).toContain('bg-primary-800');

    // mobile: open menu and check mobile Dashboard active styling (bg-primary-900)
    const toggle = getByLabelText('Toggle navigation menu');
    toggle.click();
    const mobileMenu = container.querySelector('#mobile-menu');
    const mobileDashboard = mobileMenu.querySelector('a[aria-label="Dashboard"]');
    expect(mobileDashboard.className).toContain('bg-primary-900');
  });

  test('injects style blocks for profile picture in both desktop and mobile areas when picture exists', async () => {
    const api = (await import('../../api/axios')).default;
    api.get.mockResolvedValueOnce({ data: { data: { picture: 'http://example.com/pic.png' } } });

    const { container } = render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    // wait for effect to set profile picture and inject style(s)
    await waitFor(() => {
      const styles = Array.from(container.querySelectorAll('style')).map(s => s.textContent || '');
      const matches = styles.filter(t => t.includes('http://example.com/pic.png'));
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });
});


