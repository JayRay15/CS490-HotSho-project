import { Link, NavLink, useLocation } from "react-router-dom";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import api, { setAuthToken } from "../api/axios";
import Logo from "./Logo";

export default function Navbar() {
    const { getToken } = useAuth();
    const { user } = useUser();
    const location = useLocation();
    const [profilePicture, setProfilePicture] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Fetch user's custom profile picture
    useEffect(() => {
        const fetchProfilePicture = async () => {
            try {
                const token = await getToken();
                setAuthToken(token);
                const response = await api.get('/api/users/me');
                
                if (response.data.data?.picture) {
                    setProfilePicture(response.data.data.picture);
                } else {
                    setProfilePicture(null);
                }
            } catch (err) {
                // Silently fail - will use Clerk's default avatar
                console.debug("Could not load custom profile picture:", err);
                setProfilePicture(null);
            }
        };

        if (user) {
            fetchProfilePicture();
            // Poll for updates every 3 seconds to catch new uploads
            const interval = setInterval(fetchProfilePicture, 3000);
            return () => clearInterval(interval);
        }
    }, [getToken, user]);

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location]);

    // NavLink active class styling
    const navLinkClass = ({ isActive }) => 
        `px-3 py-2 rounded-lg transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 ${
            isActive 
                ? 'bg-blue-700 text-white shadow-md' 
                : 'text-white hover:bg-blue-500 hover:shadow-sm active:bg-blue-800'
        }`;

    return (
        <nav className="bg-blue-600 text-white shadow-md sticky top-0 z-50" role="navigation" aria-label="Main navigation">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand */}
                    <Link 
                        to="/" 
                        className="flex items-center gap-2 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 rounded px-2 py-1"
                        aria-label="Nirvana Home"
                    >
                        <Logo variant="white" size="md" />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-2">
                        <SignedOut>
                            <NavLink to="/register" className={navLinkClass} aria-label="Register">
                                Register
                            </NavLink>
                            <NavLink to="/login" className={navLinkClass} aria-label="Login">
                                Login
                            </NavLink>
                        </SignedOut>
                        <SignedIn>
                            <NavLink to="/dashboard" className={navLinkClass} aria-label="Dashboard">
                                Dashboard
                            </NavLink>
                            <NavLink to="/profile" className={navLinkClass} aria-label="Profile">
                                Profile
                            </NavLink>
                            <div className="ml-3 custom-user-button">
                                <UserButton 
                                    afterSignOutUrl="/login"
                                    appearance={{
                                        elements: {
                                            avatarBox: "w-8 h-8",
                                            userButtonAvatarBox: "w-8 h-8"
                                        }
                                    }}
                                />
                                {profilePicture && (
                                    <style>{`
                                .custom-user-button [class*="avatarBox"],
                                .custom-user-button [class*="Avatar"] {
                                    background-image: url('${profilePicture}') !important;
                                    background-size: cover !important;
                                    background-position: center !important;
                                    border-radius: 9999px !important;
                                    overflow: hidden !important;
                                    display: block !important;
                                }
                                .custom-user-button [class*="avatarBox"] img,
                                .custom-user-button [class*="Avatar"] img {
                                    opacity: 0 !important;
                                }
                                /* Also apply to menu dropdown */
                                [class*="userButton"][class*="popover"] [class*="avatarBox"],
                                [class*="userButton"][class*="popover"] [class*="Avatar"],
                                [class*="userProfile"] [class*="avatarBox"],
                                [class*="userProfile"] [class*="Avatar"] {
                                    background-image: url('${profilePicture}') !important;
                                    background-size: cover !important;
                                    background-position: center !important;
                                    border-radius: 9999px !important;
                                    overflow: hidden !important;
                                    display: block !important;
                                }
                                [class*="userButton"][class*="popover"] [class*="avatarBox"] img,
                                [class*="userButton"][class*="popover"] [class*="Avatar"] img,
                                [class*="userProfile"] [class*="avatarBox"] img,
                                [class*="userProfile"] [class*="Avatar"] img {
                                    opacity: 0 !important;
                                }
                            `}</style>
                                )}
                            </div>
                        </SignedIn>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-white transition-colors"
                        aria-expanded={mobileMenuOpen}
                        aria-label="Toggle navigation menu"
                        aria-controls="mobile-menu"
                    >
                        {mobileMenuOpen ? (
                            // Close icon
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            // Hamburger icon
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div 
                id="mobile-menu"
                className={`md:hidden bg-blue-700 border-t border-blue-500 transition-all duration-300 ease-in-out overflow-hidden ${
                    mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
                aria-hidden={!mobileMenuOpen}
            >
                <div className="px-4 py-3 space-y-2">
                    <SignedOut>
                        <NavLink 
                            to="/register" 
                            className={({ isActive }) => 
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${
                                    isActive 
                                        ? 'bg-blue-800 text-white shadow-md' 
                                        : 'text-white hover:bg-blue-600 active:bg-blue-900'
                                }`
                            }
                            aria-label="Register"
                        >
                            Register
                        </NavLink>
                        <NavLink 
                            to="/login" 
                            className={({ isActive }) => 
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${
                                    isActive 
                                        ? 'bg-blue-800 text-white shadow-md' 
                                        : 'text-white hover:bg-blue-600 active:bg-blue-900'
                                }`
                            }
                            aria-label="Login"
                        >
                            Login
                        </NavLink>
                    </SignedOut>
                    <SignedIn>
                        <NavLink 
                            to="/dashboard" 
                            className={({ isActive }) => 
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${
                                    isActive 
                                        ? 'bg-blue-800 text-white shadow-md' 
                                        : 'text-white hover:bg-blue-600 active:bg-blue-900'
                                }`
                            }
                            aria-label="Dashboard"
                        >
                            Dashboard
                        </NavLink>
                        <NavLink 
                            to="/profile" 
                            className={({ isActive }) => 
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${
                                    isActive 
                                        ? 'bg-blue-800 text-white shadow-md' 
                                        : 'text-white hover:bg-blue-600 active:bg-blue-900'
                                }`
                            }
                            aria-label="Profile"
                        >
                            Profile
                        </NavLink>
                        <div className="pt-3 pb-2 flex items-center space-x-3 px-4">
                            <span className="text-sm text-blue-100">Account</span>
                            <div className="custom-user-button">
                                <UserButton 
                                    afterSignOutUrl="/login"
                                    appearance={{
                                        elements: {
                                            avatarBox: "w-8 h-8",
                                            userButtonAvatarBox: "w-8 h-8"
                                        }
                                    }}
                                />
                                {profilePicture && (
                                    <style>{`
                                        .custom-user-button [class*="avatarBox"],
                                        .custom-user-button [class*="Avatar"] {
                                            background-image: url('${profilePicture}') !important;
                                            background-size: cover !important;
                                            background-position: center !important;
                                            border-radius: 9999px !important;
                                            overflow: hidden !important;
                                            display: block !important;
                                        }
                                        .custom-user-button [class*="avatarBox"] img,
                                        .custom-user-button [class*="Avatar"] img {
                                            opacity: 0 !important;
                                        }
                                        [class*="userButton"][class*="popover"] [class*="avatarBox"],
                                        [class*="userButton"][class*="popover"] [class*="Avatar"],
                                        [class*="userProfile"] [class*="avatarBox"],
                                        [class*="userProfile"] [class*="Avatar"] {
                                            background-image: url('${profilePicture}') !important;
                                            background-size: cover !important;
                                            background-position: center !important;
                                            border-radius: 9999px !important;
                                            overflow: hidden !important;
                                            display: block !important;
                                        }
                                        [class*="userButton"][class*="popover"] [class*="avatarBox"] img,
                                        [class*="userButton"][class*="popover"] [class*="Avatar"] img,
                                        [class*="userProfile"] [class*="avatarBox"] img,
                                        [class*="userProfile"] [class*="Avatar"] img {
                                            opacity: 0 !important;
                                        }
                                    `}</style>
                                )}
                            </div>
                        </div>
                    </SignedIn>
                </div>
            </div>
        </nav>
    );
}
