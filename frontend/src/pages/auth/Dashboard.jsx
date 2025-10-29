import { useEffect, useState } from "react";
import { RedirectToSignIn, useAuth, useUser } from "@clerk/clerk-react";
import api, { setAuthToken } from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import Card from "../../components/Card";
import Container from "../../components/Container";
import { calculateProfileCompleteness } from "../../utils/profileCompleteness";

export default function Dashboard() {
  const { isLoaded, isSignedIn, signOut, getToken } = useAuth();
  const { user } = useUser();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = useState(true);
  const [accountStatus, setAccountStatus] = useState(null); // 'active', 'deleted', or null
  const [userData, setUserData] = useState(null);
  const [profileCompleteness, setProfileCompleteness] = useState(0);

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
          const response = await api.get('/api/users/me');
          setAccountStatus('active');
          
          // Set user data and calculate profile completeness
          const data = response.data.data;
          setUserData(data);
          
          // Calculate profile completeness
          const completeness = calculateProfileCompleteness(data);
          setProfileCompleteness(completeness.overallScore);
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
            // After registration, fetch user data again
            const response = await api.get('/api/users/me');
            const data = response.data.data;
            setUserData(data);
            const completeness = calculateProfileCompleteness(data);
            setProfileCompleteness(completeness.overallScore);
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
      <Container level={1} className="pt-12 pb-12">
        <div className="max-w-2xl mx-auto">
          {/* Welcome Card */}
          <Card variant="primary" className="mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-heading font-bold mb-2 wrap-break-word" style={{ color: '#4F5348' }}>
                  Welcome, {user?.fullName || user?.primaryEmailAddress?.emailAddress}
                </h1>
                <p className="text-sm" style={{ color: '#656A5C' }}>
                  You are successfully logged in!
                </p>
              </div>
              <button
                onClick={() => {
                  sessionStorage.setItem("logoutMessage", "You have been successfully logged out");
                  signOut();
                }}
                className="px-6 py-2 text-white rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap self-start sm:self-auto shrink-0"
                style={{ backgroundColor: '#EF4444' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#DC2626'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#EF4444'}
              >
                Logout
              </button>
            </div>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card title="Profile Completion" variant="elevated">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Complete your profile to stand out</p>
                <span className="text-2xl font-bold" style={{ color: '#777C6D' }}>{profileCompleteness}%</span>
              </div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all" 
                  style={{ width: `${profileCompleteness}%`, backgroundColor: '#777C6D' }}
                />
              </div>
            </Card>

            <Card title="Activity Summary" variant="elevated">
              <p className="text-sm text-gray-600 mb-2">Recent updates and activity</p>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Profile viewed 12 times</li>
                <li>• 3 new connections</li>
              </ul>
            </Card>
          </div>

          {/* Notifications Card */}
          <Card title="Notifications" variant="info" interactive>
            <p className="text-sm text-gray-700">
              No new notifications at this time.
            </p>
          </Card>
        </div>
      </Container>
    </div>
  );
}

