import { User } from "../models/User.js";
import { successResponse, errorResponse, sendResponse, ERROR_CODES, validationErrorResponse } from "../utils/responseFormat.js";
import { asyncHandler } from "../middleware/errorHandler.js";

// Employment endpoints
export const addEmployment = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const employmentData = req.body;

  // Validate required fields
  const requiredFields = ['company', 'jobTitle', 'startDate'];
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
  const sub = req.auth?.payload?.sub || req.auth?.userId;
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

  const { response, statusCode } = successResponse("Employment updated successfully", user.employment);
  return sendResponse(res, response, statusCode);
});

export const deleteEmployment = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
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
  const sub = req.auth?.payload?.sub || req.auth?.userId;
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
  const sub = req.auth?.payload?.sub || req.auth?.userId;
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

  const { response, statusCode } = successResponse("Skill updated successfully", user.skills);
  return sendResponse(res, response, statusCode);
});

export const deleteSkill = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
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

export const reorderSkills = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const { skills } = req.body; // Array of skill IDs in new order

  if (!Array.isArray(skills)) {
    const { response, statusCode } = errorResponse("Skills must be an array", 400, ERROR_CODES.VALIDATION_ERROR);
    return sendResponse(res, response, statusCode);
  }

  const user = await User.findOne({ auth0Id: sub });
  if (!user) {
    const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // Reorder skills array based on provided IDs
  const reorderedSkills = [];
  skills.forEach(skillId => {
    const skill = user.skills.id(skillId);
    if (skill) {
      reorderedSkills.push(skill);
    }
  });

  // Add any skills that weren't in the reorder list (shouldn't happen, but safe fallback)
  user.skills.forEach(skill => {
    if (!skills.includes(skill._id.toString())) {
      reorderedSkills.push(skill);
    }
  });

  user.skills = reorderedSkills;
  await user.save();

  const { response, statusCode } = successResponse("Skills reordered successfully", user.skills);
  return sendResponse(res, response, statusCode);
});

// Education endpoints
export const addEducation = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const educationData = req.body;

  // Debug logging to diagnose 500s in production-like dev
  try {
    console.log('🎓 addEducation invoked');
    console.log('🔑 auth user id (sub):', sub);
    console.log('📦 payload:', JSON.stringify(educationData));
  } catch {}

  // Validate required fields
  const requiredFields = ['institution', 'degree', 'fieldOfStudy', 'startDate'];
  const missingFields = requiredFields.filter(field => !educationData[field]);

  if (missingFields.length > 0) {
    try { console.warn('❌ Missing fields:', missingFields); } catch {}
    const errors = missingFields.map(field => ({
      field,
      message: `${field} is required`,
      value: null
    }));
    const { response, statusCode } = validationErrorResponse("Missing required fields", errors);
    return sendResponse(res, response, statusCode);
  }

  // Defensive: coerce date strings to Date instances when possible
  try {
    if (typeof educationData.startDate === 'string') educationData.startDate = new Date(educationData.startDate);
    if (educationData.endDate && typeof educationData.endDate === 'string') educationData.endDate = new Date(educationData.endDate);
  } catch {}

  try {
    console.log('🔍 Pushing education for auth0Id:', sub);
    const user = await User.findOneAndUpdate(
      { auth0Id: sub },
      { $push: { education: educationData } },
      { new: true, runValidators: true }
    );

    if (!user) {
      console.warn('❌ No user found for auth0Id:', sub);
      const { response, statusCode } = errorResponse("User not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    try { console.log('✅ Education added. Count:', user.education?.length); } catch {}
    const { response, statusCode } = successResponse("Education added successfully", user.education);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error('❌ Error in addEducation');
    console.error('   name:', err?.name);
    console.error('   message:', err?.message);
    if (err?.errors) {
      try { console.error('   validation:', JSON.stringify(err.errors, null, 2)); } catch {}
    }
    const message = err?.name === 'ValidationError' ? 'Invalid education data provided' : 'Error adding education entry';
    const { response, statusCode } = errorResponse(message, 500, ERROR_CODES.INTERNAL_ERROR);
    return sendResponse(res, response, statusCode);
  }
});


export const updateEducation = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
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

  const { response, statusCode } = successResponse("Education updated successfully", user.education);
  return sendResponse(res, response, statusCode);
});

export const deleteEducation = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
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
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const projectData = { ...req.body };

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

  // Normalize types/fields
  try {
    if (typeof projectData.startDate === 'string') projectData.startDate = new Date(projectData.startDate);
    if (projectData.endDate && typeof projectData.endDate === 'string') projectData.endDate = new Date(projectData.endDate);
    if (typeof projectData.technologies === 'string') {
      projectData.technologies = projectData.technologies
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }
    // Accept projectUrl into url field if url not provided
    if (!projectData.url && projectData.projectUrl) {
      projectData.url = projectData.projectUrl;
    }
  } catch {}

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
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const { projectId } = req.params;
  const updateData = { ...req.body };

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

  // Normalize before updating
  try {
    if (typeof updateData.startDate === 'string') updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate && typeof updateData.endDate === 'string') updateData.endDate = new Date(updateData.endDate);
    if (typeof updateData.technologies === 'string') {
      updateData.technologies = updateData.technologies
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }
    if (!updateData.url && updateData.projectUrl) {
      updateData.url = updateData.projectUrl;
    }
  } catch {}

  Object.assign(project, updateData);
  await user.save();

  const { response, statusCode } = successResponse("Project updated successfully", user.projects);
  return sendResponse(res, response, statusCode);
});

export const deleteProject = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
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

// Public: Get a single project by id (search across users)
export const getPublicProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Find a user document that contains a project with the given id
  // Return only the matching project element to minimize payload
  const user = await User.findOne(
    { 'projects._id': projectId, isDeleted: { $ne: true } },
    { 'projects.$': 1, name: 1, picture: 1 }
  );

  if (!user || !Array.isArray(user.projects) || user.projects.length === 0) {
    const { response, statusCode } = errorResponse('Project not found', 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  // projects.$ returns the matched project as the first element
  const project = user.projects[0];

  const payload = {
    project,
    owner: {
      name: user.name,
      picture: user.picture
    }
  };

  const { response, statusCode } = successResponse('Project retrieved', payload);
  return sendResponse(res, response, statusCode);
});

// Certifications endpoints
export const addCertification = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const certData = req.body;

  // Required fields
  const required = ['name', 'organization', 'dateEarned'];
  const missing = required.filter(f => !certData[f]);
  if (missing.length) {
    const errors = missing.map(field => ({ field, message: `${field} is required`, value: null }));
    const { response, statusCode } = validationErrorResponse('Missing required fields', errors);
    return sendResponse(res, response, statusCode);
  }

  // Normalize dates
  try {
    if (typeof certData.dateEarned === 'string') certData.dateEarned = new Date(certData.dateEarned);
    if (certData.expirationDate && typeof certData.expirationDate === 'string') certData.expirationDate = new Date(certData.expirationDate);
  } catch {}

  const user = await User.findOneAndUpdate(
    { auth0Id: sub },
    { $push: { certifications: certData } },
    { new: true, runValidators: true }
  );

  if (!user) {
    const { response, statusCode } = errorResponse('User not found', 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse('Certification added successfully', user.certifications);
  return sendResponse(res, response, statusCode);
});

export const updateCertification = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const { certificationId } = req.params;
  const updateData = req.body;

  const user = await User.findOne({ auth0Id: sub });
  if (!user) {
    const { response, statusCode } = errorResponse('User not found', 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const cert = user.certifications.id(certificationId);
  if (!cert) {
    const { response, statusCode } = errorResponse('Certification not found', 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  Object.assign(cert, updateData);
  await user.save();

  const { response, statusCode } = successResponse('Certification updated successfully', user.certifications);
  return sendResponse(res, response, statusCode);
});

export const deleteCertification = asyncHandler(async (req, res) => {
  const sub = req.auth?.payload?.sub || req.auth?.userId;
  const { certificationId } = req.params;

  const user = await User.findOneAndUpdate(
    { auth0Id: sub },
    { $pull: { certifications: { _id: certificationId } } },
    { new: true }
  );

  if (!user) {
    const { response, statusCode } = errorResponse('User not found', 404, ERROR_CODES.NOT_FOUND);
    return sendResponse(res, response, statusCode);
  }

  const { response, statusCode } = successResponse('Certification deleted successfully', user.certifications);
  return sendResponse(res, response, statusCode);
});
