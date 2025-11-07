/**
 * Resume Validation Utility (UC-053)
 * Provides validation for resume content including grammar, email, phone, and page length
 */

import languagetoolApi from 'languagetool-api';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import validator from 'validator';
import { generateResumePDF } from '../controllers/resumeController.js';
import { PDFDocument } from 'pdf-lib';

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  if (!email) {
    return { valid: false, message: 'Email is required' };
  }
  
  if (!validator.isEmail(email)) {
    return { valid: false, message: 'Invalid email format' };
  }
  
  return { valid: true, message: 'Valid email' };
};

/**
 * Validate phone number format
 */
export const validatePhoneNumber = (phone) => {
  if (!phone) {
    return { valid: false, message: 'Phone number is required' };
  }
  
  try {
    // Try to parse with US as default country
    const phoneNumber = parsePhoneNumber(phone, 'US');
    
    if (!phoneNumber.isValid()) {
      return { valid: false, message: 'Invalid phone number format' };
    }
    
    return { 
      valid: true, 
      message: 'Valid phone number',
      formatted: phoneNumber.formatInternational()
    };
  } catch (error) {
    // Fallback: check if it's a valid phone number without country code
    if (isValidPhoneNumber(phone, 'US')) {
      return { valid: true, message: 'Valid phone number' };
    }
    
    return { 
      valid: false, 
      message: 'Invalid phone number format. Please use format: (XXX) XXX-XXXX or XXX-XXX-XXXX' 
    };
  }
};

/**
 * Basic grammar and writing quality checks (fallback when API unavailable)
 */
const performBasicGrammarChecks = (text) => {
  const errors = [];
  const lines = text.split('\n');
  
  // Common grammar issues to check
  const checks = [
    {
      pattern: /\b(their|there|they're)\b/gi,
      getMessage: (match) => `Check usage of "${match}" - commonly confused word`,
      severity: 'warning'
    },
    {
      pattern: /\b(your|you're)\b/gi,
      getMessage: (match) => `Check usage of "${match}" - commonly confused word`,
      severity: 'warning'
    },
    {
      pattern: /\b(its|it's)\b/gi,
      getMessage: (match) => `Check usage of "${match}" - commonly confused word`,
      severity: 'warning'
    },
    {
      pattern: /[.!?]\s+[a-z]/g,
      getMessage: () => 'Sentence should start with a capital letter',
      severity: 'error'
    },
    {
      pattern: /\s{2,}/g,
      getMessage: () => 'Multiple consecutive spaces',
      severity: 'warning'
    },
    {
      pattern: /\b(alot|skillfull)\b/gi,
      getMessage: (match) => `Possible spelling error: "${match}"`,
      severity: 'error',
      replacements: match => match.toLowerCase() === 'alot' ? ['a lot'] : ['skillful']
    }
  ];
  
  checks.forEach(check => {
    const matches = text.matchAll(check.pattern);
    for (const match of matches) {
      errors.push({
        message: check.getMessage(match[0]),
        shortMessage: check.getMessage(match[0]),
        offset: match.index,
        length: match[0].length,
        context: text.substring(Math.max(0, match.index - 20), Math.min(text.length, match.index + 50)),
        replacements: check.replacements ? check.replacements(match[0]) : [],
        rule: 'BASIC_CHECK',
        category: 'Grammar',
        severity: check.severity
      });
    }
  });
  
  return errors;
};

/**
 * Check grammar using LanguageTool API with fallback
 */
export const checkGrammar = async (text, section = 'general') => {
  // Convert to string and check if empty
  const textStr = String(text || '');
  if (!textStr || textStr.trim().length === 0) {
    return { hasErrors: false, errors: [], section };
  }

  // NOTE: LanguageTool public API currently unavailable (rate limits/service issues)
  // Using basic grammar checks as primary method for now
  console.log(`Performing basic grammar check for ${section}`);
  const basicErrors = performBasicGrammarChecks(textStr);
  
  return {
    hasErrors: basicErrors.length > 0,
    errorCount: basicErrors.filter(e => e.severity === 'error').length,
    warningCount: basicErrors.filter(e => e.severity === 'warning').length,
    errors: basicErrors,
    section,
    fallbackMode: true
  };

  /* DISABLED: LanguageTool API causing crashes due to service unavailability
  try {
    // Try LanguageTool API first with timeout
    const results = await Promise.race([
      new Promise((resolve, reject) => {
        try {
          languagetoolApi.check({
            text: textStr,
            language: 'en-US'
          }, (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          });
        } catch (syncError) {
          // Catch synchronous errors (like JSON parse errors)
          reject(syncError);
        }
      }),
      // 2 second timeout (faster fallback)
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API timeout')), 2000)
      )
    ]);
    
    // Check if results and matches exist
    if (!results || !results.matches) {
      console.log('No matches from LanguageTool, using basic checks');
      const basicErrors = performBasicGrammarChecks(textStr);
      return {
        hasErrors: basicErrors.length > 0,
        errorCount: basicErrors.filter(e => e.severity === 'error').length,
        warningCount: basicErrors.filter(e => e.severity === 'warning').length,
        errors: basicErrors,
        section,
        fallbackMode: true
      };
    }
    
    const errors = results.matches.map(match => ({
      message: match.message,
      shortMessage: match.shortMessage || match.message,
      offset: match.offset,
      length: match.length,
      context: match.context.text,
      replacements: match.replacements.slice(0, 3).map(r => r.value), // Top 3 suggestions
      rule: match.rule.id,
      category: match.rule.category.name,
      severity: match.rule.category.id === 'TYPOS' ? 'error' : 'warning'
    }));

    return {
      hasErrors: errors.length > 0,
      errorCount: errors.filter(e => e.severity === 'error').length,
      warningCount: errors.filter(e => e.severity === 'warning').length,
      errors,
      section
    };
  } catch (error) {
    console.log('LanguageTool API error, falling back to basic checks:', error.message);
    
    // Fallback to basic grammar checks
    const basicErrors = performBasicGrammarChecks(textStr);
    
    return {
      hasErrors: basicErrors.length > 0,
      errorCount: basicErrors.filter(e => e.severity === 'error').length,
      warningCount: basicErrors.filter(e => e.severity === 'warning').length,
      errors: basicErrors,
      section,
      fallbackMode: true
    };
  }
  */
};

/**
 * Count pages in a PDF buffer
 */
export const countPdfPages = async (pdfBuffer) => {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    return pdfDoc.getPageCount();
  } catch (error) {
    console.error('Error counting PDF pages:', error);
    throw new Error('Failed to count PDF pages');
  }
};

/**
 * Validate resume length (should be 1-2 pages)
 */
export const validateResumeLength = async (pdfBuffer) => {
  try {
    const pageCount = await countPdfPages(pdfBuffer);
    
    if (pageCount === 0) {
      return {
        valid: false,
        pageCount,
        message: 'Resume appears to be empty'
      };
    }
    
    if (pageCount === 1 || pageCount === 2) {
      return {
        valid: true,
        pageCount,
        message: `Resume is ${pageCount} page${pageCount > 1 ? 's' : ''} (optimal)`
      };
    }
    
    if (pageCount > 2) {
      return {
        valid: false,
        pageCount,
        message: `Resume is ${pageCount} pages. Consider reducing to 1-2 pages for better readability.`
      };
    }
    
    return {
      valid: false,
      pageCount,
      message: 'Unable to determine resume length'
    };
  } catch (error) {
    console.error('Error validating resume length:', error);
    throw error;
  }
};

/**
 * Extract all text content from resume sections for grammar checking
 */
export const extractTextFromResume = (resume) => {
  const texts = [];
  
  // Contact Info
  if (resume.sections?.contactInfo) {
    const contact = resume.sections.contactInfo;
    if (contact.name) texts.push({ section: 'contactInfo', field: 'name', text: contact.name });
    if (contact.email) texts.push({ section: 'contactInfo', field: 'email', text: contact.email });
    if (contact.phone) texts.push({ section: 'contactInfo', field: 'phone', text: contact.phone });
    if (contact.linkedin) texts.push({ section: 'contactInfo', field: 'linkedin', text: contact.linkedin });
    if (contact.location) texts.push({ section: 'contactInfo', field: 'location', text: contact.location });
  }
  
  // Summary
  if (resume.sections?.summary) {
    texts.push({ section: 'summary', field: 'text', text: resume.sections.summary });
  }
  
  // Experience
  if (resume.sections?.experience && Array.isArray(resume.sections.experience)) {
    resume.sections.experience.forEach((exp, idx) => {
      if (exp.company) texts.push({ section: 'experience', field: `company_${idx}`, text: exp.company });
      if (exp.title) texts.push({ section: 'experience', field: `title_${idx}`, text: exp.title });
      if (exp.location) texts.push({ section: 'experience', field: `location_${idx}`, text: exp.location });
      if (exp.description) texts.push({ section: 'experience', field: `description_${idx}`, text: exp.description });
      if (exp.responsibilities && Array.isArray(exp.responsibilities)) {
        exp.responsibilities.forEach((resp, respIdx) => {
          if (resp) texts.push({ section: 'experience', field: `resp_${idx}_${respIdx}`, text: resp });
        });
      }
    });
  }
  
  // Education
  if (resume.sections?.education && Array.isArray(resume.sections.education)) {
    resume.sections.education.forEach((edu, idx) => {
      if (edu.school) texts.push({ section: 'education', field: `school_${idx}`, text: edu.school });
      if (edu.degree) texts.push({ section: 'education', field: `degree_${idx}`, text: edu.degree });
      if (edu.field) texts.push({ section: 'education', field: `field_${idx}`, text: edu.field });
      if (edu.location) texts.push({ section: 'education', field: `location_${idx}`, text: edu.location });
      if (edu.description) texts.push({ section: 'education', field: `description_${idx}`, text: edu.description });
    });
  }
  
  // Projects
  if (resume.sections?.projects && Array.isArray(resume.sections.projects)) {
    resume.sections.projects.forEach((proj, idx) => {
      if (proj.name) texts.push({ section: 'projects', field: `name_${idx}`, text: proj.name });
      if (proj.description) texts.push({ section: 'projects', field: `description_${idx}`, text: proj.description });
      if (proj.technologies) texts.push({ section: 'projects', field: `tech_${idx}`, text: proj.technologies });
    });
  }
  
  // Certifications
  if (resume.sections?.certifications && Array.isArray(resume.sections.certifications)) {
    resume.sections.certifications.forEach((cert, idx) => {
      if (cert.name) texts.push({ section: 'certifications', field: `name_${idx}`, text: cert.name });
      if (cert.issuer) texts.push({ section: 'certifications', field: `issuer_${idx}`, text: cert.issuer });
    });
  }
  
  return texts;
};

/**
 * Main validation function
 * Validates grammar, email, phone, and page length
 */
export const validateResume = async (resume, pdfBuffer) => {
  const validationResults = {
    isValid: true,
    errors: [],
    warnings: [],
    timestamp: new Date().toISOString()
  };
  
  // 1. Validate contact information
  const contactInfo = resume.sections?.contactInfo || {};
  
  // Email validation
  const emailValidation = validateEmail(contactInfo.email);
  if (!emailValidation.valid) {
    validationResults.isValid = false;
    validationResults.errors.push({
      type: 'contact_info',
      field: 'email',
      message: emailValidation.message,
      severity: 'error'
    });
  }
  
  // Phone validation
  const phoneValidation = validatePhoneNumber(contactInfo.phone);
  if (!phoneValidation.valid) {
    validationResults.isValid = false;
    validationResults.errors.push({
      type: 'contact_info',
      field: 'phone',
      message: phoneValidation.message,
      severity: 'error'
    });
  }
  
  // 2. Validate resume length (1-2 pages)
  if (pdfBuffer) {
    try {
      const lengthValidation = await validateResumeLength(pdfBuffer);
      if (!lengthValidation.valid) {
        validationResults.warnings.push({
          type: 'length',
          field: 'page_count',
          message: lengthValidation.message,
          pageCount: lengthValidation.pageCount,
          severity: 'warning'
        });
      } else {
        validationResults.pageCount = lengthValidation.pageCount;
      }
    } catch (error) {
      validationResults.warnings.push({
        type: 'length',
        field: 'page_count',
        message: 'Unable to validate resume length',
        severity: 'warning'
      });
    }
  }
  
  // 3. Grammar check on all text content
  const textContent = extractTextFromResume(resume);
  const grammarErrors = [];
  
  for (const item of textContent) {
    // Skip email and phone from grammar check
    if (item.field === 'email' || item.field === 'phone') continue;
    
    const grammarCheck = await checkGrammar(item.text, item.section);
    if (grammarCheck.hasErrors) {
      grammarErrors.push({
        ...grammarCheck,
        field: item.field
      });
    }
  }
  
  // Add grammar errors to results
  if (grammarErrors.length > 0) {
    grammarErrors.forEach(grammarResult => {
      grammarResult.errors.forEach(error => {
        const resultItem = {
          type: 'grammar',
          section: grammarResult.section,
          field: grammarResult.field,
          message: error.message,
          severity: error.severity,
          context: error.context,
          replacements: error.replacements
        };
        
        if (error.severity === 'error') {
          validationResults.isValid = false;
          validationResults.errors.push(resultItem);
        } else {
          validationResults.warnings.push(resultItem);
        }
      });
    });
  }
  
  // Summary counts
  validationResults.summary = {
    totalErrors: validationResults.errors.length,
    totalWarnings: validationResults.warnings.length,
    contactInfoValid: emailValidation.valid && phoneValidation.valid,
    grammarIssues: grammarErrors.reduce((sum, g) => sum + g.errors.length, 0)
  };
  
  return validationResults;
};
