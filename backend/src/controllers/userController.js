import { User } from "../models/User.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES, validationErrorResponse } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// GET /api/users/me - Get current user profile
export const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  
  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials", 
      401, 
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOne({ auth0Id: userId });
  
  if (!user) {
    const { response, statusCode } = errorResponse(
      "User not found", 
      404, 
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("User profile retrieved successfully", user);
  return sendResponse(res, response, statusCode);
});

// PUT /api/users/me - Update current user profile
export const updateCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const updateData = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials", 
      401, 
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Validate update data
  if (!updateData || Object.keys(updateData).length === 0) {
    const { response, statusCode } = validationErrorResponse(
      "No update data provided",
      [{ field: 'body', message: 'Request body cannot be empty', value: null }]
    );
    return sendResponse(res, response, statusCode);
  }

  // Remove fields that shouldn't be updated directly
  delete updateData.auth0Id;
  delete updateData._id;
  delete updateData.createdAt;
  delete updateData.updatedAt;

  // Validate email format if email is being updated
  if (updateData.email && !updateData.email.includes('@')) {
    const { response, statusCode } = validationErrorResponse(
      "Invalid email format",
      [{ field: 'email', message: 'Please provide a valid email address', value: updateData.email }]
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOneAndUpdate(
    { auth0Id: userId },
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!user) {
    const { response, statusCode } = errorResponse(
      "User not found", 
      404, 
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("User profile updated successfully", user);
  return sendResponse(res, response, statusCode);
});
