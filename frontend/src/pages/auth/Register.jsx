import { SignUp } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function Register() {
  const [logoutMessage, setLogoutMessage] = useState(null);
  const [searchParams] = useSearchParams();
  const advisorToken = searchParams.get("advisorToken");
  const mentorInviteToken = searchParams.get("mentor-invite");

  useEffect(() => {
    // Store advisor token for after signup
    if (advisorToken) {
      localStorage.setItem("pendingAdvisorToken", advisorToken);
    }
    // Store mentor invite token for after signup
    if (mentorInviteToken) {
      localStorage.setItem("pendingMentorToken", mentorInviteToken);
    }
  }, [advisorToken, mentorInviteToken]);

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

  // Determine redirect URL after signup
  const getAfterSignUpUrl = () => {
    if (advisorToken) return "/advisors";
    if (mentorInviteToken) return "/mentors-advisors";
    return "/dashboard";
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-background py-8">
      {/* Advisor invitation notice */}
      {advisorToken && (
        <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg max-w-md w-full mx-auto">
          <p className="font-medium">🎉 You&apos;ve been invited to be a Career Advisor!</p>
          <p className="text-sm mt-1">Sign up to accept the invitation and start helping.</p>
        </div>
      )}

      {/* Mentor invitation notice */}
      {mentorInviteToken && (
        <div className="mb-4 p-4 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg max-w-md w-full mx-auto">
          <p className="font-medium">🌟 You&apos;ve been invited to be a Mentor!</p>
          <p className="text-sm mt-1">Sign up to accept the invitation and start mentoring.</p>
        </div>
      )}

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
        afterSignUpUrl={getAfterSignUpUrl()}
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
