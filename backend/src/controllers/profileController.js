import { User } from "../models/User.js";
import { successResponse, errorResponse, sendResponse } from "../utils/responseFormat.js";

// Employment endpoints
export const addEmployment = async (req, res) => {
  try {
    const { sub } = req.auth.payload;
    const employmentData = req.body;

    const user = await User.findOneAndUpdate(
      { auth0Id: sub },
      { $push: { employment: employmentData } },
      { new: true, runValidators: true }
    );

    if (!user) {
      const { response, statusCode } = errorResponse("User not found", 404);
      return sendResponse(res, response, statusCode);
    }

    const { response, statusCode } = successResponse("Employment added successfully", user.employment);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Add employment error:", err);
    const { response, statusCode } = errorResponse("Internal server error", 500);
    return sendResponse(res, response, statusCode);
  }
};

export const updateEmployment = async (req, res) => {
  try {
    const { sub } = req.auth.payload;
    const { employmentId } = req.params;
    const updateData = req.body;

    const user = await User.findOne({ auth0Id: sub });
    if (!user) {
      const { response, statusCode } = errorResponse("User not found", 404);
      return sendResponse(res, response, statusCode);
    }

    const employment = user.employment.id(employmentId);
    if (!employment) {
      const { response, statusCode } = errorResponse("Employment not found", 404);
      return sendResponse(res, response, statusCode);
    }

    Object.assign(employment, updateData);
    await user.save();

    const { response, statusCode } = successResponse("Employment updated successfully", employment);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Update employment error:", err);
    const { response, statusCode } = errorResponse("Internal server error", 500);
    return sendResponse(res, response, statusCode);
  }
};

export const deleteEmployment = async (req, res) => {
  try {
    const { sub } = req.auth.payload;
    const { employmentId } = req.params;

    const user = await User.findOneAndUpdate(
      { auth0Id: sub },
      { $pull: { employment: { _id: employmentId } } },
      { new: true }
    );

    if (!user) {
      const { response, statusCode } = errorResponse("User not found", 404);
      return sendResponse(res, response, statusCode);
    }

    const { response, statusCode } = successResponse("Employment deleted successfully");
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Delete employment error:", err);
    const { response, statusCode } = errorResponse("Internal server error", 500);
    return sendResponse(res, response, statusCode);
  }
};

// Skills endpoints
export const addSkill = async (req, res) => {
  try {
    const { sub } = req.auth.payload;
    const skillData = req.body;

    const user = await User.findOneAndUpdate(
      { auth0Id: sub },
      { $push: { skills: skillData } },
      { new: true, runValidators: true }
    );

    if (!user) {
      const { response, statusCode } = errorResponse("User not found", 404);
      return sendResponse(res, response, statusCode);
    }

    const { response, statusCode } = successResponse("Skill added successfully", user.skills);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Add skill error:", err);
    const { response, statusCode } = errorResponse("Internal server error", 500);
    return sendResponse(res, response, statusCode);
  }
};

export const updateSkill = async (req, res) => {
  try {
    const { sub } = req.auth.payload;
    const { skillId } = req.params;
    const updateData = req.body;

    const user = await User.findOne({ auth0Id: sub });
    if (!user) {
      const { response, statusCode } = errorResponse("User not found", 404);
      return sendResponse(res, response, statusCode);
    }

    const skill = user.skills.id(skillId);
    if (!skill) {
      const { response, statusCode } = errorResponse("Skill not found", 404);
      return sendResponse(res, response, statusCode);
    }

    Object.assign(skill, updateData);
    await user.save();

    const { response, statusCode } = successResponse("Skill updated successfully", skill);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Update skill error:", err);
    const { response, statusCode } = errorResponse("Internal server error", 500);
    return sendResponse(res, response, statusCode);
  }
};

export const deleteSkill = async (req, res) => {
  try {
    const { sub } = req.auth.payload;
    const { skillId } = req.params;

    const user = await User.findOneAndUpdate(
      { auth0Id: sub },
      { $pull: { skills: { _id: skillId } } },
      { new: true }
    );

    if (!user) {
      const { response, statusCode } = errorResponse("User not found", 404);
      return sendResponse(res, response, statusCode);
    }

    const { response, statusCode } = successResponse("Skill deleted successfully");
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Delete skill error:", err);
    const { response, statusCode } = errorResponse("Internal server error", 500);
    return sendResponse(res, response, statusCode);
  }
};

// Education endpoints
export const addEducation = async (req, res) => {
  try {
    const { sub } = req.auth.payload;
    const educationData = req.body;

    const user = await User.findOneAndUpdate(
      { auth0Id: sub },
      { $push: { education: educationData } },
      { new: true, runValidators: true }
    );

    if (!user) {
      const { response, statusCode } = errorResponse("User not found", 404);
      return sendResponse(res, response, statusCode);
    }

    const { response, statusCode } = successResponse("Education added successfully", user.education);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Add education error:", err);
    const { response, statusCode } = errorResponse("Internal server error", 500);
    return sendResponse(res, response, statusCode);
  }
};

export const updateEducation = async (req, res) => {
  try {
    const { sub } = req.auth.payload;
    const { educationId } = req.params;
    const updateData = req.body;

    const user = await User.findOne({ auth0Id: sub });
    if (!user) {
      const { response, statusCode } = errorResponse("User not found", 404);
      return sendResponse(res, response, statusCode);
    }

    const education = user.education.id(educationId);
    if (!education) {
      const { response, statusCode } = errorResponse("Education not found", 404);
      return sendResponse(res, response, statusCode);
    }

    Object.assign(education, updateData);
    await user.save();

    const { response, statusCode } = successResponse("Education updated successfully", education);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Update education error:", err);
    const { response, statusCode } = errorResponse("Internal server error", 500);
    return sendResponse(res, response, statusCode);
  }
};

export const deleteEducation = async (req, res) => {
  try {
    const { sub } = req.auth.payload;
    const { educationId } = req.params;

    const user = await User.findOneAndUpdate(
      { auth0Id: sub },
      { $pull: { education: { _id: educationId } } },
      { new: true }
    );

    if (!user) {
      const { response, statusCode } = errorResponse("User not found", 404);
      return sendResponse(res, response, statusCode);
    }

    const { response, statusCode } = successResponse("Education deleted successfully");
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Delete education error:", err);
    const { response, statusCode } = errorResponse("Internal server error", 500);
    return sendResponse(res, response, statusCode);
  }
};

// Projects endpoints
export const addProject = async (req, res) => {
  try {
    const { sub } = req.auth.payload;
    const projectData = req.body;

    const user = await User.findOneAndUpdate(
      { auth0Id: sub },
      { $push: { projects: projectData } },
      { new: true, runValidators: true }
    );

    if (!user) {
      const { response, statusCode } = errorResponse("User not found", 404);
      return sendResponse(res, response, statusCode);
    }

    const { response, statusCode } = successResponse("Project added successfully", user.projects);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Add project error:", err);
    const { response, statusCode } = errorResponse("Internal server error", 500);
    return sendResponse(res, response, statusCode);
  }
};

export const updateProject = async (req, res) => {
  try {
    const { sub } = req.auth.payload;
    const { projectId } = req.params;
    const updateData = req.body;

    const user = await User.findOne({ auth0Id: sub });
    if (!user) {
      const { response, statusCode } = errorResponse("User not found", 404);
      return sendResponse(res, response, statusCode);
    }

    const project = user.projects.id(projectId);
    if (!project) {
      const { response, statusCode } = errorResponse("Project not found", 404);
      return sendResponse(res, response, statusCode);
    }

    Object.assign(project, updateData);
    await user.save();

    const { response, statusCode } = successResponse("Project updated successfully", project);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Update project error:", err);
    const { response, statusCode } = errorResponse("Internal server error", 500);
    return sendResponse(res, response, statusCode);
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { sub } = req.auth.payload;
    const { projectId } = req.params;

    const user = await User.findOneAndUpdate(
      { auth0Id: sub },
      { $pull: { projects: { _id: projectId } } },
      { new: true }
    );

    if (!user) {
      const { response, statusCode } = errorResponse("User not found", 404);
      return sendResponse(res, response, statusCode);
    }

    const { response, statusCode } = successResponse("Project deleted successfully");
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Delete project error:", err);
    const { response, statusCode } = errorResponse("Internal server error", 500);
    return sendResponse(res, response, statusCode);
  }
};
