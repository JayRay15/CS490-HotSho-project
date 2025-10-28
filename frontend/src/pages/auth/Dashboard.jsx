import { useEffect, useState } from "react";
import { RedirectToSignIn, useAuth, useUser } from "@clerk/clerk-react";
import api, { setAuthToken, retryRequest } from "../../api/axios";
import ErrorMessage from "../../components/ErrorMessage";

export default function Dashboard() {
  const { isLoaded, isSignedIn, signOut, getToken } = useAuth();
  const { user } = useUser();
  const [isRegistering, setIsRegistering] = useState(false);

  // Auto-register user in MongoDB if not already registered
  useEffect(() => {
    const ensureUserRegistered = async () => {
      if (!isSignedIn) return;

      setIsRegistering(true);
      try {
        const token = await getToken();
        setAuthToken(token);
        
        // Try to get user, if not found, register them
        try {
          await api.get('/api/users/me');
        } catch (err) {
          if (err.response?.status === 404 || err.customError?.errorCode === 3001) {
            console.log("User not found in database, registering...");
            await api.post('/api/auth/register');
          }
        }
      } catch (err) {
        console.error("Error ensuring user registration:", err);
      } finally {
        setIsRegistering(false);
      }
    };

    if (isSignedIn) {
      ensureUserRegistered();
    }
  }, [isSignedIn, getToken]);

  if (!isLoaded || isRegistering) {
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
      </div>
    </div>
  );
}

