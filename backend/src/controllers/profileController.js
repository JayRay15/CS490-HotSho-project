import { User } from "../models/User.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES, validationErrorResponse } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// Employment endpoints
export const addEmployment = asyncHandler(async (req, res) => {
  const { sub } = req.auth.payload;
  const employmentData = req.body;

  // Validate required fields
  const requiredFields = ['company', 'position', 'startDate'];
  const missingFields = requiredFields.filter(field => !employmentData[field]);
  
  if (missingFields.length > 0) {
    const errors = missingFields.map(field => ({
      field,
      message: `${field} is required`,
      value: null
    }));
    const { response, statusCode } = validationErrorResponse("Missing required fields", errors);
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOneAndUpdate(
    { auth0Id: sub },
    { $push: { employment: employmentData } },
    { new: true, runValidators: true }
  );

  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Employment added successfully", user.employment);
  return sendResponse(res, response, statusCode);
});

export const updateEmployment = asyncHandler(async (req, res) => {
  const { sub } = req.auth.payload;
  const { employmentId } = req.params;
  const updateData = req.body;

  const user = await User.findOne({ auth0Id: sub });
  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const employment = user.employment.id(employmentId);
  if (!employment) {
    const { response, statusCode } = errorResponse("Employment record not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  Object.assign(employment, updateData);
  await user.save();

  const { response, statusCode } = successResponse("Employment updated successfully", employment);
  return sendResponse(res, response, statusCode);
});

export const deleteEmployment = asyncHandler(async (req, res) => {
  const { sub } = req.auth.payload;
  const { employmentId } = req.params;

  const user = await User.findOneAndUpdate(
    { auth0Id: sub },
    { $pull: { employment: { _id: employmentId } } },
    { new: true }
  );

  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Employment deleted successfully");
  return sendResponse(res, response, statusCode);
});

// Skills endpoints
export const addSkill = asyncHandler(async (req, res) => {
  const { sub } = req.auth.payload;
  const skillData = req.body;

  // Validate required fields
  const requiredFields = ['name', 'level', 'category'];
  const missingFields = requiredFields.filter(field => !skillData[field]);
  
  if (missingFields.length > 0) {
    const errors = missingFields.map(field => ({
      field,
      message: `${field} is required`,
      value: null
    }));
    const { response, statusCode } = validationErrorResponse("Missing required fields", errors);
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOneAndUpdate(
    { auth0Id: sub },
    { $push: { skills: skillData } },
    { new: true, runValidators: true }
  );

  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Skill added successfully", user.skills);
  return sendResponse(res, response, statusCode);
});

export const updateSkill = asyncHandler(async (req, res) => {
  const { sub } = req.auth.payload;
  const { skillId } = req.params;
  const updateData = req.body;

  const user = await User.findOne({ auth0Id: sub });
  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const skill = user.skills.id(skillId);
  if (!skill) {
    const { response, statusCode } = errorResponse("Skill not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  Object.assign(skill, updateData);
  await user.save();

  const { response, statusCode } = successResponse("Skill updated successfully", skill);
  return sendResponse(res, response, statusCode);
});

export const deleteSkill = asyncHandler(async (req, res) => {
  const { sub } = req.auth.payload;
  const { skillId } = req.params;

  const user = await User.findOneAndUpdate(
    { auth0Id: sub },
    { $pull: { skills: { _id: skillId } } },
    { new: true }
  );

  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Skill deleted successfully");
  return sendResponse(res, response, statusCode);
});

// Education endpoints
export const addEducation = asyncHandler(async (req, res) => {
  const { sub } = req.auth.payload;
  const educationData = req.body;

  // Validate required fields
  const requiredFields = ['institution', 'degree', 'fieldOfStudy', 'startDate'];
  const missingFields = requiredFields.filter(field => !educationData[field]);
  
  if (missingFields.length > 0) {
    const errors = missingFields.map(field => ({
      field,
      message: `${field} is required`,
      value: null
    }));
    const { response, statusCode } = validationErrorResponse("Missing required fields", errors);
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOneAndUpdate(
    { auth0Id: sub },
    { $push: { education: educationData } },
    { new: true, runValidators: true }
  );

  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Education added successfully", user.education);
  return sendResponse(res, response, statusCode);
});

export const updateEducation = asyncHandler(async (req, res) => {
  const { sub } = req.auth.payload;
  const { educationId } = req.params;
  const updateData = req.body;

  const user = await User.findOne({ auth0Id: sub });
  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const education = user.education.id(educationId);
  if (!education) {
    const { response, statusCode } = errorResponse("Education record not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  Object.assign(education, updateData);
  await user.save();

  const { response, statusCode } = successResponse("Education updated successfully", education);
  return sendResponse(res, response, statusCode);
});

export const deleteEducation = asyncHandler(async (req, res) => {
  const { sub } = req.auth.payload;
  const { educationId } = req.params;

  const user = await User.findOneAndUpdate(
    { auth0Id: sub },
    { $pull: { education: { _id: educationId } } },
    { new: true }
  );

  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Education deleted successfully");
  return sendResponse(res, response, statusCode);
});

// Projects endpoints
export const addProject = asyncHandler(async (req, res) => {
  const { sub } = req.auth.payload;
  const projectData = req.body;

  // Validate required fields
  const requiredFields = ['name', 'description', 'startDate'];
  const missingFields = requiredFields.filter(field => !projectData[field]);
  
  if (missingFields.length > 0) {
    const errors = missingFields.map(field => ({
      field,
      message: `${field} is required`,
      value: null
    }));
    const { response, statusCode } = validationErrorResponse("Missing required fields", errors);
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOneAndUpdate(
    { auth0Id: sub },
    { $push: { projects: projectData } },
    { new: true, runValidators: true }
  );

  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Project added successfully", user.projects);
  return sendResponse(res, response, statusCode);
});

export const updateProject = asyncHandler(async (req, res) => {
  const { sub } = req.auth.payload;
  const { projectId } = req.params;
  const updateData = req.body;

  const user = await User.findOne({ auth0Id: sub });
  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const project = user.projects.id(projectId);
  if (!project) {
    const { response, statusCode } = errorResponse("Project not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  Object.assign(project, updateData);
  await user.save();

  const { response, statusCode } = successResponse("Project updated successfully", project);
  return sendResponse(res, response, statusCode);
});

export const deleteProject = asyncHandler(async (req, res) => {
  const { sub } = req.auth.payload;
  const { projectId } = req.params;

  const user = await User.findOneAndUpdate(
    { auth0Id: sub },
    { $pull: { projects: { _id: projectId } } },
    { new: true }
  );

  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse("Project deleted successfully");
  return sendResponse(res, response, statusCode);
});
