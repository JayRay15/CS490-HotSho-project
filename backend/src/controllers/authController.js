import { User } from "../models/User.js";
import { successResponse, errorResponse, sendResponse } from "../utils/responseFormat.js";

// POST /api/auth/register - Create new user account (Auth0 integration)
export const register = async (req, res) => {
  try {
    const { sub, name, email, picture } = req.auth.payload;

    // Check if user already exists by Auth0 ID
    const existingUser = await User.findOne({ auth0Id: sub });
    if (existingUser) {
      const { response, statusCode } = errorResponse("User already exists", 400);
      return sendResponse(res, response, statusCode);
    }

    // Create new user with Auth0 data
    const userData = {
      auth0Id: sub,
      name: name || 'Unknown User',
      email: email || `user-${sub}@example.com`,
      picture: picture || null
    };

    const user = await User.create(userData);

    console.log(`🆕 New user created via Auth0: ${userData.email}`);

    const { response, statusCode } = successResponse("User registered successfully", user, 201);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Registration error:", err);
    
    if (err.code === 11000) {
      const { response, statusCode } = errorResponse("User already exists", 400);
      return sendResponse(res, response, statusCode);
    }

    if (err.name === 'ValidationError') {
      const { response, statusCode } = errorResponse("Validation error: " + err.message, 400);
      return sendResponse(res, response, statusCode);
    }

    const { response, statusCode } = errorResponse("Internal server error", 500);
    return sendResponse(res, response, statusCode);
  }
};

// POST /api/auth/login - Authenticate user
export const login = async (req, res) => {
  try {
    const { sub } = req.auth.payload;

    const user = await User.findOne({ auth0Id: sub });
    
    if (!user) {
      const { response, statusCode } = errorResponse("User not found", 404);
      return sendResponse(res, response, statusCode);
    }

    const { response, statusCode } = successResponse("User authenticated successfully", user);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Login error:", err);
    const { response, statusCode } = errorResponse("Internal server error", 500);
    return sendResponse(res, response, statusCode);
  }
};

// POST /api/auth/logout - End user session
export const logout = async (req, res) => {
  try {
    // Since we're using Auth0, the actual logout is handled on the frontend
    // This endpoint is for any server-side cleanup if needed
    const { response, statusCode } = successResponse("User logged out successfully");
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Logout error:", err);
    const { response, statusCode } = errorResponse("Internal server error", 500);
    return sendResponse(res, response, statusCode);
  }
};
