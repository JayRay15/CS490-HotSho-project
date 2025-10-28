import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api, { setAuthToken } from '../api/axios';

/**
 * Custom hook to check if the current user's account has been deleted
 * If deleted, automatically logs the user out
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
        
        // Try to fetch user data to verify account is not deleted
        await api.get('/api/users/me');
        
        // If successful, account is active - do nothing
      } catch (err) {
        // If account is deleted (403 error), force logout
        if (err?.response?.status === 403 || err?.customError?.isAccountDeleted) {
          console.log("Account is deleted or restricted - forcing logout");
          sessionStorage.setItem(
            "logoutMessage", 
            err?.response?.data?.message || "Your account access has been restricted."
          );
          signOut();
        }
        // For other errors (network, 500, etc.), don't force logout
      }
    };

    checkAccountStatus();
  }, [isSignedIn, getToken, signOut]);
};
