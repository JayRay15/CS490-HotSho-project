import api, { retryRequest } from "./axios";

/**
 * UC-127: Offer Evaluation & Comparison Tool API
 * 
 * Frontend API service for comparing job offers including:
 * - Side-by-side offer comparison matrix
 * - Total compensation calculation with benefits valuation
 * - Cost of living adjustments by location
 * - Non-financial factor scoring (culture, growth, work-life balance)
 * - Weighted score calculations
 * - Negotiation recommendations
 * - Scenario analysis (what-if calculations)
 * - Archive declined offers with reasons
 */

/**
 * Compare multiple job offers side-by-side
 * @param {Object[]} offers - Array of offer objects to compare
 * @param {Object} weights - Optional custom weights for scoring factors
 * @returns {Promise} Comparison results with weighted scores
 */
export const compareOffers = (offers, weights = null) =>
  retryRequest(() => api.post('/api/offers/compare', { offers, weights }));

/**
 * Analyze negotiation scenarios (what-if calculations)
 * @param {Object} offer - Base offer to analyze
 * @param {Object[]} scenarios - Optional custom scenarios to analyze
 * @returns {Promise} Scenario analysis results
 */
export const analyzeScenarios = (offer, scenarios = null) =>
  retryRequest(() => api.post('/api/offers/scenario-analysis', { offer, scenarios }));

/**
 * Get cost of living comparison between locations
 * @param {string[]} locations - Array of location names to compare
 * @param {number} baseSalary - Base salary for comparison
 * @returns {Promise} Cost of living comparison data
 */
export const getCostOfLivingComparison = (locations, baseSalary = 100000) => {
  const params = new URLSearchParams();
  if (locations && locations.length > 0) {
    params.append('locations', locations.join(','));
  }
  params.append('baseSalary', baseSalary.toString());
  
  return retryRequest(() => api.get(`/api/offers/cost-of-living?${params.toString()}`));
};

/**
 * Archive a declined offer with reason
 * @param {Object} offer - Offer data to archive
 * @param {string} declineReason - Reason for declining
 * @param {string} declineNotes - Optional additional notes
 * @param {boolean} futureConsideration - Whether to consider in future
 * @returns {Promise} Archived offer confirmation
 */
export const archiveDeclinedOffer = (offer, declineReason, declineNotes = '', futureConsideration = false) =>
  retryRequest(() => api.post('/api/offers/archive', { 
    offer, 
    declineReason, 
    declineNotes, 
    futureConsideration 
  }));

/**
 * Get all archived/declined offers
 * @returns {Promise} List of archived offers with insights
 */
export const getArchivedOffers = () =>
  retryRequest(() => api.get('/api/offers/archived'));

/**
 * Calculate total benefits value for an offer
 * @param {Object} benefits - Benefits object
 * @param {number} baseSalary - Base salary for percentage-based calculations
 * @returns {Promise} Detailed benefits breakdown and total value
 */
export const calculateBenefitsValue = (benefits, baseSalary) =>
  retryRequest(() => api.post('/api/offers/calculate-benefits', { benefits, baseSalary }));

/**
 * Default decline reasons for UI dropdown
 */
export const DECLINE_REASONS = [
  'Compensation Too Low',
  'Better Offer Elsewhere',
  'Location/Commute',
  'Remote Work Policy',
  'Company Culture Concerns',
  'Limited Growth Opportunities',
  'Work-Life Balance Concerns',
  'Benefits Not Competitive',
  'Job Role Mismatch',
  'Company Stability Concerns',
  'Personal Reasons',
  'Timing Issues',
  'Counter Offer Accepted',
  'Other'
];

/**
 * Default weights for scoring factors
 */
export const DEFAULT_WEIGHTS = {
  totalCompensation: 0.35,
  baseSalary: 0.15,
  benefits: 0.15,
  culturefit: 0.10,
  growthOpportunities: 0.10,
  workLifeBalance: 0.10,
  location: 0.05
};

/**
 * Remote work options
 */
export const REMOTE_WORK_OPTIONS = [
  { value: 'Full', label: 'Fully Remote' },
  { value: 'Hybrid', label: 'Hybrid (Part Remote)' },
  { value: 'None', label: 'On-site Only' }
];

/**
 * Health insurance quality options
 */
export const HEALTH_INSURANCE_QUALITY = [
  { value: 'excellent', label: 'Excellent (Premium PPO)' },
  { value: 'good', label: 'Good (Standard PPO/HMO)' },
  { value: 'basic', label: 'Basic (High Deductible)' }
];
