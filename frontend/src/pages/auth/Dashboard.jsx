import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../../api/axios";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading, logout, getAccessTokenSilently } = useAuth0();
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get Auth0 token
        const token = await getAccessTokenSilently();
        
        // Set token in axios
        setAuthToken(token);

        // Call backend to get or create user profile
        const response = await api.get("/api/users/me");
        setUserData(response.data.data);
      } catch (err) {
        console.error("Error fetching user data:", err);
        
        // If user doesn't exist, register them
        if (err.response?.status === 404) {
          try {
            const token = await getAccessTokenSilently();
            setAuthToken(token);
            const registerResponse = await api.post("/api/auth/register");
            setUserData(registerResponse.data.data);
          } catch (regErr) {
            console.error("Error registering user:", regErr);
            setError("Failed to create user profile");
          }
        } else {
          setError("Failed to load user data");
        }
      }
    };

    if (isAuthenticated) {
      fetchUserData();
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
      <div className="bg-white p-8 rounded-2xl shadow-md max-w-2xl w-full">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-semibold mb-2">
              Welcome, {user?.name || user?.email} 
            </h1>
            <p className="text-gray-600">You are successfully logged in!</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>

        <div className="space-y-4">
          <div className="border-t pt-4">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            {userData ? (
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {userData.name}</p>
                <p><span className="font-medium">Email:</span> {userData.email}</p>
                <p><span className="font-medium">Auth0 ID:</span> {userData.auth0Id}</p>
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
