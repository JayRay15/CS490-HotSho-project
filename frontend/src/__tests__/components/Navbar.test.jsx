import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Navbar from '../../components/Navbar';

// Mock useAuth and useUser from Clerk
const mockGetToken = vi.fn();
const mockUseAuth = vi.fn();
const mockUseUser = vi.fn();

vi.mock('@clerk/clerk-react', () => ({
    SignedIn: ({ children }) => <div data-testid="signed-in">{children}</div>,
    SignedOut: ({ children }) => <div data-testid="signed-out">{children}</div>,
    UserButton: ({ afterSignOutUrl }) => <div data-testid="user-button" data-after-sign-out-url={afterSignOutUrl}>UserButton</div>,
    useAuth: () => mockUseAuth(),
    useUser: () => mockUseUser(),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useLocation: () => ({ pathname: '/' }),
    };
});

// Mock Logo component
vi.mock('../../components/Logo', () => ({
    default: () => <div data-testid="logo">Logo</div>
}));

// Mock fetch
global.fetch = vi.fn();

describe('Navbar Component', () => {
    beforeEach(() => {
        mockUseAuth.mockReturnValue({ getToken: mockGetToken });
        mockUseUser.mockReturnValue({ user: { id: 'user123' } });
        mockGetToken.mockResolvedValue('mock-token');
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ data: { profilePicture: 'https://example.com/avatar.jpg' } })
        });
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    const renderNavbar = () => {
        return render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );
    };

    describe('Basic Rendering', () => {
        it('should render navigation with correct aria attributes', () => {
            renderNavbar();
            
            const nav = screen.getByRole('navigation');
            expect(nav).toBeInTheDocument();
            expect(nav).toHaveAttribute('aria-label', 'Main navigation');
        });

        it('should render logo with link to home', () => {
            renderNavbar();
            
            const logoLink = screen.getByLabelText('Go to home');
            expect(logoLink).toBeInTheDocument();
            expect(logoLink).toHaveAttribute('href', '/');
            
            const logo = screen.getByTestId('logo');
            expect(logo).toBeInTheDocument();
        });

        it('should apply correct background and text colors', () => {
            renderNavbar();
            
            const nav = screen.getByRole('navigation');
            expect(nav).toHaveStyle({ backgroundColor: '#3A3D35' });
            expect(nav).toHaveClass('text-white');
        });
    });

    describe('Desktop Navigation - Signed Out', () => {
        it('should display Register and Login links for signed out users', () => {
            renderNavbar();
            
            const signedOutSection = screen.getByTestId('signed-out');
            const registerLinks = within(signedOutSection).getAllByLabelText('Register');
            const loginLinks = within(signedOutSection).getAllByLabelText('Login');
            
            // Desktop links (hidden on mobile)
            expect(registerLinks[0]).toBeInTheDocument();
            expect(loginLinks[0]).toBeInTheDocument();
        });

        it('should have correct href for Register link', () => {
            renderNavbar();
            
            const signedOutSection = screen.getByTestId('signed-out');
            const registerLink = within(signedOutSection).getAllByLabelText('Register')[0];
            
            expect(registerLink).toHaveAttribute('href', '/register');
        });

        it('should have correct href for Login link', () => {
            renderNavbar();
            
            const signedOutSection = screen.getByTestId('signed-out');
            const loginLink = within(signedOutSection).getAllByLabelText('Login')[0];
            
            expect(loginLink).toHaveAttribute('href', '/login');
        });
    });

    describe('Desktop Navigation - Signed In', () => {
        it('should display Dashboard and Profile links for signed in users', () => {
            renderNavbar();
            
            const signedInSection = screen.getByTestId('signed-in');
            const dashboardLinks = within(signedInSection).getAllByLabelText('Dashboard');
            const profileLinks = within(signedInSection).getAllByLabelText('Profile');
            
            // Desktop links
            expect(dashboardLinks[0]).toBeInTheDocument();
            expect(profileLinks[0]).toBeInTheDocument();
        });

        it('should display UserButton with correct afterSignOutUrl', () => {
            renderNavbar();
            
            const signedInSection = screen.getByTestId('signed-in');
            const userButtons = within(signedInSection).getAllByTestId('user-button');
            
            userButtons.forEach(button => {
                expect(button).toHaveAttribute('data-after-sign-out-url', '/login');
            });
        });

        it('should have correct href for Dashboard link', () => {
            renderNavbar();
            
            const signedInSection = screen.getByTestId('signed-in');
            const dashboardLink = within(signedInSection).getAllByLabelText('Dashboard')[0];
            
            expect(dashboardLink).toHaveAttribute('href', '/dashboard');
        });

        it('should have correct href for Profile link', () => {
            renderNavbar();
            
            const signedInSection = screen.getByTestId('signed-in');
            const profileLink = within(signedInSection).getAllByLabelText('Profile')[0];
            
            expect(profileLink).toHaveAttribute('href', '/profile');
        });
    });

    describe('Mobile Menu Toggle', () => {
        it('should render mobile menu button with correct aria attributes', () => {
            renderNavbar();
            
            const mobileButton = screen.getByLabelText('Toggle navigation menu');
            expect(mobileButton).toBeInTheDocument();
            expect(mobileButton).toHaveAttribute('aria-expanded', 'false');
            expect(mobileButton).toHaveAttribute('aria-controls', 'mobile-menu');
        });

        it('should show hamburger icon when menu is closed', () => {
            renderNavbar();
            
            const mobileButton = screen.getByLabelText('Toggle navigation menu');
            const svg = mobileButton.querySelector('svg');
            const path = svg.querySelector('path');
            
            // Hamburger icon has three horizontal lines
            expect(path).toHaveAttribute('d', 'M4 6h16M4 12h16M4 18h16');
        });

        it('should toggle mobile menu when button is clicked', async () => {
            const user = userEvent.setup({ delay: null });
            renderNavbar();
            
            const mobileButton = screen.getByLabelText('Toggle navigation menu');
            const mobileMenu = screen.getByRole('navigation').querySelector('#mobile-menu');
            
            // Initially closed
            expect(mobileMenu).toHaveClass('max-h-0', 'opacity-0');
            expect(mobileButton).toHaveAttribute('aria-expanded', 'false');
            
            // Click to open
            await user.click(mobileButton);
            
            expect(mobileMenu).toHaveClass('max-h-96', 'opacity-100');
            expect(mobileButton).toHaveAttribute('aria-expanded', 'true');
            expect(mobileMenu).toHaveAttribute('aria-hidden', 'false');
        });

        it('should show X icon when menu is open', async () => {
            const user = userEvent.setup({ delay: null });
            renderNavbar();
            
            const mobileButton = screen.getByLabelText('Toggle navigation menu');
            
            await user.click(mobileButton);
            
            const svg = mobileButton.querySelector('svg');
            const path = svg.querySelector('path');
            
            // X icon has two diagonal lines
            expect(path).toHaveAttribute('d', 'M6 18L18 6M6 6l12 12');
        });

        it('should toggle menu closed when clicked again', async () => {
            const user = userEvent.setup({ delay: null });
            renderNavbar();
            
            const mobileButton = screen.getByLabelText('Toggle navigation menu');
            const mobileMenu = screen.getByRole('navigation').querySelector('#mobile-menu');
            
            // Open menu
            await user.click(mobileButton);
            expect(mobileMenu).toHaveClass('max-h-96', 'opacity-100');
            
            // Close menu
            await user.click(mobileButton);
            expect(mobileMenu).toHaveClass('max-h-0', 'opacity-0');
            expect(mobileButton).toHaveAttribute('aria-expanded', 'false');
        });
    });

    describe('Mobile Menu Content', () => {
        it('should have correct styling for mobile menu', () => {
            renderNavbar();
            
            const mobileMenu = screen.getByRole('navigation').querySelector('#mobile-menu');
            
            expect(mobileMenu).toHaveClass('md:hidden', 'border-t', 'transition-all', 'duration-300', 'ease-in-out', 'overflow-hidden');
            expect(mobileMenu).toHaveStyle({ backgroundColor: '#3A3D35', borderTopColor: '#656A5C' });
        });

        it('should display mobile navigation links for signed out users', () => {
            renderNavbar();
            
            const signedOutSection = screen.getByTestId('signed-out');
            const registerLinks = within(signedOutSection).getAllByLabelText('Register');
            const loginLinks = within(signedOutSection).getAllByLabelText('Login');
            
            // Should have 2 of each (desktop + mobile)
            expect(registerLinks).toHaveLength(2);
            expect(loginLinks).toHaveLength(2);
        });

        it('should display mobile navigation links for signed in users', () => {
            renderNavbar();
            
            const signedInSection = screen.getByTestId('signed-in');
            const dashboardLinks = within(signedInSection).getAllByLabelText('Dashboard');
            const profileLinks = within(signedInSection).getAllByLabelText('Profile');
            
            // Should have 2 of each (desktop + mobile)
            expect(dashboardLinks).toHaveLength(2);
            expect(profileLinks).toHaveLength(2);
        });

        it('should display Account label and UserButton in mobile menu for signed in users', () => {
            renderNavbar();
            
            const signedInSection = screen.getByTestId('signed-in');
            const accountLabel = within(signedInSection).getByText('Account');
            
            expect(accountLabel).toBeInTheDocument();
            expect(accountLabel).toHaveClass('text-sm', 'text-primary-50');
        });
    });

    describe('Profile Picture Fetching', () => {
        it('should fetch profile picture on mount', async () => {
            renderNavbar();
            
            await waitFor(() => {
                expect(mockGetToken).toHaveBeenCalled();
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/profile/picture'),
                    expect.objectContaining({
                        headers: expect.objectContaining({
                            Authorization: 'Bearer mock-token'
                        })
                    })
                );
            });
        });

        it('should poll profile picture every 3 seconds', async () => {
            renderNavbar();
            
            // Initial fetch
            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledTimes(1);
            });
            
            // Advance by 3 seconds
            vi.advanceTimersByTime(3000);
            
            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledTimes(2);
            });
            
            // Advance by another 3 seconds
            vi.advanceTimersByTime(3000);
            
            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledTimes(3);
            });
        });

        it('should inject custom CSS when profile picture is loaded', async () => {
            renderNavbar();
            
            await waitFor(() => {
                const styles = document.querySelectorAll('style');
                const customStyle = Array.from(styles).find(style => 
                    style.textContent.includes('https://example.com/avatar.jpg')
                );
                
                expect(customStyle).toBeTruthy();
                expect(customStyle.textContent).toContain('background-image: url(\'https://example.com/avatar.jpg\')');
                expect(customStyle.textContent).toContain('background-size: cover');
                expect(customStyle.textContent).toContain('!important');
            });
        });

        it('should handle fetch errors gracefully', async () => {
            global.fetch.mockRejectedValueOnce(new Error('Network error'));
            
            renderNavbar();
            
            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalled();
            });
            
            // Should not crash, and should not inject CSS
            const styles = document.querySelectorAll('style');
            const customStyle = Array.from(styles).find(style => 
                style.textContent.includes('example.com/avatar.jpg')
            );
            
            expect(customStyle).toBeFalsy();
        });

        it('should handle non-ok response status', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });
            
            renderNavbar();
            
            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalled();
            });
            
            // Should not inject CSS
            const styles = document.querySelectorAll('style');
            const customStyle = Array.from(styles).find(style => 
                style.textContent.includes('example.com/avatar.jpg')
            );
            
            expect(customStyle).toBeFalsy();
        });

        it('should not fetch when user is not available', async () => {
            mockUseUser.mockReturnValue({ user: null });
            
            renderNavbar();
            
            // Wait a bit to ensure fetch is not called
            vi.advanceTimersByTime(100);
            
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should clean up interval on unmount', async () => {
            const { unmount } = renderNavbar();
            
            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledTimes(1);
            });
            
            unmount();
            
            // Advance time after unmount
            vi.advanceTimersByTime(3000);
            
            // Should not fetch again
            expect(global.fetch).toHaveBeenCalledTimes(1);
        });
    });

    describe('Responsive Design', () => {
        it('should hide desktop navigation on mobile (md:flex class)', () => {
            renderNavbar();
            
            const nav = screen.getByRole('navigation');
            const desktopNav = nav.querySelector('.md\\:flex.hidden');
            
            expect(desktopNav).toBeInTheDocument();
            expect(desktopNav).toHaveClass('hidden', 'md:flex');
        });

        it('should show mobile menu button only on mobile (md:hidden class)', () => {
            renderNavbar();
            
            const mobileButton = screen.getByLabelText('Toggle navigation menu');
            
            expect(mobileButton).toHaveClass('md:hidden');
        });

        it('should hide mobile menu on desktop (md:hidden class)', () => {
            renderNavbar();
            
            const mobileMenu = screen.getByRole('navigation').querySelector('#mobile-menu');
            
            expect(mobileMenu).toHaveClass('md:hidden');
        });
    });

    describe('NavLink Styling', () => {
        it('should apply hover styles to navigation links', () => {
            renderNavbar();
            
            const signedOutSection = screen.getByTestId('signed-out');
            const registerLink = within(signedOutSection).getAllByLabelText('Register')[0];
            
            expect(registerLink.className).toContain('hover:bg-primary-700');
            expect(registerLink.className).toContain('active:bg-primary-900');
        });

        it('should have focus styles for accessibility', () => {
            renderNavbar();
            
            const signedOutSection = screen.getByTestId('signed-out');
            const loginLink = within(signedOutSection).getAllByLabelText('Login')[0];
            
            expect(loginLink.className).toContain('focus:outline-none');
            expect(loginLink.className).toContain('focus:ring-2');
            expect(loginLink.className).toContain('focus:ring-white');
        });

        it('should apply transition styles', () => {
            renderNavbar();
            
            const signedInSection = screen.getByTestId('signed-in');
            const dashboardLink = within(signedInSection).getAllByLabelText('Dashboard')[0];
            
            expect(dashboardLink.className).toContain('transition-all');
        });
    });

    describe('Accessibility', () => {
        it('should have proper aria-label on logo link', () => {
            renderNavbar();
            
            const logoLink = screen.getByLabelText('Go to home');
            expect(logoLink).toBeInTheDocument();
        });

        it('should have proper aria-labels on navigation links', () => {
            renderNavbar();
            
            expect(screen.getAllByLabelText('Register').length).toBeGreaterThan(0);
            expect(screen.getAllByLabelText('Login').length).toBeGreaterThan(0);
        });

        it('should have proper aria-hidden on mobile menu when closed', () => {
            renderNavbar();
            
            const mobileMenu = screen.getByRole('navigation').querySelector('#mobile-menu');
            expect(mobileMenu).toHaveAttribute('aria-hidden', 'true');
        });

        it('should update aria-hidden when mobile menu opens', async () => {
            const user = userEvent.setup({ delay: null });
            renderNavbar();
            
            const mobileButton = screen.getByLabelText('Toggle navigation menu');
            const mobileMenu = screen.getByRole('navigation').querySelector('#mobile-menu');
            
            await user.click(mobileButton);
            
            expect(mobileMenu).toHaveAttribute('aria-hidden', 'false');
        });

        it('should have aria-hidden="true" on hamburger/X icon SVGs', () => {
            renderNavbar();
            
            const mobileButton = screen.getByLabelText('Toggle navigation menu');
            const svg = mobileButton.querySelector('svg');
            
            expect(svg).toHaveAttribute('aria-hidden', 'true');
        });
    });

    describe('Custom UserButton Styling', () => {
        it('should wrap UserButton in custom-user-button div', () => {
            renderNavbar();
            
            const signedInSection = screen.getByTestId('signed-in');
            const customWrappers = signedInSection.querySelectorAll('.custom-user-button');
            
            // Should have 2 (desktop + mobile)
            expect(customWrappers.length).toBeGreaterThan(0);
        });

        it('should inject CSS targeting avatarBox classes', async () => {
            renderNavbar();
            
            await waitFor(() => {
                const styles = document.querySelectorAll('style');
                const customStyle = Array.from(styles).find(style => 
                    style.textContent.includes('avatarBox')
                );
                
                expect(customStyle).toBeTruthy();
                expect(customStyle.textContent).toContain('.custom-user-button [class*="avatarBox"]');
                expect(customStyle.textContent).toContain('border-radius: 9999px');
            });
        });

        it('should hide default Clerk avatar image with opacity: 0', async () => {
            renderNavbar();
            
            await waitFor(() => {
                const styles = document.querySelectorAll('style');
                const customStyle = Array.from(styles).find(style => 
                    style.textContent.includes('opacity: 0')
                );
                
                expect(customStyle).toBeTruthy();
                expect(customStyle.textContent).toContain('[class*="avatarBox"] img');
                expect(customStyle.textContent).toContain('opacity: 0 !important');
            });
        });

        it('should apply custom styles to popover and userProfile avatars', async () => {
            renderNavbar();
            
            await waitFor(() => {
                const styles = document.querySelectorAll('style');
                const customStyle = Array.from(styles).find(style => 
                    style.textContent.includes('userButton')
                );
                
                expect(customStyle).toBeTruthy();
                expect(customStyle.textContent).toContain('[class*="userButton"][class*="popover"]');
                expect(customStyle.textContent).toContain('[class*="userProfile"]');
            });
        });
    });
});
