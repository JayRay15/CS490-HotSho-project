/**
 * Frontend configuration for cover letter tone and style options
 */

export const TONE_OPTIONS = [
  { value: 'formal', label: 'Formal', description: 'Professional, traditional, and respectful' },
  { value: 'casual', label: 'Casual', description: 'Friendly, approachable, conversational' },
  { value: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic, passionate, highly motivated' },
  { value: 'analytical', label: 'Analytical', description: 'Data-driven, logical, detail-oriented' },
  { value: 'creative', label: 'Creative', description: 'Expressive, engaging, personality-driven' },
  { value: 'technical', label: 'Technical', description: 'Precise, technical terminology' },
  { value: 'executive', label: 'Executive', description: 'Strategic, leadership-focused' }
];

export const INDUSTRY_OPTIONS = [
  { value: 'general', label: 'General/Other' },
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'education', label: 'Education' },
  { value: 'sales', label: 'Sales' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'creative', label: 'Creative/Design' }
];

export const COMPANY_CULTURE_OPTIONS = [
  { value: 'corporate', label: 'Corporate', description: 'Established, structured, process-oriented' },
  { value: 'startup', label: 'Startup', description: 'Fast-paced, innovative, entrepreneurial' },
  { value: 'enterprise', label: 'Enterprise', description: 'Large-scale, global, complex systems' },
  { value: 'agency', label: 'Agency', description: 'Client-focused, project-based, deadline-driven' },
  { value: 'nonprofit', label: 'Nonprofit', description: 'Mission-driven, community-focused' },
  { value: 'remote', label: 'Remote-First', description: 'Distributed team, autonomous work' }
];

export const LENGTH_OPTIONS = [
  { value: 'brief', label: 'Brief (250-300 words)', description: 'Concise and to the point' },
  { value: 'standard', label: 'Standard (300-400 words)', description: 'Balanced coverage' },
  { value: 'detailed', label: 'Detailed (400-500 words)', description: 'Comprehensive with examples' }
];

export const WRITING_STYLE_OPTIONS = [
  { value: 'direct', label: 'Direct', description: 'Straightforward, clear, action-oriented' },
  { value: 'narrative', label: 'Narrative', description: 'Story-driven, contextual, journey-focused' },
  { value: 'hybrid', label: 'Hybrid', description: 'Combination of narrative and direct' }
];

/**
 * Validate tone consistency and return warnings
 */
export function validateToneConsistency(tone, industry, companyCulture) {
  const warnings = [];
  
  // Formal tone warnings
  if (tone === 'formal') {
    if (companyCulture === 'startup') {
      warnings.push('💡 Tip: Startup culture often prefers a more casual or enthusiastic tone');
    }
  }
  
  // Casual tone warnings
  if (tone === 'casual') {
    if (industry === 'finance' || industry === 'healthcare') {
      warnings.push('⚠️ Note: Conservative industries typically expect more formal communication');
    }
    if (companyCulture === 'corporate' || companyCulture === 'enterprise') {
      warnings.push('💡 Tip: Corporate culture may prefer more professional language');
    }
  }
  
  // Creative tone warnings
  if (tone === 'creative') {
    if (industry === 'finance' || industry === 'engineering') {
      warnings.push('💡 Tip: Ensure technical credibility is still emphasized in creative industries');
    }
  }
  
  // Technical tone warnings
  if (tone === 'technical') {
    if (companyCulture === 'startup' && industry !== 'technology') {
      warnings.push('💡 Tip: Consider adding enthusiasm and personality for startup culture');
    }
  }
  
  return warnings;
}

/**
 * Get recommended settings based on job information
 */
export function getRecommendedSettings(jobTitle, jobDescription, companyName) {
  const title = (jobTitle || '').toLowerCase();
  const description = (jobDescription || '').toLowerCase();
  const company = (companyName || '').toLowerCase();
  
  const recommendations = {
    tone: 'formal',
    industry: 'general',
    companyCulture: 'corporate',
    length: 'standard',
    writingStyle: 'hybrid'
  };
  
  // Detect industry from job title/description
  if (title.includes('software') || title.includes('developer') || title.includes('engineer') || 
      description.includes('programming') || description.includes('coding')) {
    recommendations.industry = 'technology';
    recommendations.tone = 'technical';
  }
  
  if (title.includes('designer') || title.includes('creative') || description.includes('design')) {
    recommendations.industry = 'creative';
    recommendations.tone = 'creative';
  }
  
  if (title.includes('finance') || title.includes('accountant') || title.includes('analyst')) {
    recommendations.industry = 'finance';
    recommendations.tone = 'analytical';
  }
  
  if (title.includes('marketing') || title.includes('brand') || title.includes('content')) {
    recommendations.industry = 'marketing';
    recommendations.tone = 'enthusiastic';
  }
  
  if (title.includes('sales') || title.includes('account executive')) {
    recommendations.industry = 'sales';
    recommendations.tone = 'enthusiastic';
  }
  
  // Detect company culture
  if (description.includes('startup') || description.includes('fast-paced') || 
      description.includes('entrepreneurial')) {
    recommendations.companyCulture = 'startup';
    if (recommendations.tone === 'formal') {
      recommendations.tone = 'enthusiastic';
    }
  }
  
  if (description.includes('remote') || description.includes('distributed team')) {
    recommendations.companyCulture = 'remote';
  }
  
  if (description.includes('nonprofit') || description.includes('mission-driven')) {
    recommendations.companyCulture = 'nonprofit';
  }
  
  if (title.includes('executive') || title.includes('director') || title.includes('vp') ||
      title.includes('chief') || title.includes('senior leadership')) {
    recommendations.tone = 'executive';
    recommendations.length = 'detailed';
  }
  
  return recommendations;
}

export default {
  TONE_OPTIONS,
  INDUSTRY_OPTIONS,
  COMPANY_CULTURE_OPTIONS,
  LENGTH_OPTIONS,
  WRITING_STYLE_OPTIONS,
  validateToneConsistency,
  getRecommendedSettings
};
