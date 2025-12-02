import { SignIn } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [logoutMessage, setLogoutMessage] = useState(null);

  // Get the page user was trying to access (passed from ProtectedRoute)
  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    // Check for logout success message
    const message = sessionStorage.getItem("logoutMessage");
    if (message) {
      setLogoutMessage(message);
      sessionStorage.removeItem("logoutMessage");
      
      // Auto-hide message after 5 seconds
      const timer = setTimeout(() => {
        setLogoutMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-background py-8">
      {/* Logout/Error confirmation message */}
      {logoutMessage && (
        <div className={`mb-4 p-4 border rounded-lg flex items-start max-w-md w-full mx-auto ${
          logoutMessage.includes('deletion') || logoutMessage.includes('restricted') || logoutMessage.includes('scheduled')
            ? 'bg-error-50 border-error-400 text-error-800'
            : 'bg-success-50 border-success-400 text-success-800'
        }`}>
          <div className="flex-1">
            {logoutMessage.includes('deletion') || logoutMessage.includes('restricted') ? (
              <div>
                <p className="font-semibold mb-1">Account Access Restricted</p>
                <p className="text-sm">{logoutMessage}</p>
              </div>
            ) : (
              <span>{logoutMessage}</span>
            )}
          </div>
          <button
            onClick={() => setLogoutMessage(null)}
            className={`ml-3 font-bold text-xl leading-none ${
              logoutMessage.includes('deletion') || logoutMessage.includes('restricted')
                ? 'text-error-600 hover:text-error-800'
                : 'text-success-600 hover:text-success-800'
            }`}
          >
            ×
          </button>
        </div>
      )}

      <SignIn
        routing="virtual"
        signUpUrl="/register"
        afterSignInUrl={from}
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-md",
          },
        }}
      />

      {/* Custom Forgot Password Link */}
      <div className="mt-4 text-center">
        <button
          onClick={() => navigate("/forgot-password")}
          className="text-sm text-primary hover:text-primary-600 hover:underline transition-colors"
        >
          Forgot your password?
        </button>
      </div>

      {/* Shared computer warning */}
      <div className="mt-6 max-w-md text-center text-xs text-gray-500 px-4">
        <p>
          <strong>Using a shared computer?</strong> If you previously signed in with Google or LinkedIn, 
          make sure to sign out of those services directly or use an incognito/private window.
        </p>
      </div>
    </div>
  );
}
