import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-96">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Welcome Back!
        </h2>

        {/* No custom error UI; Clerk handles errors in its UI */}

        <p className="text-gray-600 text-center mb-6">
          Sign in to access your Job Seeker ATS account
        </p>

        <SignedOut>
          <SignInButton mode="modal" afterSignInUrl="/dashboard">
            <button
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium"
          >
            Go to Dashboard
          </button>
        </SignedIn>

        {/* Clerk provides UI for sign in; no manual reset needed */}

        <p className="mt-6 text-sm text-center text-gray-600">
          Don't have an account?{" "}
          <a href="/register" className="text-blue-600 underline hover:text-blue-700">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
