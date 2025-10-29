import { User } from "../models/User.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES, validationErrorResponse } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { clerkClient } from "@clerk/express";
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

// DELETE /api/users/delete - Permanently delete current user account (requires password confirmation)
export const deleteAccount = asyncHandler(async (req, res) => {
  console.log("🚨 DELETE ACCOUNT ENDPOINT CALLED");
  console.log("Request body:", req.body);
  
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { password } = req.body || {};

  console.log("User ID from auth:", userId);
  console.log("Password provided:", password ? "YES" : "NO");

  if (!userId) {
    console.log("❌ No userId found in auth");
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials",
      401,
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOne({ auth0Id: userId });
  if (!user) {
    const { response, statusCode} = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // If user has a local password, require password confirmation
  if (user.password) {
    if (!password) {
      const { response, statusCode } = validationErrorResponse(
        "Password is required to confirm account deletion",
        [{ field: 'password', message: 'Password confirmation is required', value: null }]
      );
      return sendResponse(res, response, statusCode);
    }

    const match = await user.comparePassword(password);
    if (!match) {
      const { response, statusCode } = errorResponse("Incorrect password", 401, ERROR_CODES.UNAUTHORIZED);
      return sendResponse(res, response, statusCode);
    }
  }

  // Store user data for email before deletion
  const userEmail = user.email;
  const userName = user.name;
  const userIdForLog = user._id;
  const userAuth0Id = user.auth0Id;

  console.log(`🗑️  Permanently deleting account: ${userEmail} (ID: ${userIdForLog}, Auth0: ${userAuth0Id})`);
  
  // CRITICAL: Delete user from Clerk/Auth0 first to prevent re-registration
  try {
    await clerkClient.users.deleteUser(userAuth0Id);
    console.log(`🗑️  Deleted user from Clerk: ${userAuth0Id}`);
  } catch (clerkError) {
    console.error(`⚠️  Failed to delete user from Clerk:`, clerkError.message);
    // Continue with database deletion even if Clerk deletion fails
    // This prevents orphaned accounts in our database
  }
  
  // IMMEDIATE PERMANENT DELETION - Remove account completely from database
  const deleteResult = await User.deleteOne({ _id: user._id });
  
  console.log(`🗑️  Delete result:`, deleteResult);
  console.log(`   - deletedCount: ${deleteResult.deletedCount}`);
  console.log(`   - acknowledged: ${deleteResult.acknowledged}`);
  
  if (deleteResult.deletedCount === 0) {
    console.error(`❌ Failed to delete account - no documents were deleted`);
    const { response, statusCode } = errorResponse(
      "Failed to delete account from database",
      500,
      ERROR_CODES.DATABASE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
  
  // Verify deletion by trying to find the user
  const verifyDeleted = await User.findOne({ _id: userIdForLog });
  if (verifyDeleted) {
    console.error(`❌ CRITICAL: Account still exists after deletion attempt!`);
    const { response, statusCode } = errorResponse(
      "Account deletion failed - please try again",
      500,
      ERROR_CODES.DATABASE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
  
  console.log(`✅ Successfully deleted account from database: ${userEmail} (ID: ${userIdForLog})`);
  console.log(`✅ Verified account no longer exists in database`);

  // Send confirmation email (best-effort) using utils/email if available
  try {
    const { sendDeletionEmail } = await import("../utils/email.js");
    await sendDeletionEmail(userEmail, userName);
    console.log(`📧 Deletion email sent to: ${userEmail}`);
  } catch (err) {
    // If email helper not configured, log and continue
    console.warn("⚠️  Deletion email not sent:", err?.message || err);
  }

  // Return success; frontend should clear client session and redirect
  const { response, statusCode } = successResponse(
    "Your account has been permanently deleted. You have been logged out.",
    { deletedAt: new Date() }
  );

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
    errors.push({ field: 'jobTitle', message: 'Job title is required and cannot be empty', value: jobTitle });
  }
  
  if (!company?.trim()) {
    errors.push({ field: 'company', message: 'Company name is required and cannot be empty', value: company });
  }
  
  if (!startDate) {
    errors.push({ field: 'startDate', message: 'Start date is required', value: startDate });
  } else {
    // Validate start date format - accept both YYYY-MM and MM/YYYY formats
    let startDateObj;
    if (startDate.includes('/')) {
      // MM/YYYY format
      const [month, year] = startDate.split('/');
      startDateObj = new Date(year, month - 1, 1);
    } else {
      // YYYY-MM format (from month input type)
      startDateObj = new Date(startDate);
    }
    
    if (isNaN(startDateObj.getTime())) {
      errors.push({ field: 'startDate', message: 'Invalid start date format. Please use MM/YYYY format (e.g., 10/2023)', value: startDate });
    }
  }

  // Validate end date if provided and not current position
  if (!isCurrentPosition && endDate) {
    let endDateObj;
    if (endDate.includes('/')) {
      // MM/YYYY format
      const [month, year] = endDate.split('/');
      endDateObj = new Date(year, month - 1, 1);
    } else {
      // YYYY-MM format (from month input type)
      endDateObj = new Date(endDate);
    }
    
    if (isNaN(endDateObj.getTime())) {
      errors.push({ field: 'endDate', message: 'Invalid end date format. Please use MM/YYYY format (e.g., 10/2023)', value: endDate });
    } else if (startDate) {
      // Date validation: start date should be before end date
      let startDateObj;
      if (startDate.includes('/')) {
        const [month, year] = startDate.split('/');
        startDateObj = new Date(year, month - 1, 1);
      } else {
        startDateObj = new Date(startDate);
      }
      
      if (!isNaN(startDateObj.getTime()) && startDateObj >= endDateObj) {
        errors.push({ field: 'endDate', message: 'End date must be after the start date', value: endDate });
      }
    }
  }

  // Description character limit
  if (description && description.length > 1000) {
    errors.push({ field: 'description', message: `Description is too long (${description.length} characters). Maximum 1000 characters allowed`, value: description });
  }

  if (errors.length > 0) {
    const { response, statusCode } = validationErrorResponse(
      "Please fix the following errors before submitting",
      errors
    );
    return sendResponse(res, response, statusCode);
  }

  // Create employment entry
  const employmentEntry = {
    jobTitle: jobTitle.trim(),
    company: company.trim(),
    location: location?.trim() || '',
    startDate: (() => {
      if (startDate.includes('/')) {
        const [month, year] = startDate.split('/');
        return new Date(year, month - 1, 1);
      }
      return new Date(startDate);
    })(),
    endDate: isCurrentPosition ? null : (endDate ? (() => {
      if (endDate.includes('/')) {
        const [month, year] = endDate.split('/');
        return new Date(year, month - 1, 1);
      }
      return new Date(endDate);
    })() : null),
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

// PUT /api/users/employment/:employmentId - Update employment entry
export const updateEmployment = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { employmentId } = req.params;
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
    errors.push({ field: 'jobTitle', message: 'Job title is required and cannot be empty', value: jobTitle });
  }
  
  if (!company?.trim()) {
    errors.push({ field: 'company', message: 'Company name is required and cannot be empty', value: company });
  }
  
  if (!startDate) {
    errors.push({ field: 'startDate', message: 'Start date is required', value: startDate });
  } else {
    // Validate start date format - accept both YYYY-MM and MM/YYYY formats
    let startDateObj;
    if (startDate.includes('/')) {
      const [month, year] = startDate.split('/');
      startDateObj = new Date(year, month - 1, 1);
    } else {
      startDateObj = new Date(startDate);
    }
    
    if (isNaN(startDateObj.getTime())) {
      errors.push({ field: 'startDate', message: 'Invalid start date format. Please use MM/YYYY format (e.g., 10/2023)', value: startDate });
    }
  }

  // Validate end date if provided and not current position
  if (!isCurrentPosition && endDate) {
    let endDateObj;
    if (endDate.includes('/')) {
      const [month, year] = endDate.split('/');
      endDateObj = new Date(year, month - 1, 1);
    } else {
      endDateObj = new Date(endDate);
    }
    
    if (isNaN(endDateObj.getTime())) {
      errors.push({ field: 'endDate', message: 'Invalid end date format. Please use MM/YYYY format (e.g., 10/2023)', value: endDate });
    } else if (startDate) {
      let startDateObj;
      if (startDate.includes('/')) {
        const [month, year] = startDate.split('/');
        startDateObj = new Date(year, month - 1, 1);
      } else {
        startDateObj = new Date(startDate);
      }
      
      if (!isNaN(startDateObj.getTime()) && startDateObj >= endDateObj) {
        errors.push({ field: 'endDate', message: 'End date must be after the start date', value: endDate });
      }
    }
  }

  // Description character limit
  if (description && description.length > 1000) {
    errors.push({ field: 'description', message: `Description is too long (${description.length} characters). Maximum 1000 characters allowed`, value: description });
  }

  if (errors.length > 0) {
    const { response, statusCode } = validationErrorResponse(
      "Please fix the following errors before submitting",
      errors
    );
    return sendResponse(res, response, statusCode);
  }

  // Update employment entry
  const updatedEmployment = {
    jobTitle: jobTitle.trim(),
    company: company.trim(),
    location: location?.trim() || '',
    startDate: (() => {
      if (startDate.includes('/')) {
        const [month, year] = startDate.split('/');
        return new Date(year, month - 1, 1);
      }
      return new Date(startDate);
    })(),
    endDate: isCurrentPosition ? null : (endDate ? (() => {
      if (endDate.includes('/')) {
        const [month, year] = endDate.split('/');
        return new Date(year, month - 1, 1);
      }
      return new Date(endDate);
    })() : null),
    isCurrentPosition: Boolean(isCurrentPosition),
    description: description?.trim() || ''
  };

  // Find user and update specific employment entry
  const user = await User.findOneAndUpdate(
    { auth0Id: userId, 'employment._id': employmentId },
    { 
      $set: {
        'employment.$.jobTitle': updatedEmployment.jobTitle,
        'employment.$.company': updatedEmployment.company,
        'employment.$.location': updatedEmployment.location,
        'employment.$.startDate': updatedEmployment.startDate,
        'employment.$.endDate': updatedEmployment.endDate,
        'employment.$.isCurrentPosition': updatedEmployment.isCurrentPosition,
        'employment.$.description': updatedEmployment.description
      }
    },
    { new: true, runValidators: true }
  );

  if (!user) {
    const { response, statusCode } = errorResponse(
      "User or employment entry not found", 
      404, 
      ERROR_CODES.NOT_FOUND
    );
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Employment entry updated successfully", {
    employment: user.employment
  });
  return sendResponse(res, response, statusCode);
});

// DELETE /api/users/employment/:employmentId - Delete an employment entry
export const deleteEmployment = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId || req.auth?.payload?.sub;
  const { employmentId } = req.params;

  if (!userId) {
    const { response, statusCode } = errorResponse(
      "Unauthorized: missing authentication credentials", 
      401, 
      ERROR_CODES.UNAUTHORIZED
    );
    return sendResponse(res, response, statusCode);
  }

  if (!employmentId) {
    const { response, statusCode } = errorResponse(
      "Employment ID is required", 
      400, 
      ERROR_CODES.VALIDATION_ERROR
    );
    return sendResponse(res, response, statusCode);
  }

  // Find user and remove the employment entry
  const user = await User.findOneAndUpdate(
    { auth0Id: userId },
    { 
      $pull: { employment: { _id: employmentId } }
    },
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

  const { response, statusCode } = successResponse("Employment entry deleted successfully", {
    employment: user.employment
  });
  return sendResponse(res, response, statusCode);
});


