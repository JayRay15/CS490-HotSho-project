import { User } from "../models/User.js";
import { successResponse, errorResponse, sendResponse } from "../utils/responseFormat.js";

// GET /api/users/me - Get current user profile
export const getCurrentUser = async (req, res) => {
  try {
    const { sub } = req.auth.payload;

    const user = await User.findOne({ auth0Id: sub });
    
    if (!user) {
      const { response, statusCode } = errorResponse("User not found", 404);
      return sendResponse(res, response, statusCode);
    }

    const { response, statusCode } = successResponse("User profile retrieved successfully", user);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Get current user error:", err);
    const { response, statusCode } = errorResponse("Internal server error", 500);
    return sendResponse(res, response, statusCode);
  }
};

// PUT /api/users/me - Update current user profile
export const updateCurrentUser = async (req, res) => {
  try {
    const { sub } = req.auth.payload;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.auth0Id;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const user = await User.findOneAndUpdate(
      { auth0Id: sub },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      const { response, statusCode } = errorResponse("User not found", 404);
      return sendResponse(res, response, statusCode);
    }

    const { response, statusCode } = successResponse("User profile updated successfully", user);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Update current user error:", err);
    
    if (err.name === 'ValidationError') {
      const { response, statusCode } = errorResponse("Validation error: " + err.message, 400);
      return sendResponse(res, response, statusCode);
    }

    const { response, statusCode } = errorResponse("Internal server error", 500);
    return sendResponse(res, response, statusCode);
  }
};
