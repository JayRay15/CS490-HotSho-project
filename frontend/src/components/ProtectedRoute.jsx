import { useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";
import LoadingSpinner from "./LoadingSpinner";

/**
 * ProtectedRoute - Wrapper component to protect routes that require authentication
 * 
 * Features:
 * - Redirects unauthenticated users to login page
 * - Preserves the intended destination for post-login redirect
 * - Shows loading state while checking authentication
 * - Prevents error pages when navigating back after logout
 */
export default function ProtectedRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
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
  // Save current location so user can be redirected back after login
  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected content
  return children;
}
