/**
 * Standardized API response format utility
 */

export const createResponse = (success, message, data = null, statusCode = 200) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString(),
    ...(data && { data })
  };

  return { response, statusCode };
};

export const successResponse = (message, data = null, statusCode = 200) => {
  return createResponse(true, message, data, statusCode);
};

export const errorResponse = (message, statusCode = 400, data = null) => {
  return createResponse(false, message, data, statusCode);
};

export const sendResponse = (res, response, statusCode) => {
  return res.status(statusCode).json(response);
};
