import { User } from "../models/User.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES, validationErrorResponse } from "../utils/responseFormat.js";
import { clerkClient } from "@clerk/express";
import { asyncHandler } from "../middleware/errorHandler.js";

// POST /api/auth/register - Create new user account (Auth0 integration)
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

  // Check if user already exists by Auth0/Clerk ID
  const existingUser = await User.findOne({ auth0Id: userId });
  if (existingUser) {
    // Make this endpoint idempotent: return the existing user as success
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
    const { response, statusCode } = errorResponse(
      "An account with this email already exists",
      409,
      ERROR_CODES.DUPLICATE_ENTRY,
      [{ field: 'email', message: 'This email is already registered', value: email }]
    );
    return sendResponse(res, response, statusCode);
  }

  // Create new user with Auth0 data
  const userData = {
    auth0Id: userId,
    name: name || 'Unknown User',
    email: email,
    picture: picture || null
  };

  const user = await User.create(userData);

  console.log(`🆕 New user created via Auth0: ${userData.email}`);

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
export const logout = asyncHandler(async (req, res) => {
  // Since we're using Auth0, the actual logout is handled on the frontend
  // This endpoint is for any server-side cleanup if needed
  const { response, statusCode } = successResponse("User logged out successfully");
  return sendResponse(res, response, statusCode);
});
