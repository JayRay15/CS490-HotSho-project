import { requireAuth } from "@clerk/express";
import { ERROR_CODES, errorResponse, sendResponse } from "../utils/responseFormat.js";

// Use Clerk to protect routes; attaches auth info at req.auth with userId, sessionId, etc.
const clerkAuth = requireAuth();

// Wrapper to provide consistent error responses
const checkJwt = (req, res, next) => {
  clerkAuth(req, res, (err) => {
    if (err) {
      // Handle Clerk authentication errors with standardized format
      const { response, statusCode } = errorResponse(
        "Unauthorized: Invalid or missing authentication token",
        401,
        ERROR_CODES.UNAUTHORIZED
      );
      return sendResponse(res, response, statusCode);
    }
    
    // Verify userId is present
    if (!req.auth?.userId && !req.auth?.payload?.sub) {
      const { response, statusCode } = errorResponse(
        "Unauthorized: Unable to identify user",
        401,
        ERROR_CODES.UNAUTHORIZED
      );
      return sendResponse(res, response, statusCode);
    }
    
    next();
  });
};

export { checkJwt };
