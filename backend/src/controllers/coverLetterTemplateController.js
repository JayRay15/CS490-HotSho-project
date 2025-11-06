import { CoverLetterTemplate } from "../models/CoverLetterTemplate.js";
import { errorResponse, sendResponse, successResponse, ERROR_CODES } from "../utils/responseFormat.js";

const getUserId = (req) => {
  const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
  return auth?.userId || auth?.payload?.sub;
};

// Base templates by style (industry-agnostic)
const styleTemplates = {
  formal: {
    name: "Formal Professional",
    description: "Traditional formal cover letter suitable for corporate positions",
    content: `Dear Hiring Manager,

I am writing to express my strong interest in the [POSITION] position at [COMPANY]. With my background in [FIELD] and proven track record of [ACHIEVEMENT], I am confident in my ability to contribute effectively to your team.

In my previous role at [PREVIOUS_COMPANY], I successfully [ACCOMPLISHMENT]. This experience has equipped me with [SKILLS] that directly align with the requirements outlined in your job posting.

I am particularly drawn to [COMPANY] because of [REASON]. I am excited about the opportunity to bring my expertise in [EXPERTISE_AREA] to your organization and contribute to [COMPANY_GOAL].

Thank you for considering my application. I look forward to the opportunity to discuss how my skills and experiences align with your needs.

Sincerely,
[YOUR_NAME]`
  },
  modern: {
    name: "Modern Professional",
    description: "Contemporary cover letter with a friendly, professional tone",
    content: `Hi [HIRING_MANAGER_NAME],

I'm reaching out about the [POSITION] role at [COMPANY]. I've been following your work and I'm impressed by [COMPANY_ACHIEVEMENT].

Here's what I bring to the table:
✓ [KEY_SKILL_1]
✓ [KEY_SKILL_2]
✓ [KEY_SKILL_3]

At my last role with [PREVIOUS_COMPANY], I [ACCOMPLISHMENT] which led to [RESULT]. I thrive in environments where [WORK_STYLE].

I'm excited about [COMPANY] because [GENUINE_REASON]. I believe my experience with [RELEVANT_EXPERIENCE] would help you [SPECIFIC_GOAL].

I'd love to chat more about how I can contribute to [COMPANY]'s growth.

Best,
[YOUR_NAME]`
  },
  creative: {
    name: "Creative Expression",
    description: "Engaging and expressive cover letter for creative roles",
    content: `Hello [HIRING_MANAGER_NAME],

When I discovered the [POSITION] opening at [COMPANY], I knew I had to apply. Your recent [PROJECT/WORK] perfectly demonstrates the innovative approach I value.

I bring [YEARS] years of experience, specializing in:
→ [SPECIALTY_1]
→ [SPECIALTY_2]
→ [SPECIALTY_3]

My most notable achievement was [MAJOR_ACCOMPLISHMENT], which resulted in [IMPRESSIVE_METRIC]. I achieved this by [STRATEGY/APPROACH].

What excites me about [COMPANY] is [SPECIFIC_REASON]. I see tremendous opportunity to leverage my skills in [SKILL_AREA] to help [COMPANY_OBJECTIVE].

Let's connect to discuss how my creative energy and proven results can drive [COMPANY]'s continued success.

Creatively yours,
[YOUR_NAME]`
  },
  technical: {
    name: "Technical Professional",
    description: "Technical cover letter emphasizing skills and achievements",
    content: `Dear [HIRING_MANAGER_NAME],

I am excited to apply for the [POSITION] role at [COMPANY]. With [YEARS] years of experience in [FIELD], I have developed a strong foundation in [CORE_COMPETENCY].

My technical expertise includes:
• [SKILL_1]
• [SKILL_2]
• [SKILL_3]

At [PREVIOUS_COMPANY], I [TECHNICAL_ACHIEVEMENT]. This project involved [TECHNOLOGIES/METHODS] and resulted in [MEASURABLE_OUTCOME].

I am particularly impressed by [COMPANY]'s work on [SPECIFIC_PROJECT]. I am eager to contribute to [SPECIFIC_GOAL] using my experience with [RELEVANT_SKILLS].

I would welcome the opportunity to discuss how my technical skills and problem-solving approach can benefit your team.

Best regards,
[YOUR_NAME]`
  },
  executive: {
    name: "Executive Leadership",
    description: "Senior-level cover letter demonstrating strategic vision",
    content: `Dear [HIRING_MANAGER_NAME],

I am writing to express my interest in the [POSITION] position at [COMPANY]. Throughout my [YEARS]+ year career, I have consistently driven [KEY_ACHIEVEMENT_AREA] and delivered measurable results.

As [CURRENT_TITLE] at [PREVIOUS_COMPANY], I:
• [LEADERSHIP_ACHIEVEMENT_1]
• [LEADERSHIP_ACHIEVEMENT_2]
• [LEADERSHIP_ACHIEVEMENT_3]

My leadership philosophy centers on [LEADERSHIP_APPROACH], which has enabled me to [STRATEGIC_OUTCOME]. I am particularly drawn to [COMPANY]'s vision of [COMPANY_VISION] and believe my experience in [EXPERTISE_AREA] positions me to contribute meaningfully to your strategic objectives.

I would value the opportunity to discuss how my executive experience can help [COMPANY] achieve [STRATEGIC_GOAL].

Sincerely,
[YOUR_NAME]`
  }
};

// Industry-specific guidance/suggestions (not actual templates)
const industryGuidance = {
  technology: "Focus on technical skills, projects, and innovation. Mention specific technologies and methodologies.",
  marketing: "Emphasize creativity, campaigns, metrics, and brand growth. Showcase your creative thinking.",
  finance: "Highlight analytical skills, financial acumen, compliance knowledge, and attention to detail.",
  healthcare: "Emphasize patient care, medical knowledge, certifications, and compassionate service.",
  education: "Focus on teaching philosophy, student outcomes, curriculum development, and educational impact.",
  creative: "Showcase your portfolio, creative projects, unique perspective, and artistic vision.",
  sales: "Highlight numbers, client relationships, revenue growth, and negotiation skills.",
  engineering: "Emphasize technical expertise, project management, problem-solving, and innovation.",
  general: "Focus on transferable skills, adaptability, and how your background fits the role."
};

// Helper to seed default templates for a new user
const defaultCoverLetterTemplates = Object.keys(styleTemplates).map((style) => ({
  ...styleTemplates[style],
  industry: "general",
  style: style
}));

export const listTemplates = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { industry, style, isTemplate } = req.query;
    
    // Build query for own templates or shared (global shared)
    let query = { $or: [{ userId }, { isShared: true }] };
    
    // Add filters if provided
    if (industry) query.industry = industry;
    if (style) query.style = style;
    
    // Filter by isTemplate if specified (true = templates, false = saved cover letters)
    if (isTemplate !== undefined) {
      if (isTemplate === 'true') {
        query.isTemplate = true;
      } else if (isTemplate === 'false') {
        // For saved cover letters, explicitly check for false (not undefined/null)
        query.isTemplate = false;
      }
    }
    
    let templates = await CoverLetterTemplate.find(query)
      .sort({ isDefault: -1, updatedAt: -1 })
      .lean();

    // One-time migration: Update old templates without isTemplate field to have isTemplate: true
    // Only update templates with general industry and one of the 5 default styles
    await CoverLetterTemplate.updateMany(
      {
        userId,
        isTemplate: { $ne: false }, // Don't update explicitly false ones
        industry: 'general',
        style: { $in: ['formal', 'modern', 'creative', 'technical', 'executive'] }
      },
      {
        $set: { isTemplate: true }
      }
    );

    // Re-fetch after migration to get updated data
    templates = await CoverLetterTemplate.find(query)
      .sort({ isDefault: -1, updatedAt: -1 })
      .lean();

    // Seed defaults if none exist for this user (only seed templates, not saved letters)
    // Only check and seed when not specifically requesting saved letters
    // Check if user already has the default style templates
    const existingStyles = new Set(
      templates
        .filter(t => t.userId === userId && t.isTemplate === true && t.industry === 'general')
        .map(t => t.style)
    );
    
    const needsSeeding = !['formal', 'modern', 'creative', 'technical', 'executive']
      .every(style => existingStyles.has(style));
    
    if (needsSeeding && isTemplate !== 'false') {
      // Only seed templates that don't already exist
      const templatesToSeed = defaultCoverLetterTemplates.filter(
        t => !existingStyles.has(t.style)
      );
      
      if (templatesToSeed.length > 0) {
        const seeded = await CoverLetterTemplate.insertMany(
          templatesToSeed.map((t, idx) => ({
            userId,
            name: t.name,
            industry: t.industry,
            style: t.style,
            description: t.description,
            content: t.content,
            isTemplate: true,  // Mark as template
            isDefault: idx === 0 && templates.length === 0, // Only first is default if no templates exist
            isShared: false
          }))
        );
        templates = [...templates, ...seeded.map((d) => d.toObject())];
      }
    }

    // Add industry guidance to response
    const { response, statusCode } = successResponse("Cover letter templates fetched", { 
      templates,
      industryGuidance: industryGuidance 
    });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Error fetching cover letter templates:", err);
    const { response, statusCode } = errorResponse("Failed to fetch cover letter templates", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

export const getIndustryGuidance = async (req, res) => {
  try {
    const { industry } = req.query;
    
    if (industry && industryGuidance[industry]) {
      const { response, statusCode } = successResponse("Industry guidance fetched", { 
        industry,
        guidance: industryGuidance[industry]
      });
      return sendResponse(res, response, statusCode);
    }
    
    // Return all guidance
    const { response, statusCode } = successResponse("All industry guidance fetched", { 
      guidance: industryGuidance 
    });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Error fetching industry guidance:", err);
    const { response, statusCode } = errorResponse("Failed to fetch guidance", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

export const getTemplateById = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const template = await CoverLetterTemplate.findOne({
      _id: id,
      $or: [{ userId }, { isShared: true }]
    }).lean();

    if (!template) {
      const { response, statusCode } = errorResponse("Template not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    const { response, statusCode } = successResponse("Template fetched", { template });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Error fetching template:", err);
    const { response, statusCode } = errorResponse("Failed to fetch template", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

export const createTemplate = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { name, industry, style, content, description, isDefault, isTemplate } = req.body;

    if (!name || !industry || !style || !content) {
      const { response, statusCode } = errorResponse("Name, industry, style, and content are required", 400, ERROR_CODES.MISSING_REQUIRED_FIELD);
      return sendResponse(res, response, statusCode);
    }

    if (isDefault) {
      await CoverLetterTemplate.updateMany({ userId }, { $set: { isDefault: false } });
    }

    const template = await CoverLetterTemplate.create({
      userId,
      name,
      industry,
      style,
      content,
      description,
      isTemplate: isTemplate !== undefined ? isTemplate : false, // Default to false (saved cover letter)
      isDefault: !!isDefault
    });

    const { response, statusCode } = successResponse("Template created", { template });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Error creating template:", err);
    const { response, statusCode } = errorResponse("Failed to create template", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { name, industry, style, content, description, isDefault, isShared } = req.body;

    const template = await CoverLetterTemplate.findOne({ _id: id, userId });

    if (!template) {
      const { response, statusCode } = errorResponse("Template not found or unauthorized", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    if (isDefault) {
      await CoverLetterTemplate.updateMany({ userId }, { $set: { isDefault: false } });
    }

    if (name) template.name = name;
    if (industry) template.industry = industry;
    if (style) template.style = style;
    if (content) template.content = content;
    if (description !== undefined) template.description = description;
    if (isDefault !== undefined) template.isDefault = isDefault;
    if (isShared !== undefined) template.isShared = isShared;

    await template.save();

    const { response, statusCode } = successResponse("Template updated", { template });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Error updating template:", err);
    const { response, statusCode } = errorResponse("Failed to update template", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const result = await CoverLetterTemplate.deleteOne({ _id: id, userId });

    if (result.deletedCount === 0) {
      const { response, statusCode } = errorResponse("Template not found or unauthorized", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    const { response, statusCode } = successResponse("Template deleted", {});
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Error deleting template:", err);
    const { response, statusCode } = errorResponse("Failed to delete template", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

export const trackTemplateUsage = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await CoverLetterTemplate.findByIdAndUpdate(
      id,
      { $inc: { usageCount: 1 } },
      { new: true }
    );

    if (!template) {
      const { response, statusCode } = errorResponse("Template not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    const { response, statusCode } = successResponse("Template usage tracked", { template });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Error tracking template usage:", err);
    const { response, statusCode } = errorResponse("Failed to track usage", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

export const getTemplateAnalytics = async (req, res) => {
  try {
    const userId = getUserId(req);

    const templates = await CoverLetterTemplate.find({ userId })
      .select('name usageCount industry style createdAt')
      .sort({ usageCount: -1 })
      .lean();

    const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);
    const analytics = {
      totalTemplates: templates.length,
      totalUsage,
      templates,
      mostUsed: templates[0] || null
    };

    const { response, statusCode } = successResponse("Analytics fetched", { analytics });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Error fetching analytics:", err);
    const { response, statusCode } = errorResponse("Failed to fetch analytics", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

export const importTemplate = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { templateData } = req.body;

    if (!templateData) {
      const { response, statusCode } = errorResponse("Template data is required", 400, ERROR_CODES.MISSING_REQUIRED_FIELD);
      return sendResponse(res, response, statusCode);
    }

    // Parse if string
    const parsed = typeof templateData === 'string' ? JSON.parse(templateData) : templateData;

    // Validate required fields
    if (!parsed.name || !parsed.industry || !parsed.style || !parsed.content) {
      const { response, statusCode } = errorResponse("Template must include name, industry, style, and content", 400, ERROR_CODES.MISSING_REQUIRED_FIELD);
      return sendResponse(res, response, statusCode);
    }

    // Create template with user as owner
    const template = await CoverLetterTemplate.create({
      userId,
      name: parsed.name,
      industry: parsed.industry,
      style: parsed.style,
      content: parsed.content,
      description: parsed.description || '',
      isDefault: false,
      isShared: false
    });

    const { response, statusCode } = successResponse("Template imported successfully", { template });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Error importing template:", err);
    const { response, statusCode } = errorResponse("Failed to import template", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

export const shareTemplate = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { isShared, sharedWith } = req.body;

    const template = await CoverLetterTemplate.findOne({ _id: id, userId });

    if (!template) {
      const { response, statusCode } = errorResponse("Template not found or unauthorized", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    if (isShared !== undefined) {
      template.isShared = isShared;
    }

    if (sharedWith !== undefined) {
      template.sharedWith = sharedWith;
    }

    await template.save();

    const { response, statusCode } = successResponse("Template sharing updated", { template });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Error updating template sharing:", err);
    const { response, statusCode } = errorResponse("Failed to update sharing", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};

export const exportTemplate = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const template = await CoverLetterTemplate.findOne({
      _id: id,
      $or: [{ userId }, { isShared: true }]
    }).lean();

    if (!template) {
      const { response, statusCode } = errorResponse("Template not found", 404, ERROR_CODES.NOT_FOUND);
      return sendResponse(res, response, statusCode);
    }

    // Remove internal fields for export
    const exportData = {
      name: template.name,
      industry: template.industry,
      style: template.style,
      content: template.content,
      description: template.description
    };

    const { response, statusCode } = successResponse("Template exported", { template: exportData });
    return sendResponse(res, response, statusCode);
  } catch (err) {
    console.error("Error exporting template:", err);
    const { response, statusCode } = errorResponse("Failed to export template", 500, ERROR_CODES.DATABASE_ERROR);
    return sendResponse(res, response, statusCode);
  }
};
