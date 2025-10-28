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
      {/* Logout confirmation message */}
      {logoutMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center justify-between max-w-md w-full mx-auto">
          <span>{logoutMessage}</span>
          <button
            onClick={() => setLogoutMessage(null)}
            className="ml-2 text-green-700 hover:text-green-900 font-bold"
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
