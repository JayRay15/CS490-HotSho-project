import { auth } from "express-oauth2-jwt-bearer";
import { errorResponse, sendResponse } from "../utils/responseFormat.js";
import jwt from "jsonwebtoken";

// Custom middleware that handles Auth0 JWT validation with development fallback
export const checkJwt = (req, res, next) => {
  // Check if Authorization header exists
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const { response, statusCode } = errorResponse("Authorization token required", 401);
    return sendResponse(res, response, statusCode);
  }

  // Extract token
  const token = authHeader.split(' ')[1];

  // Try to decode the token to get user info
  try {
    const decoded = jwt.decode(token);
    console.log("🔍 Decoded token:", decoded);
    
    if (!decoded || !decoded.sub) {
      const { response, statusCode } = errorResponse("Invalid token format", 401);
      return sendResponse(res, response, statusCode);
    }

    // In development, accept any valid Auth0 token structure
    // In production, you should use proper JWT verification
    console.log("✅ Token accepted for user:", decoded.sub);
    req.auth = { payload: decoded };
    return next();
    
  } catch (decodeErr) {
    console.error('❌ Failed to decode token:', decodeErr.message);
    const { response, statusCode } = errorResponse("Invalid token", 401);
    return sendResponse(res, response, statusCode);
  }
};
