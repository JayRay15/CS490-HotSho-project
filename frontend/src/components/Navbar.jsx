import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import api, { setAuthToken } from "../api/axios";
import Logo from "./Logo";
import FollowUpReminderNotification from "./FollowUpReminderNotification";
import { useIsAdmin } from "./AdminRoute";

export default function Navbar() {
    const { getToken, signOut } = useAuth();
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const [profilePicture, setProfilePicture] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [careerDropdownOpen, setCareerDropdownOpen] = useState(false);
    const [dropdownTimeout, setDropdownTimeout] = useState(null);

    // Force reload user data on mount to get latest metadata
    useEffect(() => {
        if (user && isLoaded) {
            user.reload().catch(console.error);
        }
    }, [isLoaded]);

    // Check admin status directly from user metadata
    const isAdmin = user?.publicMetadata?.role === "admin" || user?.publicMetadata?.isAdmin === true;

    // Debug: Log user metadata to console
    console.log("Navbar Debug - User:", user?.id);
    console.log("Navbar Debug - publicMetadata:", JSON.stringify(user?.publicMetadata));
    console.log("Navbar Debug - isAdmin:", isAdmin);

    // Full sign out - clears all sessions and storage
    const handleFullSignOut = async () => {
        try {
            // Store logout message first
            sessionStorage.setItem("logoutMessage", "You have been signed out successfully.");

            // Sign out from Clerk first (this needs Clerk's session data intact)
            await signOut();

            // Clear storage after signOut completes
            localStorage.clear();
            sessionStorage.setItem("logoutMessage", "You have been signed out successfully.");

            // Clear cookies
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            });

            // Redirect to login page
            window.location.href = "/login";
        } catch (error) {
            console.error("Sign out error:", error);
            // Force redirect even on error
            sessionStorage.setItem("logoutMessage", "You have been signed out.");
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
            // Only fetch once on mount - profile picture updates will be reflected on next page load
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
                            <NavLink to="/multi-platform-tracker" className={navLinkClass} aria-label="Multi-Platform Tracker">
                                Multi-Platform Tracker
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
                                        className="absolute left-0 mt-2 w-56 bg-white rounded shadow-lg z-10 max-h-96 overflow-y-auto"
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
                                        <NavLink to="/documents" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Document Management" onClick={() => setCareerDropdownOpen(false)}>
                                            Documents
                                        </NavLink>
                                        <NavLink to="/reports" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Custom Reports" onClick={() => setCareerDropdownOpen(false)}>
                                            Custom Reports
                                        </NavLink>
                                        <NavLink to="/productivity" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Productivity Analysis" onClick={() => setCareerDropdownOpen(false)}>
                                            Productivity Analysis
                                        </NavLink>
                                        <NavLink to="/my-performance" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="My Performance" onClick={() => setCareerDropdownOpen(false)}>
                                            My Performance
                                        </NavLink>
                                        <NavLink to="/ab-testing" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="A/B Testing" onClick={() => setCareerDropdownOpen(false)}>
                                            🧪 A/B Testing
                                        </NavLink>
                                        <NavLink to="/predictive-analytics" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Predictive Analytics" onClick={() => setCareerDropdownOpen(false)}>
                                            Predictive Analytics
                                        </NavLink>
                                        <NavLink to="/competitive-analysis" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Competitive Analysis" onClick={() => setCareerDropdownOpen(false)}>
                                            Competitive Analysis
                                        </NavLink>
                                        <NavLink to="/offer-comparison" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Offer Comparison" onClick={() => setCareerDropdownOpen(false)}>
                                            💰 Offer Comparison
                                        </NavLink>
                                        <NavLink to="/market-intelligence" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Market Intelligence" onClick={() => setCareerDropdownOpen(false)}>
                                            Market Intelligence
                                        </NavLink>
                                        <NavLink to="/mentors-advisors" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Mentors & Advisors" onClick={() => setCareerDropdownOpen(false)}>
                                            Mentors & Advisors
                                        </NavLink>
                                        <NavLink to="/peer-support" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Peer Support Groups" onClick={() => setCareerDropdownOpen(false)}>
                                            Peer Support
                                        </NavLink>
                                        <NavLink to="/job-map" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Job Location Map" onClick={() => setCareerDropdownOpen(false)}>
                                            📍 Job Map
                                        </NavLink>
                                        <NavLink to="/teams" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Teams" onClick={() => setCareerDropdownOpen(false)}>
                                            👥 Teams
                                        </NavLink>
                                        <div className="border-t border-gray-200 my-1"></div>
                                        <NavLink to="/settings/calendar" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Calendar Settings" onClick={() => setCareerDropdownOpen(false)}>
                                            📅 Calendar Settings
                                        </NavLink>
                                        <NavLink to="/settings/linkedin" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="LinkedIn Settings" onClick={() => setCareerDropdownOpen(false)}>
                                            💼 LinkedIn Settings
                                        </NavLink>
                                        {/* Admin-only links */}
                                        {isAdmin && (
                                            <>
                                                <div className="border-t border-gray-200 my-1"></div>
                                                <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">Admin</div>
                                                <NavLink to="/admin/api-monitoring" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="API Monitoring" onClick={() => setCareerDropdownOpen(false)}>
                                                    📊 API Monitoring
                                                </NavLink>
                                                <NavLink to="/admin/system-monitoring" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="System Monitoring" onClick={() => setCareerDropdownOpen(false)}>
                                                    🖥️ System Monitoring
                                                </NavLink>
                                                <NavLink to="/admin/test-errors" className="block px-4 py-2 text-gray-700 hover:bg-gray-100" aria-label="Test Errors" onClick={() => setCareerDropdownOpen(false)}>
                                                    🐛 Test Errors
                                                </NavLink>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="ml-3 flex items-center gap-3">
                                {/* Follow-up Reminder Notification */}
                                <FollowUpReminderNotification
                                    onViewAll={() => navigate('/jobs')}
                                    onOpenFollowUpTemplates={(job) => navigate('/jobs')}
                                />
                                {/* User avatar */}
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                    {profilePicture ? (
                                        <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                    ) : user?.imageUrl ? (
                                        <img src={user.imageUrl} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-gray-500 text-sm font-medium">
                                            {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || '?'}
                                        </span>
                                    )}
                                </div>
                                {/* Sign Out button */}
                                <button
                                    onClick={handleFullSignOut}
                                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5"
                                    aria-label="Sign Out"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign Out
                                </button>
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
                className={`md:hidden border-t transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-[80vh] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'
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
                            to="/multi-platform-tracker"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Multi-Platform Tracker"
                        >
                            Multi-Platform Tracker
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
                        <NavLink
                            to="/skill-trends"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Skill Trends"
                        >
                            Skills
                        </NavLink>
                        <NavLink
                            to="/mock-interviews"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Mock Interviews"
                        >
                            Mock Interviews
                        </NavLink>
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
                            to="/documents"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Document Management"
                        >
                            Documents
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
                            to="/my-performance"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="My Performance"
                        >
                            My Performance
                        </NavLink>
                        <NavLink
                            to="/ab-testing"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="A/B Testing"
                        >
                            🧪 A/B Testing
                        </NavLink>
                        <NavLink
                            to="/predictive-analytics"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Predictive Analytics"
                        >
                            Predictive Analytics
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
                            Competitive Analysis
                        </NavLink>
                        <NavLink
                            to="/offer-comparison"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Offer Comparison"
                        >
                            💰 Offer Comparison
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
                            to="/mentors-advisors"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Mentors & Advisors"
                        >
                            Mentors & Advisors
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
                            Peer Support
                        </NavLink>
                        <NavLink
                            to="/job-map"
                            className={({ isActive }) =>
                                `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                    ? 'bg-primary-900 text-white shadow-md'
                                    : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                }`
                            }
                            aria-label="Job Location Map"
                        >
                            📍 Job Map
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
                        {/* Admin-only links in mobile menu */}
                        {isAdmin && (
                            <>
                                <div className="border-t border-primary-600 my-2 mx-4"></div>
                                <div className="px-4 py-1 text-xs font-semibold text-primary-300 uppercase">Admin</div>
                                <NavLink
                                    to="/admin/api-monitoring"
                                    className={({ isActive }) =>
                                        `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                            ? 'bg-primary-900 text-white shadow-md'
                                            : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                        }`
                                    }
                                    aria-label="API Monitoring"
                                >
                                    📊 API Monitoring
                                </NavLink>
                                <NavLink
                                    to="/admin/system-monitoring"
                                    className={({ isActive }) =>
                                        `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                            ? 'bg-primary-900 text-white shadow-md'
                                            : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                        }`
                                    }
                                    aria-label="System Monitoring"
                                >
                                    🖥️ System Monitoring
                                </NavLink>
                                <NavLink
                                    to="/admin/test-errors"
                                    className={({ isActive }) =>
                                        `block px-4 py-2 rounded-lg transition-all font-medium focus:outline-none focus:ring-2 focus:ring-white ${isActive
                                            ? 'bg-primary-900 text-white shadow-md'
                                            : 'text-white hover:bg-primary-700 active:bg-primary-900'
                                        }`
                                    }
                                    aria-label="Test Errors"
                                >
                                    🐛 Test Errors
                                </NavLink>
                            </>
                        )}
                        {/* Sign Out button for mobile */}
                        <div className="pt-3 pb-2 px-4">
                            <button
                                onClick={handleFullSignOut}
                                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center justify-center gap-2"
                                aria-label="Sign Out"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign Out
                            </button>
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

