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

  // Check for mock token (for testing)
  if (token === 'mock-user-token') {
    console.log('🧪 Using mock user token for testing');
    req.auth = {
      payload: {
        sub: 'auth0|test-user-123',
        name: 'Test User',
        email: 'test@example.com',
        picture: 'https://example.com/avatar.jpg',
        aud: process.env.AUTH0_AUDIENCE,
        iss: `https://${process.env.AUTH0_DOMAIN}/`,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }
    };
    console.log('🔍 Mock Token Payload:', JSON.stringify(req.auth.payload, null, 2));
    return next();
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
    
    // Log the token payload for debugging
    console.log('🔍 Auth0 Token Payload:', JSON.stringify(req.auth.payload, null, 2));
    
    // Token is valid, continue to the next middleware
    next();
  });
};
