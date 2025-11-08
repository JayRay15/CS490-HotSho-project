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
 * Supports multiple common US phone formats:
 * - 1234567890
 * - 123 456 7890
 * - 123-456-7890
 * - (123) 456-7890
 * - (123)-456-7890
 */
export const validatePhoneNumber = (phone) => {
  if (!phone) {
    return { valid: false, message: 'Phone number is required' };
  }
  
  // Remove all non-digit characters to normalize
  const digitsOnly = phone.replace(/\D/g, '');
  
  // Check if we have exactly 10 digits (US phone number)
  if (digitsOnly.length !== 10) {
    return { 
      valid: false, 
      message: 'Phone number must contain exactly 10 digits' 
    };
  }
  
  // Check if the normalized number starts with a valid area code (2-9)
  if (digitsOnly[0] < '2' || digitsOnly[0] > '9') {
    return { 
      valid: false, 
      message: 'Invalid area code - must start with 2-9' 
    };
  }
  
  try {
    // Try to parse with libphonenumber-js for additional validation
    const phoneNumber = parsePhoneNumber(digitsOnly, 'US');
    
    if (phoneNumber.isValid()) {
      return { 
        valid: true, 
        message: 'Valid phone number',
        formatted: phoneNumber.formatInternational()
      };
    }
  } catch (error) {
    // If parsing fails but we have 10 valid digits, still accept it
  }
  
  // If we have 10 digits with valid area code, accept it
  return { 
    valid: true, 
    message: 'Valid phone number' 
  };
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
 * Check for professional tone and language
 */
export const analyzeProfessionalTone = (text) => {
  const issues = [];
  const textLower = text.toLowerCase();
  
  // Check for informal language
  const informalPhrases = [
    { phrase: /\bkinda\b/gi, replacement: 'somewhat', reason: 'Too informal' },
    { phrase: /\bgonna\b/gi, replacement: 'going to', reason: 'Too informal' },
    { phrase: /\bwanna\b/gi, replacement: 'want to', reason: 'Too informal' },
    { phrase: /\bgotta\b/gi, replacement: 'have to', reason: 'Too informal' },
    { phrase: /\blots of\b/gi, replacement: 'many', reason: 'Too informal' },
    { phrase: /\bstuff\b/gi, replacement: 'items/things', reason: 'Too vague' },
    { phrase: /\bbunch of\b/gi, replacement: 'several', reason: 'Too informal' },
    { phrase: /\bguys\b/gi, replacement: 'team members', reason: 'Too informal' },
  ];
  
  informalPhrases.forEach(({ phrase, replacement, reason }) => {
    const matches = text.match(phrase);
    if (matches) {
      matches.forEach(match => {
        issues.push({
          type: 'tone',
          message: `${reason}: "${match}" - Consider using "${replacement}"`,
          severity: 'warning',
          replacements: [replacement]
        });
      });
    }
  });
  
  // Check for first-person pronouns (should be avoided in resumes)
  const firstPersonPronouns = text.match(/\b(I|me|my|mine|we|us|our|ours)\b/gi);
  if (firstPersonPronouns && firstPersonPronouns.length > 0) {
    issues.push({
      type: 'tone',
      message: `Avoid first-person pronouns in resumes. Found: ${firstPersonPronouns.slice(0, 3).join(', ')}`,
      severity: 'warning',
      replacements: ['Use action verbs instead']
    });
  }
  
  // Check for weak action verbs
  const weakVerbs = [
    { verb: /\bhelped\b/gi, replacement: 'assisted, supported, facilitated' },
    { verb: /\bdid\b/gi, replacement: 'executed, performed, completed' },
    { verb: /\bwas responsible for\b/gi, replacement: 'managed, led, oversaw' },
    { verb: /\bworked on\b/gi, replacement: 'developed, created, implemented' },
  ];
  
  weakVerbs.forEach(({ verb, replacement }) => {
    const matches = text.match(verb);
    if (matches) {
      issues.push({
        type: 'tone',
        message: `Consider stronger action verb. Instead of "${matches[0]}", use: ${replacement}`,
        severity: 'info',
        replacements: replacement.split(', ')
      });
    }
  });
  
  return issues;
};

/**
 * Check format consistency across sections
 */
export const checkFormatConsistency = (resume) => {
  const issues = [];
  
  // Check date formats in experience
  if (resume.sections?.experience && Array.isArray(resume.sections.experience)) {
    const dateFormats = [];
    resume.sections.experience.forEach((exp, idx) => {
      if (exp.startDate) {
        const format = detectDateFormat(exp.startDate);
        dateFormats.push({ idx, field: 'startDate', format });
      }
      if (exp.endDate && exp.endDate !== 'Present') {
        const format = detectDateFormat(exp.endDate);
        dateFormats.push({ idx, field: 'endDate', format });
      }
    });
    
    // Check if all dates use the same format
    const uniqueFormats = [...new Set(dateFormats.map(d => d.format))];
    if (uniqueFormats.length > 1) {
      issues.push({
        type: 'format_consistency',
        section: 'experience',
        message: `Inconsistent date formats detected. Use consistent format throughout (e.g., "Jan 2020" or "01/2020")`,
        severity: 'warning',
        details: `Found formats: ${uniqueFormats.join(', ')}`
      });
    }
  }
  
  // Check date formats in education
  if (resume.sections?.education && Array.isArray(resume.sections.education)) {
    const dateFormats = [];
    resume.sections.education.forEach((edu, idx) => {
      if (edu.startDate) {
        const format = detectDateFormat(edu.startDate);
        dateFormats.push({ idx, field: 'startDate', format });
      }
      if (edu.endDate && edu.endDate !== 'Present') {
        const format = detectDateFormat(edu.endDate);
        dateFormats.push({ idx, field: 'endDate', format });
      }
    });
    
    const uniqueFormats = [...new Set(dateFormats.map(d => d.format))];
    if (uniqueFormats.length > 1) {
      issues.push({
        type: 'format_consistency',
        section: 'education',
        message: `Inconsistent date formats in education. Use consistent format throughout`,
        severity: 'warning'
      });
    }
  }
  
  // Check bullet point consistency
  if (resume.sections?.experience && Array.isArray(resume.sections.experience)) {
    resume.sections.experience.forEach((exp, idx) => {
      if (exp.responsibilities && Array.isArray(exp.responsibilities)) {
        const startsWithVerb = [];
        const hasProperPunctuation = [];
        
        exp.responsibilities.forEach((resp, respIdx) => {
          const trimmed = resp.trim();
          // Check if starts with capital letter and action verb
          const startsWithCapital = /^[A-Z]/.test(trimmed);
          startsWithVerb.push(startsWithCapital);
          
          // Check punctuation consistency
          const endsWithPeriod = trimmed.endsWith('.');
          hasProperPunctuation.push(endsWithPeriod);
        });
        
        // If some bullets have periods and some don't, flag it
        const periodCount = hasProperPunctuation.filter(Boolean).length;
        if (periodCount > 0 && periodCount < hasProperPunctuation.length) {
          issues.push({
            type: 'format_consistency',
            section: 'experience',
            field: `experience_${idx}`,
            message: `Inconsistent punctuation in bullet points. Either use periods on all bullets or none`,
            severity: 'warning'
          });
        }
      }
    });
  }
  
  return issues;
};

/**
 * Detect date format pattern
 */
const detectDateFormat = (dateStr) => {
  if (!dateStr) return 'none';
  if (dateStr === 'Present' || dateStr === 'Current') return 'present';
  
  // Mon YYYY (e.g., "Jan 2020")
  if (/^[A-Z][a-z]{2}\s\d{4}$/.test(dateStr)) return 'Mon YYYY';
  // Month YYYY (e.g., "January 2020")
  if (/^[A-Z][a-z]+\s\d{4}$/.test(dateStr)) return 'Month YYYY';
  // MM/YYYY (e.g., "01/2020")
  if (/^\d{2}\/\d{4}$/.test(dateStr)) return 'MM/YYYY';
  // YYYY-MM (e.g., "2020-01")
  if (/^\d{4}-\d{2}$/.test(dateStr)) return 'YYYY-MM';
  // YYYY (e.g., "2020")
  if (/^\d{4}$/.test(dateStr)) return 'YYYY';
  
  return 'unknown';
};

/**
 * Check for missing or incomplete information
 */
export const checkMissingInformation = (resume) => {
  const warnings = [];
  const sections = resume.sections || {};
  
  // Check contact info completeness
  const contact = sections.contactInfo || {};
  if (!contact.name) {
    warnings.push({
      type: 'missing_info',
      section: 'contactInfo',
      field: 'name',
      message: 'Name is missing from contact information',
      severity: 'error'
    });
  }
  if (!contact.location) {
    warnings.push({
      type: 'missing_info',
      section: 'contactInfo',
      field: 'location',
      message: 'Location is recommended for contact information',
      severity: 'warning'
    });
  }
  if (!contact.linkedin) {
    warnings.push({
      type: 'missing_info',
      section: 'contactInfo',
      field: 'linkedin',
      message: 'LinkedIn profile URL is recommended',
      severity: 'info'
    });
  }
  
  // Check for summary
  if (!sections.summary || sections.summary.trim().length === 0) {
    warnings.push({
      type: 'missing_info',
      section: 'summary',
      message: 'Professional summary is recommended to highlight your key qualifications',
      severity: 'warning'
    });
  } else if (sections.summary.trim().length < 100) {
    warnings.push({
      type: 'missing_info',
      section: 'summary',
      message: 'Summary is too brief. Aim for 2-3 sentences (100+ characters)',
      severity: 'info'
    });
  }
  
  // Check experience section
  if (!sections.experience || sections.experience.length === 0) {
    warnings.push({
      type: 'missing_info',
      section: 'experience',
      message: 'No work experience listed. Add your professional experience',
      severity: 'error'
    });
  } else {
    sections.experience.forEach((exp, idx) => {
      // Check if description exists and has content
      const hasDescription = exp.description && exp.description.trim().length > 0;
      
      // Check if responsibilities exists and has meaningful content (support both 'responsibilities' and 'bullets')
      const responsibilitiesArray = exp.responsibilities || exp.bullets;
      const hasResponsibilities = responsibilitiesArray && 
                                  Array.isArray(responsibilitiesArray) && 
                                  responsibilitiesArray.length > 0 &&
                                  responsibilitiesArray.some(r => r && r.trim().length > 0);
      
      // Warn only if BOTH are missing
      if (!hasDescription && !hasResponsibilities) {
        warnings.push({
          type: 'missing_info',
          section: 'experience',
          field: `experience_${idx}`,
          message: `Experience entry "${exp.company || 'Untitled'}" is missing description or responsibilities`,
          severity: 'warning'
        });
      }
      
      // Check if responsibilities has at least 2 meaningful bullet points
      if (hasResponsibilities) {
        const meaningfulResponsibilities = responsibilitiesArray.filter(r => r && r.trim().length > 0);
        if (meaningfulResponsibilities.length < 2) {
          warnings.push({
            type: 'missing_info',
            section: 'experience',
            field: `experience_${idx}`,
            message: `Experience entry "${exp.company || 'Untitled'}" should have at least 2-3 bullet points`,
            severity: 'info'
          });
        }
      }
    });
  }
  
  // Check education section
  if (!sections.education || sections.education.length === 0) {
    warnings.push({
      type: 'missing_info',
      section: 'education',
      message: 'No education listed. Add your educational background',
      severity: 'warning'
    });
  }
  
  // Check skills section
  if (!sections.skills || sections.skills.length === 0) {
    warnings.push({
      type: 'missing_info',
      section: 'skills',
      message: 'No skills listed. Add relevant technical and soft skills',
      severity: 'warning'
    });
  } else if (sections.skills.length < 5) {
    warnings.push({
      type: 'missing_info',
      section: 'skills',
      message: 'Consider adding more skills (aim for 8-12 relevant skills)',
      severity: 'info'
    });
  }
  
  return warnings;
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
  
  // 4. Check for missing information
  const missingInfoWarnings = checkMissingInformation(resume);
  missingInfoWarnings.forEach(warning => {
    if (warning.severity === 'error') {
      validationResults.isValid = false;
      validationResults.errors.push(warning);
    } else {
      validationResults.warnings.push(warning);
    }
  });
  
  // 5. Check format consistency
  const formatIssues = checkFormatConsistency(resume);
  formatIssues.forEach(issue => {
    validationResults.warnings.push(issue);
  });
  
  // 6. Professional tone analysis on key sections
  const sectionsToAnalyze = [
    { text: resume.sections?.summary, section: 'summary' },
  ];
  
  // Analyze experience descriptions
  if (resume.sections?.experience && Array.isArray(resume.sections.experience)) {
    resume.sections.experience.forEach((exp, idx) => {
      if (exp.description) {
        sectionsToAnalyze.push({ 
          text: exp.description, 
          section: 'experience',
          field: `experience_${idx}_description`
        });
      }
      if (exp.responsibilities && Array.isArray(exp.responsibilities)) {
        exp.responsibilities.forEach((resp, respIdx) => {
          sectionsToAnalyze.push({ 
            text: resp, 
            section: 'experience',
            field: `experience_${idx}_resp_${respIdx}`
          });
        });
      }
    });
  }
  
  // Analyze project descriptions
  if (resume.sections?.projects && Array.isArray(resume.sections.projects)) {
    resume.sections.projects.forEach((proj, idx) => {
      if (proj.description) {
        sectionsToAnalyze.push({ 
          text: proj.description, 
          section: 'projects',
          field: `project_${idx}_description`
        });
      }
    });
  }
  
  // Run tone analysis
  sectionsToAnalyze.forEach(item => {
    if (item.text) {
      const toneIssues = analyzeProfessionalTone(item.text);
      toneIssues.forEach(issue => {
        validationResults.warnings.push({
          ...issue,
          section: item.section,
          field: item.field
        });
      });
    }
  });
  
  // Summary counts
  validationResults.summary = {
    totalErrors: validationResults.errors.length,
    totalWarnings: validationResults.warnings.length,
    contactInfoValid: emailValidation.valid && phoneValidation.valid,
    grammarIssues: grammarErrors.reduce((sum, g) => sum + g.errors.length, 0),
    missingInfoCount: missingInfoWarnings.length,
    formatIssuesCount: formatIssues.length,
    toneIssuesCount: validationResults.warnings.filter(w => w.type === 'tone').length
  };
  
  return validationResults;
};
