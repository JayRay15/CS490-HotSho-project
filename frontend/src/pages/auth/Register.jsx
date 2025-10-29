import { SignUp } from "@clerk/clerk-react";
import { useEffect, useState } from "react";

export default function Register() {
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
    <div className="flex flex-col justify-center items-center min-h-screen bg-background py-8">
      {/* Logout confirmation message */}
      {logoutMessage && (
        <div className="mb-4 p-3 bg-success-100 border border-success-400 text-success-700 rounded-lg flex items-center justify-between max-w-md w-full mx-auto">
          <span>{logoutMessage}</span>
          <button
            onClick={() => setLogoutMessage(null)}
            className="ml-2 text-success-700 hover:text-success-900 font-bold"
          >
            ×
          </button>
        </div>
      )}

      <SignUp
        routing="virtual"
        signInUrl="/login"
        afterSignUpUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-md",
          },
        }}
      />
    </div>
  );
}
