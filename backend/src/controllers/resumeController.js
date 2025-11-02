import { ResumeTemplate } from "../models/ResumeTemplate.js";
import { Resume } from "../models/Resume.js";
import { errorResponse, sendResponse, successResponse, ERROR_CODES } from "../utils/responseFormat.js";

const getUserId = (req) => req.auth?.userId || req.auth?.payload?.sub;

// Helper to seed default templates for a new user
const defaultTemplates = [
  { name: "Chronological", type: "chronological" },
  { name: "Functional", type: "functional" },
  { name: "Hybrid", type: "hybrid" },
];

export const listTemplates = async (req, res) => {
  try {
    const userId = getUserId(req);
    // Own templates or shared (global shared)
    let templates = await ResumeTemplate.find({ $or: [{ userId }, { isShared: true }] })
      .sort({ isDefault: -1, updatedAt: -1 })
      .lean();

    // Seed defaults if none exist for this user
    const hasOwn = templates.some((t) => t.userId === userId);
    if (!hasOwn) {
      const seeded = await ResumeTemplate.insertMany(
        defaultTemplates.map((t, idx) => ({
          userId,
          name: t.name,
          type: t.type,
          isDefault: idx === 0,
        }))
      );
      templates = [...seeded.map((d) => d.toObject())];
    }

    const { response, statusCode } = successResponse("Templates fetched", { templates });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse("Failed to fetch templates", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

export const createTemplate = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { name, type, layout, theme, isDefault } = req.body;

    if (!name || !type) {
      const { response, statusCode } = errorResponse("Name and type are required", 400, ERROR_CODES.MISSING_REQUIRED_FIELD);
      return sendResponse(res, response, statusCode);
    }

    if (isDefault) {
      await ResumeTemplate.updateMany({ userId }, { $set: { isDefault: false } });
    }

    const tpl = await ResumeTemplate.create({ userId, name, type, layout, theme, isDefault: !!isDefault });
    const { response, statusCode } = successResponse("Template created", { template: tpl }, 201);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse("Failed to create template", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const updates = req.body || {};

    const tpl = await ResumeTemplate.findOne({ _id: id, userId });
    if (!tpl) {
      const { response, statusCode } = errorResponse("Template not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Ensure only one default per user
    if (updates.isDefault === true) {
      await ResumeTemplate.updateMany({ userId }, { $set: { isDefault: false } });
    }

    Object.assign(tpl, updates);
    await tpl.save();

    const { response, statusCode } = successResponse("Template updated", { template: tpl });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse("Failed to update template", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const result = await ResumeTemplate.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      const { response, statusCode } = errorResponse("Template not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    const { response, statusCode } = successResponse("Template deleted");
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse("Failed to delete template", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

export const importTemplate = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { name, type, layout, theme } = req.body || {};
    if (!name || !type) {
      const { response, statusCode } = errorResponse("Name and type are required", 400, ERROR_CODES.MISSING_REQUIRED_FIELD);
      return sendResponse(res, response, statusCode);
    }
    const tpl = await ResumeTemplate.create({ userId, name, type, layout, theme, isDefault: false });
    const { response, statusCode } = successResponse("Template imported", { template: tpl }, 201);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse("Failed to import template", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

export const listResumes = async (req, res) => {
  try {
    const userId = getUserId(req);
    const resumes = await Resume.find({ userId }).sort({ updatedAt: -1 }).lean();
    const { response, statusCode } = successResponse("Resumes fetched", { resumes });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse("Failed to fetch resumes", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

export const createResumeFromTemplate = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { templateId, name, sections } = req.body || {};
    if (!templateId || !name) {
      const { response, statusCode } = errorResponse("templateId and name are required", 400, ERROR_CODES.MISSING_REQUIRED_FIELD);
      return sendResponse(res, response, statusCode);
    }
    const tpl = await ResumeTemplate.findOne({ _id: templateId, $or: [{ userId }, { isShared: true }] });
    if (!tpl) {
      const { response, statusCode } = errorResponse("Template not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    const defaultSections = {
      summary: "",
      experience: [],
      skills: [],
      education: [],
      projects: [],
    };
    const resume = await Resume.create({ userId, templateId, name, sections: sections || defaultSections });
    const { response, statusCode } = successResponse("Resume created", { resume }, 201);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse("Failed to create resume", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

export const updateResume = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const updates = req.body || {};
    const resume = await Resume.findOne({ _id: id, userId });
    if (!resume) {
      const { response, statusCode } = errorResponse("Resume not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    Object.assign(resume, updates);
    await resume.save();
    const { response, statusCode } = successResponse("Resume updated", { resume });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse("Failed to update resume", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

export const deleteResume = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const result = await Resume.deleteOne({ _id: id, userId });
    if (result.deletedCount === 0) {
      const { response, statusCode } = errorResponse("Resume not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    const { response, statusCode } = successResponse("Resume deleted");
    return sendResponse(res, response, statusCode);
  } catch (err) {
    const { response, statusCode } = errorResponse("Failed to delete resume", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};
