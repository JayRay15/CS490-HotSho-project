import { clerkClient } from "@clerk/express";
import { ERROR_CODES, errorResponse, sendResponse } from "../utils/responseFormat.js";
import logger from "../utils/logger.js";

/**
 * Middleware to require admin access
 * Must be used after checkJwt middleware
 * 
 * Checks for admin access via:
 * 1. publicMetadata.role === "admin"
 * 2. publicMetadata.isAdmin === true
 */
export const requireAdmin = async (req, res, next) => {
  try {
    // Get the user ID from the authenticated request
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    const userId = auth?.userId || auth?.payload?.sub || req.user?.id;

    if (!userId) {
      const { response, statusCode } = errorResponse(
        "Unauthorized: User not authenticated",
        401,
        ERROR_CODES.UNAUTHORIZED
      );
      return sendResponse(res, response, statusCode);
    }

    // Fetch the full user from Clerk to get publicMetadata
    const user = await clerkClient.users.getUser(userId);

    if (!user) {
      const { response, statusCode } = errorResponse(
        "Unauthorized: User not found",
        401,
        ERROR_CODES.UNAUTHORIZED
      );
      return sendResponse(res, response, statusCode);
    }

    // Check for admin access
    const metadata = user.publicMetadata || {};
    const isAdmin = metadata.role === "admin" || metadata.isAdmin === true;

    if (!isAdmin) {
      logger.warn(`Admin access denied for user ${userId}`);
      const { response, statusCode } = errorResponse(
        "Forbidden: Admin access required",
        403,
        ERROR_CODES.FORBIDDEN
      );
      return sendResponse(res, response, statusCode);
    }

    // Add user metadata to request for use in controllers
    req.userMetadata = {
      isAdmin: true,
      role: metadata.role,
      email: user.emailAddresses?.[0]?.emailAddress,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Admin'
    };

    logger.debug(`Admin access granted for user ${userId}`);
    next();
  } catch (error) {
    logger.error('Error checking admin access:', error);
    const { response, statusCode } = errorResponse(
      "Internal server error while checking admin access",
      500,
      ERROR_CODES.SERVER_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};
