/**
 * Constants and configuration for resume templates
 */

export const TEMPLATE_TYPES = [
  { value: "chronological", label: "Chronological" },
  { value: "functional", label: "Functional" },
  { value: "hybrid", label: "Hybrid" },
];

export const DEFAULT_SECTIONS = [
  { key: 'contactInfo', label: 'Contact Info' },
  { key: 'summary', label: 'Summary' },
  { key: 'experience', label: 'Experience' },
  { key: 'skills', label: 'Skills' },
  { key: 'education', label: 'Education' },
  { key: 'projects', label: 'Projects' },
  { key: 'certifications', label: 'Certifications' },
];

// Section arrangement presets/templates
export const SECTION_PRESETS = [
  {
    name: 'Standard',
    order: ['contactInfo', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications'],
    description: 'Traditional resume layout'
  },
  {
    name: 'Skills-First',
    order: ['contactInfo', 'skills', 'experience', 'projects', 'education', 'certifications', 'summary'],
    description: 'Emphasize skills before experience'
  },
  {
    name: 'Project-Focused',
    order: ['contactInfo', 'summary', 'projects', 'experience', 'skills', 'education', 'certifications'],
    description: 'Highlight projects prominently'
  },
  {
    name: 'Academic',
    order: ['contactInfo', 'education', 'projects', 'experience', 'skills', 'certifications', 'summary'],
    description: 'Education and academic work first'
  },
  {
    name: 'Minimal',
    order: ['contactInfo', 'experience', 'education', 'skills'],
    description: 'Only essential sections'
  },
];

/**
 * Helper function to format dates
 * Converts dates to "Month Year" format (e.g., "Jan 2020")
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  // If it's already in a good format (e.g., "Jan 2020"), return as-is
  if (dateString.match(/^[A-Za-z]{3,9}\s\d{4}$/)) {
    return dateString;
  }
  
  // If it's an ISO string or Date object, format it
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Invalid date, return as-is
    
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  } catch (e) {
    return dateString; // Return as-is if parsing fails
  }
};
