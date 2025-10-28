import { SignedIn, SignedOut, SignUpButton } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-96">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Create Account
        </h2>

        <p className="text-gray-600 text-center mb-6">
          Sign up to start using Job Seeker ATS
        </p>

        <SignedOut>
          <SignUpButton mode="modal" afterSignUpUrl="/dashboard" afterSignInUrl="/dashboard">
            <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium">
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium"
          >
            Go to Dashboard
          </button>
        </SignedIn>

        <p className="mt-6 text-sm text-center text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 underline hover:text-blue-700">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
