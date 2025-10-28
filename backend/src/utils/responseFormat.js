/**
 * Standardized API response format utility
 */

// Error codes for consistent error identification
export const ERROR_CODES = {
  // Authentication & Authorization errors (1xxx)
  UNAUTHORIZED: 1001,
  INVALID_TOKEN: 1002,
  TOKEN_EXPIRED: 1003,
  FORBIDDEN: 1004,
  
  // Validation errors (2xxx)
  VALIDATION_ERROR: 2001,
  INVALID_INPUT: 2002,
  MISSING_REQUIRED_FIELD: 2003,
  INVALID_FORMAT: 2004,
  
  // Resource errors (3xxx)
  NOT_FOUND: 3001,
  ALREADY_EXISTS: 3002,
  DUPLICATE_ENTRY: 3003,
  
  // Server errors (5xxx)
  INTERNAL_ERROR: 5001,
  DATABASE_ERROR: 5002,
  EXTERNAL_SERVICE_ERROR: 5003,
  
  // File upload errors (4xxx)
  INVALID_FILE_TYPE: 4001,
  FILE_TOO_LARGE: 4002,
  UPLOAD_FAILED: 4003,
  NO_FILE_PROVIDED: 4004,
  
  // Network errors (6xxx)
  NETWORK_ERROR: 6001,
  TIMEOUT: 6002
};

export const createResponse = (success, message, data = null, statusCode = 200, errorCode = null, errors = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString(),
    ...(errorCode && { errorCode }),
    ...(errors && { errors }),
    ...(data && { data })
  };

  return { response, statusCode };
};

export const successResponse = (message, data = null, statusCode = 200) => {
  return createResponse(true, message, data, statusCode);
};

export const errorResponse = (message, statusCode = 400, errorCode = null, errors = null) => {
  return createResponse(false, message, null, statusCode, errorCode, errors);
};

export const validationErrorResponse = (message, validationErrors) => {
  // Convert validation errors to field-specific format
  const errors = validationErrors.map(err => ({
    field: err.field || err.path,
    message: err.message,
    value: err.value
  }));
  
  return createResponse(false, message, null, 400, ERROR_CODES.VALIDATION_ERROR, errors);
};

export const sendResponse = (res, response, statusCode) => {
  return res.status(statusCode).json(response);
};
