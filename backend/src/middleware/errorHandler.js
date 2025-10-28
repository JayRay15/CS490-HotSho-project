import { ERROR_CODES, errorResponse, sendResponse } from "../utils/responseFormat.js";

/**
 * Global error handling middleware
 * Catches all errors and returns standardized error responses
 */
export const errorHandler = (err, req, res, next) => {
  // Log error for debugging (always log 500 errors)
  if (err.statusCode >= 500 || !err.statusCode) {
    console.error('❌ Server Error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));

    const { response, statusCode } = errorResponse(
      "Validation failed",
      400,
      ERROR_CODES.VALIDATION_ERROR,
      errors
    );
    return sendResponse(res, response, statusCode);
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    const { response, statusCode } = errorResponse(
      `${field} already exists`,
      409,
      ERROR_CODES.DUPLICATE_ENTRY,
      [{ field, message: `This ${field} is already registered`, value: err.keyValue[field] }]
    );
    return sendResponse(res, response, statusCode);
  }

  // Handle Mongoose cast errors (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    const { response, statusCode } = errorResponse(
      `Invalid ${err.path}: ${err.value}`,
      400,
      ERROR_CODES.INVALID_INPUT,
      [{ field: err.path, message: `Invalid ${err.path} format`, value: err.value }]
    );
    return sendResponse(res, response, statusCode);
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    const { response, statusCode } = errorResponse(
      "Invalid token",
      401,
      ERROR_CODES.INVALID_TOKEN
    );
    return sendResponse(res, response, statusCode);
  }

  if (err.name === 'TokenExpiredError') {
    const { response, statusCode } = errorResponse(
      "Token expired",
      401,
      ERROR_CODES.TOKEN_EXPIRED
    );
    return sendResponse(res, response, statusCode);
  }

  // Handle custom errors with statusCode property
  if (err.statusCode) {
    const { response, statusCode } = errorResponse(
      err.message,
      err.statusCode,
      err.errorCode || ERROR_CODES.INTERNAL_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  // Default to 500 server error (hide internal details from client)
  const { response, statusCode } = errorResponse(
    "An unexpected error occurred. Please try again later.",
    500,
    ERROR_CODES.INTERNAL_ERROR
  );
  return sendResponse(res, response, statusCode);
};

/**
 * Handle 404 - Not Found errors
 */
export const notFoundHandler = (req, res, next) => {
  const { response, statusCode } = errorResponse(
    `Cannot ${req.method} ${req.path}`,
    404,
    ERROR_CODES.NOT_FOUND
  );
  sendResponse(res, response, statusCode);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 * Usage: asyncHandler(async (req, res) => { ... })
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
