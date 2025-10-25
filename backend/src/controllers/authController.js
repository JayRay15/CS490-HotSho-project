import { User } from "../models/User.js";
import { successResponse, errorResponse, sendResponse } from "../utils/responseFormat.js";

// POST /api/auth/register - Create new user account
export const register = async (req, res) => {
  try {
    console.log('🔍 Register request payload:', JSON.stringify(req.auth.payload, null, 2));
    
    const { sub, name, email, picture } = req.auth.payload;

    // Check if we have the required user data
    if (!sub) {
      console.error('❌ No sub (user ID) in token payload');
      const { response, statusCode } = errorResponse("Invalid token: missing user ID", 400);
      return sendResponse(res, response, statusCode);
    }

    // For client credentials tokens, we might not have user info
    if (!name || !email) {
      console.log('⚠️  Token missing user info (likely client credentials token)');
      const { response, statusCode } = errorResponse("Token does not contain user information. Please use a user authentication token.", 400);
      return sendResponse(res, response, statusCode);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ auth0Id: sub });
    if (existingUser) {
      const { response, statusCode } = errorResponse("User already exists", 400);
      return sendResponse(res, response, statusCode);
    }

    // Create new user
    const user = await User.create({ 
      auth0Id: sub, 
      name, 
      email, 
      picture 
    });

    console.log(`🆕 New user created: ${email}`);

    const { response, statusCode } = successResponse("User registered successfully", user, 201);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Registration error:", err);
    console.error("Error details:", {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack
    });
    
    if (err.code === 11000) {
      const { response, statusCode } = errorResponse("User already exists", 400);
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
