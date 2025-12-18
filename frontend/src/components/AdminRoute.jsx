import { useAuth, useUser } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";

/**
 * AdminRoute - Wrapper component to protect admin-only routes
 * 
 * Features:
 * - Requires authentication (same as ProtectedRoute)
 * - Additionally checks for admin role in user metadata
 * - Redirects non-admin users to dashboard with access denied message
 * 
 * To grant admin access, set publicMetadata.role = "admin" in Clerk Dashboard
 * or via Clerk API for the user.
 */

// List of admin user IDs (fallback if metadata isn't set)
// Add your Clerk user IDs here for admin access
const ADMIN_USER_IDS = [
    // Add admin user IDs here, e.g.:
    // "user_2abc123...",
];

// List of allowed email domains for admin access (optional)
const ADMIN_EMAIL_DOMAINS = [
    // Add domains here, e.g.:
    // "@yourcompany.com",
];

export default function AdminRoute({ children }) {
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();
    const location = useLocation();

    // Wait for Clerk to finish loading authentication state
    if (!isLoaded) {
        return (
            <LoadingSpinner
                fullScreen={true}
                size="lg"
                text="Loading..."
                variant="logo"
            />
        );
    }

    // If not signed in, redirect to login page
    if (!isSignedIn) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if user has admin privileges
    const isAdmin = checkAdminAccess(user);

    if (!isAdmin) {
        // Redirect non-admin users to dashboard
        return <Navigate to="/dashboard" state={{ accessDenied: true }} replace />;
    }

    // User is authenticated and is an admin, render the protected content
    return children;
}

/**
 * Check if a user has admin access
 * Checks multiple sources in order of priority:
 * 1. Clerk publicMetadata.role === "admin"
 * 2. Clerk publicMetadata.isAdmin === true
 * 3. User ID in ADMIN_USER_IDS list
 * 4. Email domain in ADMIN_EMAIL_DOMAINS list
 */
function checkAdminAccess(user) {
    if (!user) return false;

    // Debug logging - remove in production
    console.log('🔐 Admin Check - User ID:', user.id);
    console.log('🔐 Admin Check - Public Metadata:', user.publicMetadata);
    console.log('🔐 Admin Check - Full User Object:', user);

    // Check Clerk metadata for role
    const metadata = user.publicMetadata || {};
    if (metadata.role === "admin" || metadata.isAdmin === true) {
        console.log('✅ Admin access granted via metadata');
        return true;
    }

    // Check if user ID is in admin list
    if (ADMIN_USER_IDS.includes(user.id)) {
        console.log('✅ Admin access granted via user ID list');
        return true;
    }

    // Check if email domain is in admin list
    const primaryEmail = user.primaryEmailAddress?.emailAddress || "";
    for (const domain of ADMIN_EMAIL_DOMAINS) {
        if (primaryEmail.endsWith(domain)) {
            console.log('✅ Admin access granted via email domain');
            return true;
        }
    }

    console.log('❌ Admin access denied');
    return false;
}

/**
 * Hook to check if current user is an admin
 * Use this in components that need to conditionally render admin features
 */
export function useIsAdmin() {
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();

    if (!isLoaded || !isSignedIn || !user) {
        return { isLoaded, isAdmin: false };
    }

    return { isLoaded: true, isAdmin: checkAdminAccess(user) };
}
