/**
 * Resume Validation Controller (UC-053)
 * Handles validation of resume content before export
 */

import { Resume } from '../models/Resume.js';
import { validateResume } from '../utils/resumeValidator.js';
import { errorResponse, successResponse, sendResponse, ERROR_CODES } from '../utils/responseFormat.js';
import { htmlToPdf } from '../utils/htmlToPdf.js';
import { User } from '../models/User.js';
import { ResumeTemplate } from '../models/ResumeTemplate.js';

const getUserId = (req) => {
  const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
  return auth?.userId || auth?.payload?.sub;
};

/**
 * Generate HTML for resume (needed for PDF generation)
 */
const generateResumeHtml = (resume, template, user) => {
  const theme = template?.theme || { colors: { primary: '#4F5348', text: '#222' } };
  const fonts = theme?.fonts || { heading: 'Arial, sans-serif', body: 'Arial, sans-serif' };
  const layout = template?.layout || {};
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { margin: 0.5in; }
        body { 
          font-family: ${fonts.body}; 
          color: ${theme.colors.text}; 
          font-size: 11pt;
          line-height: 1.4;
        }
        h1 { 
          font-family: ${fonts.heading}; 
          color: ${theme.colors.primary}; 
          font-size: 18pt; 
          margin: 0 0 8px 0;
        }
        h2 { 
          font-family: ${fonts.heading}; 
          color: ${theme.colors.primary}; 
          font-size: 13pt; 
          margin: 12px 0 6px 0;
          border-bottom: 1px solid ${theme.colors.primary};
          padding-bottom: 2px;
        }
        .contact-info { 
          margin-bottom: 12px; 
          font-size: 10pt;
        }
        .section { margin-bottom: 12px; }
        .experience-item, .education-item, .project-item { margin-bottom: 10px; }
        .job-title { font-weight: bold; }
        .company { font-style: italic; }
        .date { float: right; font-size: 10pt; color: #666; }
        ul { margin: 4px 0; padding-left: 20px; }
        li { margin-bottom: 2px; }
      </style>
    </head>
    <body>
  `;
  
  // Contact Info
  if (resume.sections?.contactInfo) {
    const contact = resume.sections.contactInfo;
    html += `<h1>${contact.name || 'Name'}</h1>`;
    html += `<div class="contact-info">`;
    if (contact.email) html += `${contact.email} | `;
    if (contact.phone) html += `${contact.phone} | `;
    if (contact.location) html += `${contact.location} | `;
    if (contact.linkedin) html += `${contact.linkedin}`;
    html += `</div>`;
  }
  
  // Get section order
  const sectionOrder = layout.sectionsOrder || ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'];
  
  // Render sections in order
  sectionOrder.forEach(sectionKey => {
    const section = resume.sections?.[sectionKey];
    if (!section) return;
    
    switch (sectionKey) {
      case 'summary':
        if (section) {
          html += `<div class="section"><h2>Professional Summary</h2><p>${section}</p></div>`;
        }
        break;
        
      case 'experience':
        if (Array.isArray(section) && section.length > 0) {
          html += `<div class="section"><h2>Experience</h2>`;
          section.forEach(exp => {
            html += `<div class="experience-item">`;
            html += `<div><span class="job-title">${exp.title || ''}</span>`;
            if (exp.startDate || exp.endDate) {
              html += ` <span class="date">${exp.startDate || ''} - ${exp.endDate || 'Present'}</span>`;
            }
            html += `</div>`;
            html += `<div class="company">${exp.company || ''}</div>`;
            if (exp.location) html += `<div>${exp.location}</div>`;
            if (exp.responsibilities && Array.isArray(exp.responsibilities)) {
              html += `<ul>`;
              exp.responsibilities.forEach(resp => {
                html += `<li>${resp}</li>`;
              });
              html += `</ul>`;
            }
            html += `</div>`;
          });
          html += `</div>`;
        }
        break;
        
      case 'education':
        if (Array.isArray(section) && section.length > 0) {
          html += `<div class="section"><h2>Education</h2>`;
          section.forEach(edu => {
            html += `<div class="education-item">`;
            html += `<div><strong>${edu.degree || ''}</strong>`;
            if (edu.graduationDate) {
              html += ` <span class="date">${edu.graduationDate}</span>`;
            }
            html += `</div>`;
            html += `<div>${edu.school || ''}</div>`;
            if (edu.field) html += `<div>${edu.field}</div>`;
            if (edu.gpa) html += `<div>GPA: ${edu.gpa}</div>`;
            html += `</div>`;
          });
          html += `</div>`;
        }
        break;
        
      case 'skills':
        if (Array.isArray(section) && section.length > 0) {
          html += `<div class="section"><h2>Skills</h2>`;
          html += `<p>${section.join(' • ')}</p>`;
          html += `</div>`;
        }
        break;
        
      case 'projects':
        if (Array.isArray(section) && section.length > 0) {
          html += `<div class="section"><h2>Projects</h2>`;
          section.forEach(proj => {
            html += `<div class="project-item">`;
            html += `<div><strong>${proj.name || ''}</strong></div>`;
            if (proj.description) html += `<p>${proj.description}</p>`;
            if (proj.technologies) html += `<p><em>Technologies: ${proj.technologies}</em></p>`;
            html += `</div>`;
          });
          html += `</div>`;
        }
        break;
        
      case 'certifications':
        if (Array.isArray(section) && section.length > 0) {
          html += `<div class="section"><h2>Certifications</h2>`;
          section.forEach(cert => {
            html += `<div>`;
            html += `<strong>${cert.name || ''}</strong>`;
            if (cert.issuer) html += ` - ${cert.issuer}`;
            if (cert.date) html += ` (${cert.date})`;
            html += `</div>`;
          });
          html += `</div>`;
        }
        break;
    }
  });
  
  html += `</body></html>`;
  return html;
};

/**
 * UC-053: Validate resume before export
 * POST /api/resume/resumes/:id/validate
 */
export const validateResumeEndpoint = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    
    // Find resume
    const resume = await Resume.findOne({ _id: id, userId }).lean();
    if (!resume) {
      const { response, statusCode } = errorResponse(
        'Resume not found',
        404,
        ERROR_CODES.NOT_FOUND
      );
      return sendResponse(res, response, statusCode);
    }
    
    // Get template and user data for PDF generation
    const template = await ResumeTemplate.findById(resume.templateId).lean();
    const user = await User.findOne({ clerkId: userId }).lean();
    
    // Generate PDF for page count validation
    let pdfBuffer = null;
    try {
      const html = generateResumeHtml(resume, template, user);
      pdfBuffer = await htmlToPdf(html);
    } catch (pdfError) {
      console.error('PDF generation error during validation:', pdfError);
      // Continue validation without PDF length check
    }
    
    // Run validation
    const validationResults = await validateResume(resume, pdfBuffer);
    
    // Store validation results in resume metadata
    await Resume.updateOne(
      { _id: id },
      { 
        $set: { 
          'metadata.lastValidation': validationResults,
          'metadata.validatedAt': new Date()
        } 
      }
    );
    
    const { response, statusCode } = successResponse(
      validationResults.isValid 
        ? 'Resume validation passed' 
        : 'Resume validation found issues',
      { validation: validationResults }
    );
    
    return sendResponse(res, response, statusCode);
  } catch (error) {
    console.error('Resume validation error:', error);
    const { response, statusCode } = errorResponse(
      'Failed to validate resume',
      500,
      ERROR_CODES.SERVER_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};

/**
 * UC-053: Check if resume has been validated
 * GET /api/resume/resumes/:id/validation-status
 */
export const getValidationStatus = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    
    const resume = await Resume.findOne({ _id: id, userId }).lean();
    if (!resume) {
      const { response, statusCode } = errorResponse(
        'Resume not found',
        404,
        ERROR_CODES.NOT_FOUND
      );
      return sendResponse(res, response, statusCode);
    }
    
    const lastValidation = resume.metadata?.lastValidation;
    const validatedAt = resume.metadata?.validatedAt;
    const hasBeenValidated = !!lastValidation;
    
    // Check if resume was modified after last validation
    const isStale = hasBeenValidated && validatedAt && new Date(resume.updatedAt) > new Date(validatedAt);
    
    const { response, statusCode } = successResponse(
      'Validation status retrieved',
      {
        hasBeenValidated,
        isValid: lastValidation?.isValid || false,
        isStale, // Resume modified after validation
        validatedAt,
        lastValidation
      }
    );
    
    return sendResponse(res, response, statusCode);
  } catch (error) {
    console.error('Get validation status error:', error);
    const { response, statusCode } = errorResponse(
      'Failed to get validation status',
      500,
      ERROR_CODES.SERVER_ERROR
    );
    return sendResponse(res, response, statusCode);
  }
};
