import { User } from "../models/User.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES, validationErrorResponse } from "../utils/responseFormat.js";
import { clerkClient } from "@clerk/express";
import { asyncHandler } from "../middleware/errorHandler.js";

// POST /api/auth/register - Create new user account (Clerk integration)
export const register = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials", 
      401, 
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Fetch user details from Clerk
  let name = "Unknown User";
  let email = undefined;
  let picture = undefined;
  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    name = clerkUser.fullName || `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Unknown User";
    email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress;
    picture = clerkUser.imageUrl;
  } catch (e) {
    // If Clerk fetch fails, proceed with minimal data
    console.warn("Failed to fetch user from Clerk:", e.message);
  }

  // Check if user already exists by Clerk ID
  const existingUser = await User.findOne({ auth0Id: userId });
  if (existingUser) {
    // Make this endpoint idempotent: return the existing user as success
    console.log(`ℹ️  User already exists: ${existingUser.email}`);
    const { response, statusCode } = successResponse("User already exists", existingUser);
    return sendResponse(res, response, statusCode);
  }

  // Validate email
  if (!email || !email.includes('@')) {
    const { response, statusCode } = validationErrorResponse(
      "Invalid email address",
      [{ field: 'email', message: 'A valid email address is required', value: email }]
    );
    return sendResponse(res, response, statusCode);
  }

  // Check for duplicate email
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    console.log(`⚠️  Registration blocked: Email already exists: ${email}`);
    const { response, statusCode } = errorResponse(
      "An account with this email already exists",
      409,
      ERROR_CODES.DUPLICATE_ENTRY,
      [{ field: 'email', message: 'This email is already registered', value: email }]
    );
    return sendResponse(res, response, statusCode);
  }

  // Create new user with Clerk data
  const userData = {
    auth0Id: userId,
    name: name || 'Unknown User',
    email: email,
    picture: picture || null
  };

  const user = await User.create(userData);

  console.log(`🆕 New user created via Clerk: ${userData.email}`);

  const { response, statusCode } = successResponse("User registered successfully", user, 201);
  return sendResponse(res, response, statusCode);
});

// POST /api/auth/login - Authenticate user
export const login = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials", 
      401, 
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOne({ auth0Id: userId });
  
  if (!user) {
    const { response, statusCode } = errorResponse(
      "User not found. Please register first.", 
      404, 
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("User authenticated successfully", user);
  return sendResponse(res, response, statusCode);
});

// POST /api/auth/logout - End user session
export const logout = async (req, res) => {
  try {
    // Since we're using Clerk, the actual logout is handled on the frontend
    // This endpoint is for any server-side cleanup if needed
    const { response, statusCode } = successResponse("User logged out successfully");
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Logout error:", err);
    const { response, statusCode } = errorResponse("Internal server error", 500);
    return sendResponse(res, response, statusCode);
  }
};

// POST /api/auth/forgot-password - Log password reset request (optional tracking)
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      const { response, statusCode } = errorResponse("Email is required", 400);
      return sendResponse(res, response, statusCode);
    }

    // Optional: Log the reset request for analytics/security monitoring
    console.log(`🔐 Password reset requested for email: ${email}`);

    // Check if user exists (optional - for logging only)
    const user = await User.findOne({ email });
    if (user) {
      console.log(`✅ User found: ${user.name} (${user.email})`);
    } else {
      console.log(`⚠️  No user found with email: ${email}`);
    }

    // Always return generic success message for security
    // Don't reveal whether the email exists in the system
    const { response, statusCode } = successResponse(
      "If an account exists with this email, a password reset link has been sent",
      { email }
    );
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Forgot password error:", err);
    const { response, statusCode } = errorResponse("Internal server error", 500);
    return sendResponse(res, response, statusCode);
  }
};
