import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api, { setAuthToken } from '../api/axios';

/**
 * Custom hook to check if the current user's account has been deleted
 * With immediate deletion policy (UC-009), deleted accounts are permanently removed
 * from the database immediately. This hook catches race conditions where a user
 * might still have a valid token but their account was just deleted.
 * 
 * Usage: Add this hook to any protected component
 * useAccountDeletionCheck();
 */
export const useAccountDeletionCheck = () => {
  const { isSignedIn, getToken, signOut } = useAuth();

  useEffect(() => {
    const checkAccountStatus = async () => {
      if (!isSignedIn) return;

      try {
        const token = await getToken();
        setAuthToken(token);
        
        // Try to fetch user data to verify account exists
        await api.get('/api/users/me');
        
        // If successful, account is active - do nothing
      } catch (err) {
        // If account is deleted or not found (403/404 error), force logout
        if (err?.response?.status === 403 || err?.response?.status === 404 || err?.customError?.isAccountDeleted) {
          console.log("Account has been deleted or does not exist - forcing logout");
          sessionStorage.setItem(
            "logoutMessage", 
            err?.response?.data?.message || "Your account has been deleted."
          );
          signOut();
        }
        // For other errors (network, 500, etc.), don't force logout
      }
    };

    checkAccountStatus();
  }, [isSignedIn, getToken, signOut]);
};
