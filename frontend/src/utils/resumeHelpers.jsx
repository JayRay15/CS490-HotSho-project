/**
 * Resume Helper Functions
 * Extracted from ResumeTemplates.jsx to reduce file size
 */

import React from 'react';

/**
 * Format date string to "Mon YYYY" format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const month = date.toLocaleString('default', { month: 'short' });
  const year = date.getFullYear();
  return `${month} ${year}`;
};

/**
 * Get display name for a resume section
 * @param {string} sectionType - Type of section (summary, experience, etc.)
 * @param {object} sectionStyles - Section styles from template
 * @returns {string} Display name for the section
 */
export const getSectionName = (sectionType, sectionStyles = {}) => {
  return sectionStyles[sectionType]?.displayName || 
         (sectionType === 'summary' ? 'Professional Summary' :
          sectionType === 'experience' ? 'Professional Experience' :
          sectionType === 'skills' ? 'Technical Skills' :
          sectionType === 'education' ? 'Education' :
          sectionType === 'projects' ? 'Projects' :
          sectionType === 'awards' ? 'Awards' :
          sectionType === 'certifications' ? 'Certifications' :
          sectionType.charAt(0).toUpperCase() + sectionType.slice(1));
};

/**
 * Calculate progress percentage for resume completion
 * @param {object} resume - Resume object
 * @returns {number} Progress percentage (0-100)
 */
export const calculateResumeProgress = (resume) => {
  if (!resume || !resume.sections) return 0;
  
  let totalFields = 0;
  let filledFields = 0;

  // Check summary
  if (resume.sections.summary && resume.sections.summary.trim()) {
    filledFields++;
  }
  totalFields++;

  // Check experience
  if (resume.sections.experience && resume.sections.experience.length > 0) {
    filledFields++;
  }
  totalFields++;

  // Check skills
  if (resume.sections.skills && resume.sections.skills.length > 0) {
    filledFields++;
  }
  totalFields++;

  // Check education
  if (resume.sections.education && resume.sections.education.length > 0) {
    filledFields++;
  }
  totalFields++;

  return Math.round((filledFields / totalFields) * 100);
};

/**
 * Get color for validation status badge
 * @param {string} status - Validation status
 * @returns {object} Object with bg and text colors
 */
export const getValidationStatusColor = (status) => {
  switch (status) {
    case 'valid':
      return { bg: 'bg-green-100', text: 'text-green-800' };
    case 'invalid':
      return { bg: 'bg-red-100', text: 'text-red-800' };
    case 'stale':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800' };
  }
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Clean HTML content (remove HTML tags)
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
export const stripHtml = (html) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '');
};

/**
 * Get file extension for export format
 * @param {string} format - Export format (pdf, docx, html, txt)
 * @returns {string} File extension with dot
 */
export const getFileExtension = (format) => {
  const extMap = { 
    pdf: '.pdf', 
    docx: '.docx', 
    html: '.html', 
    txt: '.txt' 
  };
  return extMap[format] || '';
};

/**
 * Validate filename and add extension if missing
 * @param {string} filename - Original filename
 * @param {string} format - Export format
 * @returns {string} Validated filename with extension
 */
export const validateFilename = (filename, format) => {
  if (!filename) return `resume${getFileExtension(format)}`;
  const ext = getFileExtension(format);
  if (ext && !filename.toLowerCase().endsWith(ext)) {
    return filename + ext;
  }
  return filename;
};

/**
 * Highlight text differences between two strings
 * Used for comparing resume versions side-by-side
 * @param {string} text1 - First text (current version)
 * @param {string} text2 - Second text (previous version)
 * @returns {object} Object with highlighted JSX elements for text1 and text2
 */
export const highlightTextDiff = (text1, text2) => {
  if (!text1 && !text2) return { text1: null, text2: null };
  if (!text1) return { text1: null, text2: <span className="bg-green-200 text-green-900 px-1 rounded">{text2}</span> };
  if (!text2) return { text1: <span className="bg-red-200 text-red-900 px-1 rounded">{text1}</span>, text2: null };
  
  // Simple word-level diff
  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);
  
  if (text1 === text2) {
    return { text1: text1, text2: text2, identical: true };
  }
  
  // Find common and different words
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const highlightedText1 = words1.map((word, idx) => {
    if (!set2.has(word)) {
      return <span key={idx} className="bg-red-100 text-red-900 px-0.5 rounded">{word}</span>;
    }
    return word;
  });
  
  const highlightedText2 = words2.map((word, idx) => {
    if (!set1.has(word)) {
      return <span key={idx} className="bg-green-100 text-green-900 px-0.5 rounded">{word}</span>;
    }
    return word;
  });
  
  // Join with spaces
  const result1 = [];
  const result2 = [];
  
  highlightedText1.forEach((item, idx) => {
    if (idx > 0) result1.push(' ');
    result1.push(item);
  });
  
  highlightedText2.forEach((item, idx) => {
    if (idx > 0) result2.push(' ');
    result2.push(item);
  });
  
  return { text1: <span>{result1}</span>, text2: <span>{result2}</span> };
};
