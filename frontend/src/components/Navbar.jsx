import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, UserButton, useClerk } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import api, { setAuthToken } from "../api/axios";
import Logo from "./Logo";

export default function Navbar() {
    const { getToken } = useAuth();
    const { user } = useUser();
    const { signOut } = useClerk();
    const navigate = useNavigate();
    const location = useLocation();
    const [profilePicture, setProfilePicture] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [careerDropdownOpen, setCareerDropdownOpen] = useState(false);
    const [dropdownTimeout, setDropdownTimeout] = useState(null);

    // Full sign out - clears all sessions and storage
    const handleFullSignOut = async () => {
        try {
            // Clear all local storage and session storage
            localStorage.clear();
            sessionStorage.clear();
            
            // Clear all cookies (including OAuth provider cookies)
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });
            
            // Sign out from Clerk (this revokes the session)
            await signOut();
            
            // Store logout message
            sessionStorage.setItem("logoutMessage", "You have been signed out successfully. If using a shared computer, please also sign out of LinkedIn/Google directly.");
            
            // Navigate to login
            navigate("/login");
        } catch (error) {
            console.error("Sign out error:", error);
            // Force navigate even on error
            window.location.href = "/login";
        }
    };

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
        `px-3 py-2 rounded-lg transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-700 ${isActive
            ? 'bg-primary-800 text-white shadow-md'
            : 'text-white hover:bg-primary-600 hover:shadow-sm active:bg-primary-900'
        }`;

    return (
        <nav className="text-white shadow-md sticky top-0 z-50" style={{ backgroundColor: '#4F5348' }} role="navigation" aria-label="Main navigation">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand */}
                    <Link
                        to="/"
                        className="flex items-center gap-2 hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-700 rounded px-2 py-1"
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
                            <NavLink to="/jobs" className={navLinkClass} aria-label="Jobs">
                                Jobs
                            </NavLink>
                            <NavLink to="/skill-trends" className={navLinkClass} aria-label="Skill Trends">
                                Skills
                            </NavLink>
                            <NavLink to="/salary-benchmarks" className={navLinkClass} aria-label="Salary Benchmarks">
                                Salary
                            </NavLink>
                            <NavLink to="/resumes" className={navLinkClass} aria-label="Resumes">
                                Resumes & Cover Letters
                            </NavLink>

                            <div
                                className="relative"
                                onMouseLeave={() => {
                                    const timeout = setTimeout(() => setCareerDropdownOpen(false), 300);
                                    setDropdownTimeout(timeout);
                                }}
                                onMouseEnter={() => {
                                    if (dropdownTimeout) clearTimeout(dropdownTimeout);
                                    setCareerDropdownOpen(true);
                                }}
                            >
                                <button
                                    className={navLinkClass({ isActive: false })}
                                    aria-label="Career Tools"
                                    onClick={() => setCareerDropdownOpen((open) => !open)}
                                    onMouseEnter={() => {
                                        if (dropdownTimeout) clearTimeout(dropdownTimeout);
                                        setCareerDropdownOpen(true);
                                    }}
                                    tabIndex={0}
                                >
                                    Career Tools
                                    <svg className="inline w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {careerDropdownOpen && (
                                    <div
                                        className="absolute left-0 mt-2 w-56 bg-white rounded shadow-lg z-10"
                                        onMouseEnter={() => {
                                            if (dropdownTimeout) clearTimeout(dropdownTimeout);
                                            setCareerDropdownOpen(true);
                                        }}
                                    >
                                        <NavLink to="/goals" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Career Goals" onClick={() => setCareerDropdownOpen(false)}>
                                            Career Goals
                                        </NavLink>
                                        <NavLink to="/interviews" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="My Interviews" onClick={() => setCareerDropdownOpen(false)}>
                                            My Interviews
                                        </NavLink>
                                        <NavLink to="/interview-coaching" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Interview Coaching" onClick={() => setCareerDropdownOpen(false)}>
                                            Interview Coaching
                                        </NavLink>
                                        <NavLink to="/mock-interviews" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Mock Interview History" onClick={() => setCareerDropdownOpen(false)}>
                                            Mock Interviews
                                        </NavLink>
                                        <NavLink to="/prep" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Technical Prep" onClick={() => setCareerDropdownOpen(false)}>
                                            Technical Prep
                                        </NavLink>
                                        <NavLink to="/writing-practice" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Writing Practice" onClick={() => setCareerDropdownOpen(false)}>
                                            Writing Practice
                                        </NavLink>
                                        <NavLink to="/network" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Professional Network" onClick={() => setCareerDropdownOpen(false)}>
                                            Network
                                        </NavLink>
                                        <NavLink to="/reports" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Custom Reports" onClick={() => setCareerDropdownOpen(false)}>
                                            Custom Reports
                                        </NavLink>
                                        <NavLink to="/productivity" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Productivity Analysis" onClick={() => setCareerDropdownOpen(false)}>
                                            Productivity Analysis
                                        </NavLink>
                                        <NavLink to="/performance-dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Performance Dashboard" onClick={() => setCareerDropdownOpen(false)}>
                                            📊 Performance Dashboard
                                        </NavLink>
                                        <NavLink to="/application-success" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Application Success Analysis" onClick={() => setCareerDropdownOpen(false)}>
                                            🎯 Success Analysis
                                        </NavLink>
                                        <NavLink to="/interview-performance" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Interview Performance Analytics" onClick={() => setCareerDropdownOpen(false)}>
                                            📈 Interview Performance
                                        </NavLink>
                                        <NavLink to="/competitive-analysis" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Competitive Analysis" onClick={() => setCareerDropdownOpen(false)}>
                                            🏆 Competitive Analysis
                                        </NavLink>
                                        <NavLink to="/market-intelligence" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Market Intelligence" onClick={() => setCareerDropdownOpen(false)}>
                                            Market Intelligence
                                        </NavLink>
                                        <NavLink to="/mentors" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Mentor Hub" onClick={() => setCareerDropdownOpen(false)}>
                                            Mentor Hub
                                        </NavLink>
                                        <NavLink to="/advisors" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Advisors Hub" onClick={() => setCareerDropdownOpen(false)}>
                                            🎓 Advisors Hub
                                        </NavLink>
                                        <NavLink to="/teams" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Teams" onClick={() => setCareerDropdownOpen(false)}>
                                            👥 Teams
                                        </NavLink>
                                        <NavLink to="/peer-support" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Peer Support Groups" onClick={() => setCareerDropdownOpen(false)}>
                                            🤝 Peer Support
                                        </NavLink>
                                        <div className="border-t border-gray-200 my-1"></div>
                                        <NavLink to="/settings/calendar" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Calendar Settings" onClick={() => setCareerDropdownOpen(false)}>
                                            📅 Calendar Settings
                                        </NavLink>
                                        <NavLink to="/settings/linkedin" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="LinkedIn Settings" onClick={() => setCareerDropdownOpen(false)}>
                                            💼 LinkedIn Settings
                                        </NavLink>
                                    </div>
                                )}
                            </div>
                            <div className="ml-3 custom-user-button flex items-center gap-2">
                                <UserButton
                                    afterSignOutUrl="/login"
                                    appearance={{
                                        elements: {
                                            avatarBox: "w-8 h-8",
                                            userButtonAvatarBox: "w-8 h-8"
                                        }
                                    }}
                                >
                                    <UserButton.MenuItems>
                                        <UserButton.Action
                                            label="Full Sign Out"
                                            labelIcon={<span>🚪</span>}
                                            onClick={handleFullSignOut}
                                        />
                                    </UserButton.MenuItems>
                                </UserButton>
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
                        className="md:hidden p-2 rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-white transition-colors"
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
                className={`md:hidden border-t transition-all duration-300 ease-in-out overflow-hidden ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                style={{ backgroundColor: '#3A3D35', borderTopColor: '#656A5C' }}
                aria-hidden={!mobileMenuOpen}
            >
                <div className="px-4 py-3 space-y-2">
                    <SignedOut>
                        <NavLink
                            to="/register"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Register"
                        >
                            Register
                        </NavLink>
                        <NavLink
                            to="/login"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
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
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Dashboard"
                        >
                            Dashboard
                        </NavLink>
                        <NavLink
                            to="/profile"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Profile"
                        >
                            Profile
                        </NavLink>
                        <NavLink
                            to="/jobs"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Jobs"
                        >
                            Jobs
                        </NavLink>
                        <NavLink
                            to="/salary-benchmarks"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Salary Benchmarks"
                        >
                            Salary Benchmarks
                        </NavLink>
                        <NavLink
                            to="/resumes"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Resumes"
                        >
                            Resumes
                        </NavLink>
                        // ...existing code...
                        <NavLink
                            to="/goals"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Career Goals"
                        >
                            Career Goals
                        </NavLink>
                        <NavLink
                            to="/interviews"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="My Interviews"
                        >
                            My Interviews
                        </NavLink>
                        <NavLink
                            to="/interview-coaching"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Interview Coaching"
                        >
                            Interview Coaching
                        </NavLink>
                        <NavLink
                            to="/prep"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Technical Prep"
                        >
                            Technical Prep
                        </NavLink>
                        <NavLink
                            to="/writing-practice"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Writing Practice"
                        >
                            Writing Practice
                        </NavLink>
                        <NavLink
                            to="/network"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Professional Network"
                        >
                            Network
                        </NavLink>

                        <NavLink
                            to="/reports"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Custom Reports"
                        >
                            Custom Reports
                        </NavLink>
                        <NavLink
                            to="/productivity"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Productivity Analysis"
                        >
                            Productivity Analysis
                        </NavLink>
                        <NavLink
                            to="/performance-dashboard"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Performance Dashboard"
                        >
                            📊 Performance Dashboard
                        </NavLink>
                        <NavLink
                            to="/application-success"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Application Success Analysis"
                        >
                            🎯 Success Analysis
                        </NavLink>
                        <NavLink
                            to="/interview-performance"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Interview Performance Analytics"
                        >
                            📈 Interview Performance
                        </NavLink>
                        <NavLink
                            to="/competitive-analysis"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Competitive Analysis"
                        >
                            🏆 Competitive Analysis
                        </NavLink>
                        <NavLink
                            to="/market-intelligence"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Market Intelligence"
                        >
                            Market Intelligence
                        </NavLink>
                        <NavLink
                            to="/mentors"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Mentor Hub"
                        >
                            Mentor Hub
                        </NavLink>
                        <NavLink
                            to="/advisors"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Advisors Hub"
                        >
                            🎓 Advisors Hub
                        </NavLink>
                        <NavLink
                            to="/teams"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Teams"
                        >
                            👥 Teams
                        </NavLink>
                        <NavLink
                            to="/peer-support"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Peer Support Groups"
                        >
                            🤝 Peer Support
                        </NavLink>
                        <NavLink
                            to="/settings/calendar"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Calendar Settings"
                        >
                            📅 Calendar Settings
                        </NavLink>
                        <NavLink
                            to="/settings/linkedin"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="LinkedIn Settings"
                        >
                            💼 LinkedIn Settings
                        </NavLink>
                        <div className="pt-3 pb-2 flex items-center space-x-3 px-4">
                            <span className="text-sm text-primary-50">Account</span>
                            <div className="custom-user-button">
                                <UserButton
                                    afterSignOutUrl="/login"
                                    appearance={{
                                        elements: {
                                            avatarBox: "w-8 h-8",
                                            userButtonAvatarBox: "w-8 h-8"
                                        }
                                    }}
                                >
                                    <UserButton.MenuItems>
                                        <UserButton.Action
                                            label="Full Sign Out"
                                            labelIcon={<span>🚪</span>}
                                            onClick={handleFullSignOut}
                                        />
                                    </UserButton.MenuItems>
                                </UserButton>
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
// Helper functions & dynamic Interview Prep links
function getActiveJobId() {
    const keys = ['activeJobId', 'currentJobId', 'selectedJobId'];
    for (const k of keys) {
        const v = typeof window !== 'undefined' ? (window.localStorage.getItem(k) || window.sessionStorage.getItem(k)) : null;
        if (v) return v;
    }
    return null;
}

function DynamicInterviewPrepLink({ navLinkClass }) {
    const jobId = typeof window !== 'undefined' ? getActiveJobId() : null;
    const target = jobId ? `/jobs/${jobId}/interview-prep` : '/jobs';
    return (
        <NavLink
            to={target}
            className={navLinkClass}
            aria-label="Interview Prep"
            title={jobId ? 'Open interview prep for active job' : 'Select a job then open Interview Prep'}
        >
            Interview Prep
        </NavLink>
    );
}

function DynamicInterviewPrepLinkMobile() {
    const jobId = typeof window !== 'undefined' ? getActiveJobId() : null;
    const target = jobId ? `/jobs/${jobId}/interview-prep` : '/jobs';
    return (
        <NavLink
            to={target}
            className={({ isActive }) =>
                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                    ? 'bg-primary-900 text-white shadow-md'
                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                }`
            }
            aria-label="Interview Prep"
            title={jobId ? 'Open interview prep for active job' : 'Select a job then open Interview Prep'}
        >
            Interview Prep
        </NavLink>
    );
}

export { DynamicInterviewPrepLink, DynamicInterviewPrepLinkMobile };

