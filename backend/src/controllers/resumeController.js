import { ResumeTemplate } from "../models/ResumeTemplate.js";
import { Resume } from "../models/Resume.js";
import { generateResumeContent, generateResumeContentVariations, regenerateSection, analyzeATSCompatibility, optimizeResumeSkills, tailorExperience } from "../utils/geminiService.js";
import { generatePdfFromTemplate } from "../utils/pdfGenerator.js";
import { exportToDocx, exportToHtml, exportToPlainText } from "../utils/resumeExporter.js";
import { htmlToPdf } from "../utils/htmlToPdf.js";
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
    
    // UC-52: Add job usage count for each resume
    const resumesWithJobCount = await Promise.all(
      resumes.map(async (resume) => {
        const jobCount = await Job.countDocuments({ 
          userId, 
          linkedResumeId: resume._id 
        });
        return { ...resume, linkedJobCount: jobCount };
      })
    );
    
    const { response, statusCode } = successResponse("Resumes fetched", { resumes: resumesWithJobCount });
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
        tailoredForJob: jobId, // Store the job ID, not the title
        tailoredForJobTitle: `${job.title} at ${job.company}`, // Store title separately for display
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
    console.error("Error stack:", err.stack);
    console.error("Section:", req.body?.section);
    console.error("Resume ID:", req.params?.id);
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
    
    // UC-51: Extract watermark options from query params
    const { watermark, watermarkEnabled } = req.query;
    const watermarkOptions = watermarkEnabled === 'true' && watermark 
      ? { enabled: true, text: watermark } 
      : null;

    // Fetch resume
    const resume = await Resume.findOne({ _id: id, userId }).lean();
    if (!resume) {
      const { response, statusCode } = errorResponse("Resume not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Fetch template with PDF data - explicitly select originalPdf (normally excluded with select: false)
    // CRITICAL: Do NOT use .lean() - we need the actual Buffer object, not serialized
    let template = await ResumeTemplate.findOne({
      _id: resume.templateId,
      $or: [{ userId }, { isShared: true }],
    })
    .select('+originalPdf'); // Explicitly include originalPdf field

    if (!template) {
      console.warn(`PDF: Template ${resume.templateId} not found for user ${userId}. Attempting fallbacks...`);
      // Check if template exists at all (ownership mismatch)
      const existsButNotAccessible = await ResumeTemplate.findById(resume.templateId).select('_id userId isShared');
      if (existsButNotAccessible) {
        console.warn(`PDF: Template exists but not accessible. Owner=${existsButNotAccessible.userId}, isShared=${existsButNotAccessible.isShared}`);
      }
      // Fallback 1: Use user's default template
      const defaultTpl = await ResumeTemplate.findOne({ userId, isDefault: true }).select('+originalPdf');
      if (defaultTpl) {
        console.info(`PDF: Using user's default template ${defaultTpl._id} as fallback`);
        template = defaultTpl;
      } else {
        // Fallback 2: Any template for user
        const anyTpl = await ResumeTemplate.findOne({ userId }).select('+originalPdf');
        if (anyTpl) {
          console.info(`PDF: Using user's template ${anyTpl._id} as fallback`);
          template = anyTpl;
        } else {
          const { response, statusCode } = errorResponse(
            "Template not found for this resume and no fallback templates exist. Please create/import a template and try again.",
            404,
            ERROR_CODES.NOT_FOUND
          );
          return sendResponse(res, response, statusCode);
        }
      }
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
      // Fallback: Render HTML then convert to PDF using headless Chrome
      console.warn('PDF: Pixel-perfect template missing. Falling back to HTML->PDF rendering.');
      try {
        // For HTML export we can use a lean object of template for theme/layout
        const templateForHtml = (typeof template.toObject === 'function') ? template.toObject() : templateObj;
        const html = exportToHtml(resume, templateForHtml);
        // UC-51: Pass watermark options to HTML->PDF fallback
        const pdfBuffer = await htmlToPdf(html, { watermark: watermarkOptions });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${resume.name || 'resume'}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.send(pdfBuffer);
      } catch (fallbackErr) {
        console.error('HTML->PDF fallback failed:', fallbackErr);
        const { response, statusCode } = errorResponse(
          `Template does not support pixel-perfect PDF and HTML->PDF fallback failed: ${fallbackErr.message}. If possible, import a PDF-based template for best results.`,
          500,
          ERROR_CODES.EXTERNAL_SERVICE_ERROR
        );
        return sendResponse(res, response, statusCode);
      }
    }

    // Generate PDF - pass templateObj which has the proper Buffer from Mongoose document
    const pdfBuffer = await generatePdfFromTemplate(templateObj, resume, {
      strictLayoutMode: true,
      // Pass template format info so PDF generator can use exact formatting
      templateFormats: {
        projectFormat: templateObj.layout?.projectFormat,
        experienceFormat: templateObj.layout?.experienceFormat,
        educationFormat: templateObj.layout?.educationFormat
      },
      // UC-51: Pass watermark options
      watermark: watermarkOptions
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

// UC-49: Optimize resume skills based on job requirements
export const optimizeSkills = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id: resumeId } = req.params;
    const { jobPostingId, jobTitle, jobCompany } = req.query;

    console.log('🔍 Optimize Skills - UserId:', userId);
    console.log('🔍 Optimize Skills - Params:', { resumeId, jobPostingId, jobTitle, jobCompany });

    // Fetch resume
    const resume = await Resume.findOne({ _id: resumeId, userId }).lean();
    if (!resume) {
      const { response, statusCode } = errorResponse("Resume not found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Get job posting - support both ID-based and title/company-based lookup
    let jobPosting = null;
    let targetJobId = jobPostingId || resume.metadata?.tailoredForJob;
    
    // If title and company provided, find job by those fields
    if (jobTitle && jobCompany) {
      console.log('🔍 Looking for job with title/company:', { title: jobTitle, company: jobCompany, userId });
      const job = await Job.findOne({ 
        title: jobTitle, 
        company: jobCompany, 
        userId 
      }).lean();
      
      console.log('🔍 Found job:', job ? `Yes (ID: ${job._id})` : 'No');
      
      if (job) {
        targetJobId = job._id;
      }
    }
    
    if (!targetJobId) {
      const { response, statusCode } = errorResponse(
        "Job posting is required. Provide jobPostingId, or jobTitle+jobCompany query parameters.",
        400,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
      return sendResponse(res, response, statusCode);
    }

    // Fetch and enrich job data (will scrape URL if data is incomplete)
    const { fetchEnrichedJobData } = await import("../utils/jobDataFetcher.js");
    jobPosting = await fetchEnrichedJobData(targetJobId, userId);
    
    if (!jobPosting) {
      console.log('❌ Job posting not found after enrichment');
      const { response, statusCode } = errorResponse("Job posting not found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    console.log('✅ Job posting enriched successfully');

    // Get user profile with complete skills
    console.log('🔍 Looking for user with auth0Id:', userId);
    const user = await User.findOne({ auth0Id: userId }).lean();
    console.log('🔍 Found user:', user ? `Yes (ID: ${user._id})` : 'No');
    
    if (!user) {
      console.log('❌ User profile not found for auth0Id:', userId);
      const { response, statusCode } = errorResponse("User profile not found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    console.log('✅ User found, calling AI optimization...');

    // Optimize skills using AI with enriched job data
    const optimization = await optimizeResumeSkills(resume, jobPosting, user);

    console.log('✅ AI optimization complete');

    const { response, statusCode } = successResponse("Skills optimized", { optimization });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Skills optimization error:", err);
    const { response, statusCode } = errorResponse(
      `Failed to optimize skills: ${err.message}`,
      500,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

// UC-50: Tailor experience descriptions based on job requirements
export const tailorExperienceForJob = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id: resumeId } = req.params;
    const { jobPostingId, jobTitle, jobCompany } = req.query;

    console.log('🔍 Tailor Experience - UserId:', userId);
    console.log('🔍 Tailor Experience - Params:', { resumeId, jobPostingId, jobTitle, jobCompany });

    // Fetch resume
    const resume = await Resume.findOne({ _id: resumeId, userId }).lean();
    if (!resume) {
      const { response, statusCode } = errorResponse("Resume not found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Get job posting - support both ID-based and title/company-based lookup
    let jobPosting = null;
    let targetJobId = jobPostingId || resume.metadata?.tailoredForJob;
    
    // If title and company provided, find job by those fields
    if (jobTitle && jobCompany) {
      console.log('🔍 Looking for job with title/company:', { title: jobTitle, company: jobCompany, userId });
      const job = await Job.findOne({ 
        title: jobTitle, 
        company: jobCompany, 
        userId 
      }).lean();
      
      console.log('🔍 Found job:', job ? `Yes (ID: ${job._id})` : 'No');
      
      if (job) {
        targetJobId = job._id;
      }
    }
    
    if (!targetJobId) {
      const { response, statusCode } = errorResponse(
        "Job posting is required. Provide jobPostingId, or jobTitle+jobCompany query parameters.",
        400,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
      return sendResponse(res, response, statusCode);
    }

    // Fetch and enrich job data (will scrape URL if data is incomplete)
    const { fetchEnrichedJobData } = await import("../utils/jobDataFetcher.js");
    jobPosting = await fetchEnrichedJobData(targetJobId, userId);

    if (!jobPosting) {
      const { response, statusCode } = errorResponse("Job posting not found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Get user profile with complete employment history
    const user = await User.findOne({ auth0Id: userId }).lean();
    if (!user) {
      const { response, statusCode } = errorResponse("User profile not found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Tailor experience using AI
    const tailoring = await tailorExperience(resume, jobPosting, user);

    const { response, statusCode } = successResponse("Experience tailored", { tailoring });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Experience tailoring error:", err);
    const { response, statusCode } = errorResponse(
      `Failed to tailor experience: ${err.message}`,
      500,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

// UC-52: Clone/duplicate a resume
export const cloneResume = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id: resumeId } = req.params;
    const { name, description } = req.body;

    // Fetch original resume
    const originalResume = await Resume.findOne({ _id: resumeId, userId }).lean();
    if (!originalResume) {
      const { response, statusCode } = errorResponse("Resume not found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Create clone with new name and description
    const clonedResume = await Resume.create({
      ...originalResume,
      _id: undefined, // Let MongoDB generate new ID
      name: name || `${originalResume.name} (Copy)`,
      metadata: {
        ...originalResume.metadata,
        clonedFrom: resumeId,
        clonedAt: new Date(),
        description: description || '' // UC-52: Version description
      }
    });

    const { response, statusCode } = successResponse("Resume cloned successfully", { resume: clonedResume }, 201);
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Resume cloning error:", err);
    const { response, statusCode } = errorResponse(
      `Failed to clone resume: ${err.message}`,
      500,
      ERROR_CODES.DATABASE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

// UC-52: Compare two resume versions
export const compareResumes = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id: resumeId1 } = req.params;
    const { resumeId2 } = req.query;

    if (!resumeId2) {
      const { response, statusCode } = errorResponse(
        "resumeId2 query parameter is required",
        400,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
      return sendResponse(res, response, statusCode);
    }

    // Fetch both resumes
    const [resume1, resume2] = await Promise.all([
      Resume.findOne({ _id: resumeId1, userId }).lean(),
      Resume.findOne({ _id: resumeId2, userId }).lean()
    ]);

    if (!resume1 || !resume2) {
      const { response, statusCode } = errorResponse("One or both resumes not found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Build comparison
    const comparison = {
      resume1: {
        id: resume1._id,
        name: resume1.name,
        createdAt: resume1.createdAt,
        updatedAt: resume1.updatedAt
      },
      resume2: {
        id: resume2._id,
        name: resume2.name,
        createdAt: resume2.createdAt,
        updatedAt: resume2.updatedAt
      },
      differences: {
        summary: resume1.sections?.summary !== resume2.sections?.summary,
        experienceCount: {
          resume1: resume1.sections?.experience?.length || 0,
          resume2: resume2.sections?.experience?.length || 0
        },
        skillsCount: {
          resume1: resume1.sections?.skills?.length || 0,
          resume2: resume2.sections?.skills?.length || 0
        },
        educationCount: {
          resume1: resume1.sections?.education?.length || 0,
          resume2: resume2.sections?.education?.length || 0
        },
        projectsCount: {
          resume1: resume1.sections?.projects?.length || 0,
          resume2: resume2.sections?.projects?.length || 0
        },
        sectionCustomization: JSON.stringify(resume1.sectionCustomization) !== JSON.stringify(resume2.sectionCustomization)
      },
      fullData: {
        resume1: resume1.sections,
        resume2: resume2.sections
      }
    };

    const { response, statusCode } = successResponse("Resumes compared", { comparison });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Resume comparison error:", err);
    const { response, statusCode } = errorResponse(
      `Failed to compare resumes: ${err.message}`,
      500,
      ERROR_CODES.DATABASE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

// UC-52: Merge changes from one resume to another
export const mergeResumes = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id: targetResumeId } = req.params;
    const { sourceId, selectedChanges } = req.body;

    if (!sourceId || !selectedChanges || !Array.isArray(selectedChanges)) {
      const { response, statusCode } = errorResponse(
        "sourceId and selectedChanges array are required",
        400,
        ERROR_CODES.MISSING_REQUIRED_FIELD
      );
      return sendResponse(res, response, statusCode);
    }

    // Fetch both resumes
    const [targetResume, sourceResume] = await Promise.all([
      Resume.findOne({ _id: targetResumeId, userId }),
      Resume.findOne({ _id: sourceId, userId }).lean()
    ]);

    if (!targetResume || !sourceResume) {
      const { response, statusCode } = errorResponse("One or both resumes not found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Apply selected changes
    selectedChanges.forEach(path => {
      const pathParts = path.split('.');
      
      if (pathParts[0] === 'summary') {
        targetResume.sections.summary = sourceResume.sections.summary;
      } else if (pathParts[0] === 'experience') {
        if (pathParts.length === 1) {
          // Replace entire experience array
          targetResume.sections.experience = sourceResume.sections.experience;
        } else {
          // Replace specific experience item
          const index = parseInt(pathParts[1]);
          if (sourceResume.sections.experience && sourceResume.sections.experience[index]) {
            if (!targetResume.sections.experience) targetResume.sections.experience = [];
            targetResume.sections.experience[index] = sourceResume.sections.experience[index];
          }
        }
      } else if (pathParts[0] === 'skills') {
        targetResume.sections.skills = sourceResume.sections.skills;
      } else if (pathParts[0] === 'education') {
        if (pathParts.length === 1) {
          targetResume.sections.education = sourceResume.sections.education;
        } else {
          const index = parseInt(pathParts[1]);
          if (sourceResume.sections.education && sourceResume.sections.education[index]) {
            if (!targetResume.sections.education) targetResume.sections.education = [];
            targetResume.sections.education[index] = sourceResume.sections.education[index];
          }
        }
      } else if (pathParts[0] === 'projects') {
        if (pathParts.length === 1) {
          targetResume.sections.projects = sourceResume.sections.projects;
        } else {
          const index = parseInt(pathParts[1]);
          if (sourceResume.sections.projects && sourceResume.sections.projects[index]) {
            if (!targetResume.sections.projects) targetResume.sections.projects = [];
            targetResume.sections.projects[index] = sourceResume.sections.projects[index];
          }
        }
      }
    });

    await targetResume.save();

    const { response, statusCode } = successResponse("Resumes merged successfully", { resume: targetResume });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Resume merge error:", err);
    const { response, statusCode } = errorResponse(
      `Failed to merge resumes: ${err.message}`,
      500,
      ERROR_CODES.DATABASE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

// UC-52: Set default resume
export const setDefaultResume = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id: resumeId } = req.params;

    // Verify resume exists and belongs to user
    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) {
      const { response, statusCode } = errorResponse("Resume not found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Unset any existing default for this user
    await Resume.updateMany({ userId, isDefault: true }, { $set: { isDefault: false } });

    // Set this resume as default
    resume.isDefault = true;
    await resume.save();

    const { response, statusCode } = successResponse("Default resume set", { resume });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Set default resume error:", err);
    const { response, statusCode } = errorResponse(
      `Failed to set default resume: ${err.message}`,
      500,
      ERROR_CODES.DATABASE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

// UC-52: Archive resume
export const archiveResume = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id: resumeId } = req.params;

    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) {
      const { response, statusCode } = errorResponse("Resume not found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    resume.isArchived = true;
    await resume.save();

    const { response, statusCode } = successResponse("Resume archived successfully", { resume });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Archive resume error:", err);
    const { response, statusCode } = errorResponse(
      `Failed to archive resume: ${err.message}`,
      500,
      ERROR_CODES.DATABASE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

// UC-52: Unarchive resume
export const unarchiveResume = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id: resumeId } = req.params;

    const resume = await Resume.findOne({ _id: resumeId, userId });
    if (!resume) {
      const { response, statusCode } = errorResponse("Resume not found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    resume.isArchived = false;
    await resume.save();

    const { response, statusCode } = successResponse("Resume unarchived successfully", { resume });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Unarchive resume error:", err);
    const { response, statusCode } = errorResponse(
      `Failed to unarchive resume: ${err.message}`,
      500,
      ERROR_CODES.DATABASE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

// UC-51: Export resume to DOCX
export const exportResumeDocx = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id: resumeId } = req.params;
    
    // UC-51: Extract watermark options from query params
    const { watermark, watermarkEnabled } = req.query;
    const watermarkOptions = watermarkEnabled === 'true' && watermark 
      ? { enabled: true, text: watermark } 
      : null;

    const resume = await Resume.findOne({ _id: resumeId, userId }).lean();
    if (!resume) {
      const { response, statusCode } = errorResponse("Resume not found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    const template = await ResumeTemplate.findById(resume.templateId).lean();

    const docxBuffer = await exportToDocx(resume, template, watermarkOptions);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${resume.name || 'resume'}.docx"`);
    res.setHeader('Content-Length', docxBuffer.length);
    res.send(docxBuffer);
  } catch (err) {
    console.error("DOCX export error:", err);
    const { response, statusCode } = errorResponse(
      `Failed to export DOCX: ${err.message}`,
      500,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

// UC-51: Export resume to HTML
export const exportResumeHtml = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id: resumeId } = req.params;

    const resume = await Resume.findOne({ _id: resumeId, userId }).lean();
    if (!resume) {
      const { response, statusCode } = errorResponse("Resume not found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    const template = await ResumeTemplate.findById(resume.templateId).lean();

    const html = exportToHtml(resume, template);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${resume.name || 'resume'}.html"`);
    res.send(html);
  } catch (err) {
    console.error("HTML export error:", err);
    const { response, statusCode } = errorResponse(
      `Failed to export HTML: ${err.message}`,
      500,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

// UC-51: Export resume to plain text
export const exportResumeText = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id: resumeId } = req.params;

    const resume = await Resume.findOne({ _id: resumeId, userId }).lean();
    if (!resume) {
      const { response, statusCode } = errorResponse("Resume not found", 404, ERROR_CODES.RESOURCE_NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    const text = exportToPlainText(resume);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${resume.name || 'resume'}.txt"`);
    res.send(text);
  } catch (err) {
    console.error("Text export error:", err);
    const { response, statusCode } = errorResponse(
      `Failed to export text: ${err.message}`,
      500,
      ERROR_CODES.EXTERNAL_SERVICE_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};
