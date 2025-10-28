import { useState } from "react";
import { useSignIn } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: email, 2: code+password
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLoaded) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      // Optional: Log to backend for analytics/tracking (doesn't require auth)
      try {
        await fetch("http://localhost:5000/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
      } catch (logErr) {
        // Silent fail - logging is optional
        console.debug("Backend logging failed:", logErr);
      }

      // Use Clerk's built-in password reset - sends a CODE via email
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });

      // Move to step 2: enter code and new password
      setStep(2);
      setSuccessMessage(
        "A 6-digit code has been sent to your email. Please check your inbox and enter the code below."
      );
    } catch (err) {
      console.error("Password reset error:", err);
      
      // Generic message for security
      setSuccessMessage(
        "If an account exists with this email, you will receive a verification code shortly."
      );
      setStep(2); // Still move to step 2 for security
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!isLoaded) return;

    // Validate code
    if (!code || code.length !== 6) {
      setError("Please enter the 6-digit code from your email");
      return;
    }

    // Validate password - comprehensive validation matching registration rules
    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!/(?=.*[a-z])/.test(newPassword)) {
      setError("Password must contain at least one lowercase letter");
      return;
    }

    if (!/(?=.*[A-Z])/.test(newPassword)) {
      setError("Password must contain at least one uppercase letter");
      return;
    }

    if (!/(?=.*\d)/.test(newPassword)) {
      setError("Password must contain at least one number");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      // Attempt to reset password with the code
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code,
        password: newPassword,
      });

      if (result.status === "complete") {
        // Sign the user in automatically
        await setActive({ session: result.createdSessionId });
        
        setSuccessMessage("Password reset successful! Redirecting to dashboard...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    } catch (err) {
      console.error("Reset password error:", err);
      
      if (err.errors && err.errors[0]) {
        const errorMsg = err.errors[0].message;
        if (errorMsg.includes("code")) {
          setError("Invalid or expired code. Please try again or request a new code.");
        } else if (errorMsg.includes("password")) {
          setError("Password doesn't meet requirements. Use at least 8 characters.");
        } else {
          setError(errorMsg);
        }
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-96">
        <h2 className="text-2xl font-semibold mb-2 text-center">
          {step === 1 ? "Forgot Password?" : "Reset Your Password"}
        </h2>
        <p className="text-gray-600 text-center mb-6 text-sm">
          {step === 1 
            ? "Enter your email address and we'll send you a verification code."
            : "Enter the 6-digit code from your email and your new password."
          }
        </p>

        {successMessage && step === 2 && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4 text-sm">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="you@example.com"
                required
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Sending Code..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength="6"
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the 6-digit code sent to {email}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Minimum 8 characters"
                required
                minLength="8"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be 8+ characters with uppercase, lowercase, and number
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Re-enter password"
                required
                minLength="8"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setCode("");
                setNewPassword("");
                setConfirmPassword("");
                setError("");
                setSuccessMessage("");
              }}
              className="w-full mt-3 text-sm text-gray-600 hover:text-gray-800"
            >
              Didn't receive code? Try a different email
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Back to Login
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Verification codes expire after 10 minutes.</p>
          <p className="mt-1">For security, you can request multiple codes but only the latest will work.</p>
        </div>
      </div>
    </div>
  );
}
