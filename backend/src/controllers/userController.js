import { User } from "../models/User.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES, validationErrorResponse } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import multer from "multer";

// Configure multer for memory storage (we'll convert to Base64)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept only image files (JPG, PNG, GIF)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and GIF are allowed.'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});


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

// POST /api/users/profile-picture - Upload profile picture
export const uploadProfilePicture = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials", 
      401, 
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Check if file was provided
  if (!req.file) {
    const { response, statusCode } = errorResponse(
      "No file provided",
      400,
      ERROR_CODES.NO_FILE_PROVIDED
    );
    return sendResponse(res, response, statusCode);
  }

  try {
    // Convert buffer to Base64
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Update user's picture field
    const user = await User.findOneAndUpdate(
      { auth0Id: userId },
      { $set: { picture: base64Image } },
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

    const { response, statusCode } = successResponse("Profile picture uploaded successfully", {
      picture: user.picture
    });
    return sendResponse(res, response, statusCode);
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    const { response, statusCode } = errorResponse(
      "Failed to upload profile picture",
      500,
      ERROR_CODES.UPLOAD_FAILED
    );
    return sendResponse(res, response, statusCode);
  }
});

// DELETE /api/users/profile-picture - Remove profile picture
export const deleteProfilePicture = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials", 
      401, 
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOneAndUpdate(
    { auth0Id: userId },
    { $unset: { picture: "" } }, // Remove picture field
    { new: true }
  );

  if (!user) {
    const { response, statusCode } = errorResponse(
      "User not found", 
      404, 
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Profile picture removed successfully", {
    picture: null
  });
  return sendResponse(res, response, statusCode);
});

// POST /api/users/employment - Add employment entry
export const addEmployment = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { jobTitle, company, location, startDate, endDate, isCurrentPosition, description } = req.body;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials", 
      401, 
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  // Validate required fields
  const errors = [];
  if (!jobTitle?.trim()) {
    errors.push({ field: 'jobTitle', message: 'Job title is required', value: jobTitle });
  }
  if (!company?.trim()) {
    errors.push({ field: 'company', message: 'Company name is required', value: company });
  }
  if (!startDate) {
    errors.push({ field: 'startDate', message: 'Start date is required', value: startDate });
  }

  // Date validation: start date should be before end date
  if (startDate && endDate && !isCurrentPosition) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      errors.push({ field: 'endDate', message: 'End date must be after start date', value: endDate });
    }
  }

  // Description character limit
  if (description && description.length > 1000) {
    errors.push({ field: 'description', message: 'Description must not exceed 1000 characters', value: description });
  }

  if (errors.length > 0) {
    const { response, statusCode } = validationErrorResponse(
      "Validation failed for employment entry",
      errors
    );
    return sendResponse(res, response, statusCode);
  }

  // Create employment entry
  const employmentEntry = {
    jobTitle: jobTitle.trim(),
    company: company.trim(),
    location: location?.trim() || '',
    startDate: new Date(startDate),
    endDate: isCurrentPosition ? null : (endDate ? new Date(endDate) : null),
    isCurrentPosition: Boolean(isCurrentPosition),
    description: description?.trim() || ''
  };

  // Add to user's employment array
  const user = await User.findOneAndUpdate(
    { auth0Id: userId },
    { $push: { employment: employmentEntry } },
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

  const { response, statusCode } = successResponse("Employment entry added successfully", {
    employment: user.employment
  });
  return sendResponse(res, response, statusCode);
});

