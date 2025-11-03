import { ResumeTemplate } from "../models/ResumeTemplate.js";
import { Resume } from "../models/Resume.js";
import { generateResumeContent, generateResumeContentVariations, regenerateSection, analyzeATSCompatibility } from "../utils/geminiService.js";
import { generatePdfFromTemplate } from "../utils/pdfGenerator.js";
import { errorResponse, sendResponse, successResponse, ERROR_CODES } from "../utils/responseFormat.js";
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
    const { name, type, layout, theme, isDefault, pdfBuffer, pdfLayout, sectionMapping } = req.body;

    if (!name || !type) {
      const { response, statusCode } = errorResponse("Name and type are required", 400, ERROR_CODES.MISSING_REQUIRED_FIELD);
      return sendResponse(res, response, statusCode);
    }

    if (isDefault) {
      await ResumeTemplate.updateMany({ userId }, { $set: { isDefault: false } });
    }

    // Set default layout sections order based on template type if not provided
    // IMPORTANT: Preserve all layout properties (projectFormat, experienceFormat, educationFormat, etc.)
    let finalLayout = layout || {};
    if (!finalLayout.sectionsOrder) {
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
        ...finalLayout, // Preserve all existing layout properties
        sectionsOrder: sectionsOrder,
        sectionStyles: finalLayout.sectionStyles || {}
      };
    }
    
    // Log layout to ensure formats are preserved
    console.log('Creating template with layout:', {
      sectionsOrder: finalLayout.sectionsOrder,
      projectFormat: finalLayout.projectFormat,
      experienceFormat: finalLayout.experienceFormat,
      educationFormat: finalLayout.educationFormat
    });

    // Convert base64 PDF buffer back to Buffer if provided
    // Limit PDF buffer size to prevent database issues (16MB MongoDB document limit)
    let originalPdfBuffer = null;
    if (pdfBuffer && typeof pdfBuffer === 'string') {
      try {
        originalPdfBuffer = Buffer.from(pdfBuffer, 'base64');
        // Check size - MongoDB has 16MB document limit
        const sizeMB = originalPdfBuffer.length / 1024 / 1024;
        if (originalPdfBuffer.length > 15 * 1024 * 1024) {
          console.warn(`PDF buffer is large (${Math.round(sizeMB)}MB), may exceed MongoDB 16MB limit`);
          // Truncate or skip PDF storage if too large
          originalPdfBuffer = null;
          console.warn("Skipping PDF buffer storage due to size - template will work but PDF generation won't be available");
        } else {
          console.log(`✓ PDF buffer size: ${Math.round(sizeMB * 100) / 100}MB - OK, will store in database`);
        }
      } catch (bufferErr) {
        console.error("Failed to convert PDF buffer:", bufferErr);
        // Continue without PDF buffer - template will still work but without PDF generation
        originalPdfBuffer = null;
      }
    } else if (!pdfBuffer) {
      console.log('⚠️ No PDF buffer provided - template will work but PDF generation won\'t be available');
    }

    // Prepare template document
    const templateData = {
      userId, 
      name, 
      type, 
      layout: finalLayout, // This now preserves all layout properties including formats
      theme, 
      isDefault: !!isDefault,
      pdfLayout: pdfLayout || null,
      sectionMapping: sectionMapping || null
    };
    
    // Only add originalPdf if we have a valid buffer
    if (originalPdfBuffer && originalPdfBuffer.length > 0) {
      templateData.originalPdf = originalPdfBuffer;
      console.log(`✓ Will save PDF buffer: ${Math.round(originalPdfBuffer.length / 1024)}KB`);
    } else {
      console.log('⚠️ No PDF buffer to save - template will work but PDF generation will not be available');
    }
    
    const tpl = await ResumeTemplate.create(templateData);
    
    // Verify PDF was saved - access directly from the document (not lean) to avoid serialization issues
    if (originalPdfBuffer && originalPdfBuffer.length > 0) {
      // Refresh the document to get the saved version
      await tpl.save(); // Ensure it's saved
      
      // Query back without lean to get proper Buffer type
      const savedTemplate = await ResumeTemplate.findById(tpl._id).select('+originalPdf');
      if (savedTemplate && savedTemplate.originalPdf) {
        const savedSize = Buffer.isBuffer(savedTemplate.originalPdf) 
          ? savedTemplate.originalPdf.length 
          : (savedTemplate.originalPdf?.data?.length || 0);
          
        if (savedSize > 0 && savedSize === originalPdfBuffer.length) {
          console.log(`✅ Verified: Template PDF saved successfully (${Math.round(savedSize / 1024)}KB)`);
        } else {
          console.error(`❌ WARNING: PDF size mismatch! Expected ${Math.round(originalPdfBuffer.length / 1024)}KB but saved ${Math.round(savedSize / 1024)}KB`);
          console.error(`   Buffer types - Original: ${typeof originalPdfBuffer}, Saved: ${typeof savedTemplate.originalPdf}`);
          console.error(`   Is Buffer - Original: ${Buffer.isBuffer(originalPdfBuffer)}, Saved: ${Buffer.isBuffer(savedTemplate.originalPdf)}`);
        }
      } else {
        console.error(`❌ WARNING: PDF field is null/undefined in saved template`);
      }
    }
    
    // Verify formats were saved
    console.log('Template saved with layout:', {
      projectFormat: tpl.layout?.projectFormat,
      experienceFormat: tpl.layout?.experienceFormat,
      educationFormat: tpl.layout?.educationFormat
    });
    
    // Don't send PDF buffer in response (too large)
    const templateResponse = tpl.toObject();
    delete templateResponse.originalPdf;
    
    const { response, statusCode } = successResponse("Template created", { template: templateResponse }, 201);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Template creation error:", err);
    console.error("Error details:", err.message, err.stack);
    const { response, statusCode } = errorResponse(
      `Failed to create template: ${err.message}`,
      500,
      ERROR_CODES.DATABASE_ERROR
    );
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
    const { name, type, layout, theme, pdfBuffer, pdfLayout, sectionMapping } = req.body || {};
    if (!name || !type) {
      const { response, statusCode } = errorResponse("Name and type are required", 400, ERROR_CODES.MISSING_REQUIRED_FIELD);
      return sendResponse(res, response, statusCode);
    }
    
    // Convert base64 PDF buffer back to Buffer if provided
    // Limit PDF buffer size to prevent database issues (16MB MongoDB document limit)
    let originalPdfBuffer = null;
    if (pdfBuffer && typeof pdfBuffer === 'string') {
      try {
        originalPdfBuffer = Buffer.from(pdfBuffer, 'base64');
        // Check size - MongoDB has 16MB document limit
        const sizeMB = originalPdfBuffer.length / 1024 / 1024;
        if (originalPdfBuffer.length > 15 * 1024 * 1024) {
          console.warn(`PDF buffer is large (${Math.round(sizeMB)}MB), may exceed MongoDB 16MB limit`);
          originalPdfBuffer = null;
          console.warn("Skipping PDF buffer storage due to size");
        }
      } catch (bufferErr) {
        console.error("Failed to convert PDF buffer:", bufferErr);
        originalPdfBuffer = null;
      }
    }
    
    const tpl = await ResumeTemplate.create({ 
      userId, 
      name, 
      type, 
      layout, 
      theme, 
      isDefault: false,
      originalPdf: originalPdfBuffer,
      pdfLayout: pdfLayout || null,
      sectionMapping: sectionMapping || null
    });
    
    // Don't send PDF buffer in response
    const templateResponse = tpl.toObject();
    delete templateResponse.originalPdf;
    
    const { response, statusCode } = successResponse("Template imported", { template: templateResponse }, 201);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Template import error:", err);
    console.error("Error details:", err.message, err.stack);
    const { response, statusCode } = errorResponse(
      `Failed to import template: ${err.message}`,
      500,
      ERROR_CODES.DATABASE_ERROR
    );
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
    const { jobId, templateId, name, variation } = req.body;

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
    // CRITICAL: Do NOT use .lean() - it can strip nested properties like layout.projectFormat
    const templateDoc = await ResumeTemplate.findOne({
      _id: templateId,
      $or: [{ userId }, { isShared: true }],
    });
    if (!templateDoc) {
      const { response, statusCode } = errorResponse("Template not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    
    // Convert to object to ensure all nested properties are preserved
    const template = templateDoc.toObject();

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

    // Generate content with AI - use provided variation if available, otherwise generate new
    let aiContent;
    if (variation) {
      // Use provided variation
      aiContent = variation;
    } else {
      // Generate new content (single variation)
      // Log template layout to debug format issues
      console.log('Template layout for AI generation:', {
        projectFormat: template.layout?.projectFormat,
        experienceFormat: template.layout?.experienceFormat,
        educationFormat: template.layout?.educationFormat,
        hasLayout: !!template.layout
      });
      aiContent = await generateResumeContent(jobPosting, userProfile, template);
    }

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

    // Map projects to use AI-generated bullets if available
    const projectsSection = (aiContent.projects && aiContent.projects.length > 0) 
      ? aiContent.projects.map((aiProject, index) => {
          // Match AI project to user's project by index or name
          const userProject = user.projects?.[index] || {};
          return {
            name: aiProject.name || userProject.name || 'Project',
            technologies: aiProject.technologies || userProject.technologies || [],
            bullets: aiProject.bullets || [],
            description: aiProject.bullets?.join(' ') || userProject.description || '',
            ...userProject // Preserve other fields like dates, URLs, etc.
          };
        })
      : (user.projects || []).map(project => ({
          ...project,
          bullets: project.description ? [project.description] : []
        }));

    // Create resume with AI-generated content
    const sections = {
      summary: aiContent.summary || "",
      experience: experienceSection,
      skills: aiContent.relevantSkills || [],
      education: user.education || [],
      projects: projectsSection,
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
    console.error("Error stack:", err.stack);
    console.error("Error details:", {
      message: err.message,
      name: err.name,
      userId,
      jobId,
      templateId,
      name
    });
    const { response, statusCode } = errorResponse(
      `Failed to generate AI resume: ${err.message}`,
      500,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

// Generate multiple variations of resume content (for user to choose from)
export const generateResumeVariations = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { jobId, templateId } = req.body;

    if (!jobId || !templateId) {
      const { response, statusCode } = errorResponse(
        "jobId and templateId are required",
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

    // Fetch user profile
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

    // Prepare data
    const userProfile = {
      employment: user.employment || [],
      skills: user.skills || [],
      education: user.education || [],
      projects: user.projects || [],
      certifications: user.certifications || [],
    };

    const jobPosting = {
      title: job.title,
      company: job.company,
      description: job.description,
      requirements: job.requirements || job.description,
    };

    // Generate multiple variations
    const variations = await generateResumeContentVariations(jobPosting, userProfile, template, 3);

    const { response, statusCode } = successResponse(
      "Resume variations generated",
      { variations },
      200
    );
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Resume variations generation error:", err);
    const { response, statusCode } = errorResponse(
      `Failed to generate resume variations: ${err.message}`,
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

// Generate and download PDF resume
export const generateResumePDF = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    // Fetch resume
    const resume = await Resume.findOne({ _id: id, userId }).lean();
    if (!resume) {
      const { response, statusCode } = errorResponse("Resume not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Fetch template with PDF data - explicitly select originalPdf (normally excluded with select: false)
    // CRITICAL: Do NOT use .lean() - we need the actual Buffer object, not serialized
    const template = await ResumeTemplate.findOne({
      _id: resume.templateId,
      $or: [{ userId }, { isShared: true }],
    })
    .select('+originalPdf'); // Explicitly include originalPdf field
    
    if (!template) {
      const { response, statusCode } = errorResponse("Template not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }
    
    // Get the actual Buffer from Mongoose document (not serialized)
    const originalPdfBuffer = template.originalPdf;
    
    // Convert to object for other fields, but keep Buffer intact
    const templateObj = template.toObject();
    templateObj.originalPdf = originalPdfBuffer; // Preserve the actual Buffer

    // Check if template has PDF data for pixel-perfect generation
    // Log PDF buffer info for debugging
    if (templateObj.originalPdf) {
      const pdfSize = Buffer.isBuffer(templateObj.originalPdf) 
        ? templateObj.originalPdf.length 
        : 0;
      
      console.log(`📦 Retrieved template PDF: ${Math.round(pdfSize / 1024)}KB`);
      console.log(`   PDF type: ${typeof templateObj.originalPdf}, isBuffer: ${Buffer.isBuffer(templateObj.originalPdf)}`);
      
      if (pdfSize === 0) {
        console.error('❌ WARNING: Template PDF buffer size is 0! PDF generation will fail.');
        console.error('   This usually means the PDF was not saved correctly. Please re-upload the template.');
        const { response, statusCode } = errorResponse(
          "Template PDF is empty (0 bytes). The PDF was not saved correctly. Please re-upload the template PDF.",
          400,
          ERROR_CODES.INVALID_INPUT
        );
        return sendResponse(res, response, statusCode);
      }
    } else {
      console.error('❌ Template originalPdf is missing or null - PDF generation will fail');
    }
    
    if (!templateObj.originalPdf || !templateObj.pdfLayout) {
      const { response, statusCode } = errorResponse(
        "Template does not support PDF generation. Please re-upload the template PDF.",
        400,
        ERROR_CODES.INVALID_INPUT
      );
      return sendResponse(res, response, statusCode);
    }

    // Generate PDF - pass templateObj which has the proper Buffer from Mongoose document
    const pdfBuffer = await generatePdfFromTemplate(templateObj, resume, {
      strictLayoutMode: true,
      // Pass template format info so PDF generator can use exact formatting
      templateFormats: {
        projectFormat: templateObj.layout?.projectFormat,
        experienceFormat: templateObj.layout?.experienceFormat,
        educationFormat: templateObj.layout?.educationFormat
      }
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${resume.name || 'resume'}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation error:", err);
    const { response, statusCode } = errorResponse(
      `Failed to generate PDF: ${err.message}`,
      500,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};
