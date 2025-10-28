import { useEffect, useState } from "react";
import { RedirectToSignIn, useAuth, useUser } from "@clerk/clerk-react";
import api, { setAuthToken, retryRequest } from "../../api/axios";
import ErrorMessage from "../../components/ErrorMessage";

export default function Dashboard() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { user } = useUser();
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      const token = await getToken();
      setAuthToken(token);
      
      // Use retry mechanism for network resilience
      const response = await retryRequest(async () => {
        return await api.get("/api/users/me");
      });
      
      setUserData(response.data.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error("Error fetching user data:", err);
      
      // If user not found, try to register
      if (err.response?.status === 404 || err.customError?.errorCode === 3001) {
        try {
          const token = await getToken();
          setAuthToken(token);
          console.log("Attempting to register new user...");
          
          const registerResponse = await api.post("/api/auth/register");
          console.log("Registration successful:", registerResponse.data);
          
          setUserData(registerResponse.data.data);
          setLastUpdated(new Date());
          setError(null);
        } catch (regErr) {
          console.error("Registration error:", regErr);
          
          // If server says user already exists, retry loading profile
          if (regErr.response?.status === 409 || regErr.customError?.errorCode === 3003) {
            try {
              await loadProfile();
              return;
            } catch (_) {
              // Fall through to set error
            }
          }
          setError(regErr);
        }
      } else {
        setError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) loadProfile();
  }, [isSignedIn]);

  // Lightweight real-time: poll for profile changes every 3 seconds while signed in
  useEffect(() => {
    if (!isSignedIn) return;

    let cancelled = false;
    let timerId;

    const poll = async () => {
      try {
        const token = await getToken();
        setAuthToken(token);
        const response = await api.get("/api/users/me");
        if (!cancelled) {
          setUserData(response.data.data);
          setLastUpdated(new Date());
        }
      } catch (e) {
        // Don't surface polling errors loudly; initial fetch handles UX
        console.debug("poll(users/me) error:", e?.response?.status || e?.message);
      }
    };

    // Start immediate poll, then interval
    poll();
    timerId = setInterval(poll, 3000);

    return () => {
      cancelled = true;
      if (timerId) clearInterval(timerId);
    };
  }, [isSignedIn, getToken]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
      <div className="bg-white p-8 rounded-2xl shadow-md max-w-2xl w-full">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-semibold mb-2">
              Welcome, {user?.fullName || user?.primaryEmailAddress?.emailAddress}
            </h1>
            <p className="text-gray-600">You are successfully logged in!</p>
          </div>
          <button
            onClick={() => {
              // Store logout success message before Clerk redirects
              sessionStorage.setItem("logoutMessage", "You have been successfully logged out");
              signOut();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        <div className="space-y-4">
          <div className="border-t pt-4">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            
            {/* Error display with retry option */}
            {error && (
              <ErrorMessage
                error={error}
                onRetry={loadProfile}
                onDismiss={() => setError(null)}
                className="mb-4"
              />
            )}

            {isLoading && !userData ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading profile data...</span>
              </div>
            ) : userData ? (
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {userData.name}</p>
                <p><span className="font-medium">Email:</span> {userData.email}</p>
                {userData.bio && <p><span className="font-medium">Bio:</span> {userData.bio}</p>}
                {userData.location && <p><span className="font-medium">Location:</span> {userData.location}</p>}
                {userData.phone && <p><span className="font-medium">Phone:</span> {userData.phone}</p>}
                <p className="text-xs text-gray-400 pt-2">User ID: {userData.auth0Id}</p>
                {lastUpdated && (
                  <p className="text-sm text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

