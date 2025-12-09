import { ERROR_CODES, errorResponse, sendResponse } from "../utils/responseFormat.js";
import logger from "../utils/logger.js";

/**
 * Global error handling middleware
 * Catches all errors and returns standardized error responses
 * Integrates with structured logging for monitoring and alerting
 */
export const errorHandler = (err, req, res, next) => {
  // Create request-scoped logger for better tracing
  const reqLogger = logger.forRequest(req);

  // Log error with structured data for monitoring
  const errorContext = {
    error: err.message,
    errorName: err.name,
    errorCode: err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    statusCode: err.statusCode || 500,
    userId: req.user?.id || req.auth?.userId
  };

  // Log based on error severity
  if (err.statusCode >= 500 || !err.statusCode) {
    reqLogger.error('Server error occurred', errorContext);
  } else if (err.statusCode >= 400) {
    reqLogger.warn('Client error occurred', errorContext);
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

  // Handle Multer errors (file upload)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const { response, statusCode } = errorResponse(
        "File is too large. Maximum size is 5 MB.",
        400,
        ERROR_CODES.FILE_TOO_LARGE
      );
      return sendResponse(res, response, statusCode);
    }

    const { response, statusCode } = errorResponse(
      err.message || "File upload error",
      400,
      ERROR_CODES.UPLOAD_FAILED
    );
    return sendResponse(res, response, statusCode);
  }

  // Handle file filter errors (invalid file type)
  if (err.message && err.message.includes('Invalid file type')) {
    const { response, statusCode } = errorResponse(
      err.message,
      400,
      ERROR_CODES.INVALID_FILE_TYPE
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
  logger.debug('Route not found', { method: req.method, path: req.path });

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
    // Return the promise so callers (tests) can await the wrapped handler.
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};
