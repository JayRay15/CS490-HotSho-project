import { ResumeTemplate } from "../models/ResumeTemplate.js";
import { Resume } from "../models/Resume.js";
import { errorResponse, sendResponse, successResponse, ERROR_CODES } from "../utils/responseFormat.js";
import { generateResumeContent, regenerateSection, analyzeATSCompatibility } from "../utils/geminiService.js";
import { User } from "../models/User.js";
import { Job } from "../models/Job.js";

const getUserId = (req) => {
  const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
  return auth?.userId || auth?.payload?.sub;
};

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

    // Set default layout sections order based on template type if not provided
    let finalLayout = layout;
    if (!finalLayout || !finalLayout.sectionsOrder) {
      let sectionsOrder;
      switch (type) {
        case 'functional':
          // Functional: Skills come before experience to highlight capabilities first
          sectionsOrder = ["summary", "skills", "experience", "education", "projects"];
          break;
        case 'hybrid':
          // Hybrid: Skills and experience can be close together, often skills first
          sectionsOrder = ["summary", "skills", "experience", "education", "projects"];
          break;
        case 'chronological':
        default:
          // Chronological: Experience comes before skills (traditional format)
          sectionsOrder = ["summary", "experience", "skills", "education", "projects"];
          break;
      }
      finalLayout = {
        sectionsOrder: sectionsOrder,
        sectionStyles: layout?.sectionStyles || {}
      };
    }

    const tpl = await ResumeTemplate.create({ userId, name, type, layout: finalLayout, theme, isDefault: !!isDefault });
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

// AI-powered resume generation
export const generateAIResume = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { jobId, templateId, name } = req.body;

    if (!jobId || !templateId || !name) {
      const { response, statusCode } = errorResponse(
        "jobId, templateId, and name are required",
        400,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
      return sendResponse(res, response, statusCode);
    }

    // Fetch job posting
    const job = await Job.findOne({ _id: jobId, userId }).lean();
    if (!job) {
      const { response, statusCode } = errorResponse("Job not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Fetch user profile (Clerk user ID is stored in auth0Id field)
    const user = await User.findOne({ auth0Id: userId }).lean();
    if (!user) {
      const { response, statusCode } = errorResponse("User profile not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Verify template exists
    const template = await ResumeTemplate.findOne({
      _id: templateId,
      $or: [{ userId }, { isShared: true }],
    }).lean();
    if (!template) {
      const { response, statusCode } = errorResponse("Template not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Prepare user profile data
    const userProfile = {
      employment: user.employment || [],
      skills: user.skills || [],
      education: user.education || [],
      projects: user.projects || [],
      certifications: user.certifications || [],
    };

    // Prepare job posting data
    const jobPosting = {
      title: job.title,
      company: job.company,
      description: job.description,
      requirements: job.requirements || job.description,
    };

    // Generate content with AI
    const aiContent = await generateResumeContent(jobPosting, userProfile, template);

    // Map experience bullets to actual employment records
    const experienceSection = user.employment?.map((job, index) => {
      const jobKey = `job${index}`;
      const bullets = aiContent.experienceBullets?.[jobKey] || 
                     aiContent.experienceBullets?.[job._id?.toString()] ||
                     [];
      
      return {
        jobTitle: job.jobTitle,
        company: job.company,
        location: job.location,
        startDate: job.startDate,
        endDate: job.endDate,
        isCurrentPosition: job.isCurrentPosition,
        bullets: bullets.length > 0 ? bullets : [job.description || ""],
      };
    }) || [];

    // Create resume with AI-generated content
    const sections = {
      summary: aiContent.summary || "",
      experience: experienceSection,
      skills: aiContent.relevantSkills || [],
      education: user.education || [],
      projects: user.projects || [],
      // Add contact information
      contactInfo: {
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        location: user.location || "",
        linkedin: user.linkedin || "",
        github: user.github || "",
        website: user.website || "",
      },
    };

    const resume = await Resume.create({
      userId,
      templateId,
      name,
      sections,
      metadata: {
        tailoredForJob: `${job.title} at ${job.company}`,
        atsKeywords: aiContent.atsKeywords || [],
        tailoringNotes: aiContent.tailoringNotes || "",
        generatedAt: new Date(),
      },
    });

    const { response, statusCode } = successResponse(
      "Resume generated with AI",
      {
        resume,
        aiInsights: {
          atsKeywords: aiContent.atsKeywords,
          tailoringNotes: aiContent.tailoringNotes,
        },
      },
      201
    );
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("AI resume generation error:", err);
    const { response, statusCode } = errorResponse(
      `Failed to generate AI resume: ${err.message}`,
      500,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

// Regenerate a specific section of a resume
export const regenerateResumeSection = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { section } = req.body;

    if (!section || !["summary", "experience", "skills"].includes(section)) {
      const { response, statusCode } = errorResponse(
        "Valid section (summary, experience, skills) is required",
        400,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
      return sendResponse(res, response, statusCode);
    }

    const resume = await Resume.findOne({ _id: id, userId });
    if (!resume) {
      const { response, statusCode } = errorResponse("Resume not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Get job and user profile
    const jobId = resume.metadata?.tailoredForJob;
    if (!jobId) {
      const { response, statusCode } = errorResponse(
        "Resume was not generated with AI",
        400,
        ERROR_CODES.INVALID_INPUT
      );
      return sendResponse(res, response, statusCode);
    }

    const job = await Job.findOne({ _id: jobId, userId }).lean();
    if (!job) {
      const { response, statusCode } = errorResponse("Original job not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    const user = await User.findOne({ auth0Id: userId }).lean();
    if (!user) {
      const { response, statusCode } = errorResponse("User profile not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    const userProfile = {
      employment: user.employment || [],
      skills: user.skills || [],
      education: user.education || [],
      projects: user.projects || [],
    };

    const jobPosting = {
      title: job.title,
      company: job.company,
      description: job.description,
      requirements: job.requirements || job.description,
    };

    // Regenerate the section
    const regenerated = await regenerateSection(section, jobPosting, userProfile, resume.sections);

    // Update resume with new content
    if (section === "summary") {
      resume.sections.summary = regenerated.summary;
    } else if (section === "experience") {
      // Map regenerated bullets to experience
      resume.sections.experience = user.employment?.map((job, index) => {
        const existingExp = resume.sections.experience[index] || {};
        const jobKey = `job${index}`;
        const bullets = regenerated[jobKey] || regenerated[job._id?.toString()] || existingExp.bullets || [];
        
        return {
          ...existingExp,
          jobTitle: job.jobTitle,
          company: job.company,
          location: job.location,
          startDate: job.startDate,
          endDate: job.endDate,
          isCurrentPosition: job.isCurrentPosition,
          bullets,
        };
      });
    } else if (section === "skills") {
      resume.sections.skills = regenerated;
    }

    await resume.save();

    const { response, statusCode } = successResponse("Section regenerated", { resume });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Section regeneration error:", err);
    const { response, statusCode } = errorResponse(
      `Failed to regenerate section: ${err.message}`,
      500,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

// Analyze ATS compatibility
export const analyzeATS = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const resume = await Resume.findOne({ _id: id, userId }).lean();
    if (!resume) {
      const { response, statusCode } = errorResponse("Resume not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    const jobId = resume.metadata?.tailoredForJob;
    if (!jobId) {
      const { response, statusCode } = errorResponse(
        "Resume was not tailored for a job",
        400,
        ERROR_CODES.INVALID_INPUT
      );
      return sendResponse(res, response, statusCode);
    }

    const job = await Job.findOne({ _id: jobId, userId }).lean();
    if (!job) {
      const { response, statusCode } = errorResponse("Original job not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    const jobPosting = {
      title: job.title,
      company: job.company,
      description: job.description,
      requirements: job.requirements || job.description,
    };

    const analysis = await analyzeATSCompatibility(resume.sections, jobPosting);

    const { response, statusCode } = successResponse("ATS analysis complete", { analysis });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("ATS analysis error:", err);
    const { response, statusCode } = errorResponse(
      `Failed to analyze ATS compatibility: ${err.message}`,
      500,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};
