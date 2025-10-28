import { SignIn } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [logoutMessage, setLogoutMessage] = useState(null);

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
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 py-8">
      {/* Logout/Error confirmation message */}
      {logoutMessage && (
        <div className={`mb-4 p-4 border rounded-lg flex items-start max-w-md w-full mx-auto ${
          logoutMessage.includes('deletion') || logoutMessage.includes('restricted') || logoutMessage.includes('scheduled')
            ? 'bg-red-50 border-red-400 text-red-800'
            : 'bg-green-50 border-green-400 text-green-800'
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
                ? 'text-red-600 hover:text-red-800'
                : 'text-green-600 hover:text-green-800'
            }`}
          >
            ×
          </button>
        </div>
      )}

      <SignIn
        routing="virtual"
        signUpUrl="/register"
        afterSignInUrl="/dashboard"
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
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
          Forgot your password?
        </button>
      </div>
    </div>
  );
}
