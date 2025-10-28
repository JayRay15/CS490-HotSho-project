import { useEffect, useState } from "react";
import { RedirectToSignIn, useAuth, useUser } from "@clerk/clerk-react";
import api, { setAuthToken } from "../../api/axios";

export default function Dashboard() {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { user } = useUser();
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = await getToken();
        setAuthToken(token);
        const response = await api.get("/api/users/me");
        setUserData(response.data.data);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
         console.error("Error fetching user data:", err);
         console.error("Error response:", err.response?.data);
         console.error("Error status:", err.response?.status);
       
        if (err.response?.status === 404) {
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
             console.error("Registration error response:", regErr.response?.data);
            // If server says user already exists, just load profile
            if (regErr.response?.status === 400 ||
                /already exists/i.test(regErr.response?.data?.message || "")) {
              try {
                await loadProfile();
                return;
              } catch (_) {}
            }
            setError(`Failed to create user profile: ${regErr.response?.data?.message || regErr.message}`);
          }
        } else {
           setError(`Failed to load user data: ${err.response?.data?.message || err.message}`);
        }
      }
    };
    if (isSignedIn) loadProfile();
  }, [isSignedIn, getToken]);

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
          setError(null);
        }
      } catch (e) {
        // Don't surface polling errors loudly; initial fetch handles UX
        // Console log for debugging only
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
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        <div className="space-y-4">
          <div className="border-t pt-4">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            {userData ? (
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {userData.name}</p>
                <p><span className="font-medium">Email:</span> {userData.email}</p>
                <p><span className="font-medium">User ID:</span> {userData.auth0Id}</p>
                {lastUpdated && (
                  <p className="text-sm text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Loading profile data...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
