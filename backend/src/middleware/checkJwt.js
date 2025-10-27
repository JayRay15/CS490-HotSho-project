import { auth } from "express-oauth2-jwt-bearer";
import { errorResponse, sendResponse } from "../utils/responseFormat.js";

// Create the Auth0 JWT middleware
const auth0Jwt = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  tokenSigningAlg: "RS256",
});

// Custom middleware that properly handles Auth0 JWT validation
export const checkJwt = (req, res, next) => {
  // Check if Authorization header exists
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const { response, statusCode } = errorResponse("Authorization token required", 401);
    return sendResponse(res, response, statusCode);
  }

  // Use Auth0 JWT middleware with proper error handling
  auth0Jwt(req, res, (err) => {
    if (err) {
      console.error('JWT Validation Error:', err.message);
      
      // Handle different types of JWT errors
      if (err.name === 'UnauthorizedError' || err.name === 'InvalidTokenError') {
        const { response, statusCode } = errorResponse("Invalid or expired token", 401);
        return sendResponse(res, response, statusCode);
      }
      
      // Handle other errors
      const { response, statusCode } = errorResponse("Token validation failed", 401);
      return sendResponse(res, response, statusCode);
    }
    
    // Token is valid, continue to the next middleware
    next();
  });
};
