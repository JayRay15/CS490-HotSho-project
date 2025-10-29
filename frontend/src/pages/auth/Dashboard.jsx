import { useEffect, useState } from "react";
import { RedirectToSignIn, useAuth, useUser } from "@clerk/clerk-react";
import api, { setAuthToken } from "../../api/axios";
import ErrorMessage from "../../components/ErrorMessage";
import LoadingSpinner from "../../components/LoadingSpinner";
import Card from "../../components/Card";
import Container from "../../components/Container";

export default function Dashboard() {
  const { isLoaded, isSignedIn, signOut, getToken } = useAuth();
  const { user } = useUser();

  const [isRegistering, setIsRegistering] = useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = useState(true);
  const [accountStatus, setAccountStatus] = useState(null); // 'active', 'deleted', or null

  // Check account status first before showing dashboard
  useEffect(() => {
    const checkAccountAndRegister = async () => {
      if (!isSignedIn) {
        setIsCheckingAccount(false);
        return;
      }

      setIsCheckingAccount(true);
      setIsRegistering(true);

      try {
        const token = await getToken();
        setAuthToken(token);

        // Try to get user data
        try {
          await api.get('/api/users/me');
          setAccountStatus('active');
        } catch (err) {
          // Check if account is deleted/restricted (403 error)
          if (err?.response?.status === 403) {
            console.log("Account is deleted or restricted - forcing logout");
            setAccountStatus('deleted');
            sessionStorage.setItem(
              "logoutMessage",
              err?.response?.data?.message || "Your account has been scheduled for deletion and cannot be accessed."
            );
            // Delay signOut slightly to ensure state is set
            setTimeout(() => signOut(), 100);
            return;
          }

          // If user not found (404), register them
          if (err.response?.status === 404 || err.customError?.errorCode === 3001) {
            console.log("User not found in database, registering...");
            await api.post('/api/auth/register');
            setAccountStatus('active');
          } else {
            // Other errors - treat as active but log error
            console.error("Error checking user status:", err);
            setAccountStatus('active');
          }
        }
      } catch (err) {
        console.error("Error in account check:", err);
        setAccountStatus('active'); // Fail open to avoid blocking legitimate users
      } finally {
        setIsRegistering(false);
        setIsCheckingAccount(false);
      }
    };

    if (isSignedIn) {
      checkAccountAndRegister();
    }
  }, [isSignedIn, getToken, signOut]);

  // Show loading while checking account or Clerk is loading
  if (!isLoaded || isCheckingAccount || isRegistering) {
    return (
      <LoadingSpinner
        fullScreen={true}
        size="lg"
        text="Loading your dashboard..."
        variant="logo"
      />
    );
  }

  // Don't render dashboard if account is deleted
  if (accountStatus === 'deleted') {
    return (
      <LoadingSpinner
        fullScreen={true}
        size="md"
        text="Redirecting..."
        variant="spinner"
      />
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#E4E6E0' }}>
      <Container className="pt-12 pb-12" level={1}>
        <div className="max-w-2xl mx-auto">
          <Card title={`Welcome, ${user?.fullName || user?.primaryEmailAddress?.emailAddress}`} variant="primary" className="mb-4">
            <div className="flex justify-between items-start">
              <p className="text-sm" style={{ color: '#656A5C' }}>You are successfully logged in!</p>
              <button
                onClick={() => {
                  sessionStorage.setItem("logoutMessage", "You have been successfully logged out");
                  signOut();
                }}
                className="px-4 py-2 text-white rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ backgroundColor: '#EF4444' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
              >
                Logout
              </button>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            <Card title="Account Overview" variant="default">
              <p className="text-sm text-gray-700">Quick stats and recent activity will appear here.</p>
            </Card>

            <Card title="Notifications" variant="info" interactive>
              <p className="text-sm text-gray-700">No new notifications.</p>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}

