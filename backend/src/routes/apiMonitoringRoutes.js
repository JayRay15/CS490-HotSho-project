import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import {
    getDashboard,
    getServiceUsage,
    getErrorLogs,
    resolveError,
    getAlerts,
    acknowledgeAlert,
    getQuotaStatus,
    getPerformanceMetrics,
    getWeeklyReport,
    getServices
} from '../controllers/apiMonitoringController.js';

const router = express.Router();

/**
 * UC-117: API Rate Limiting and Error Handling Dashboard Routes
 * 
 * All routes require authentication
 */

// Apply JWT authentication to all routes
router.use(checkJwt);

// ============================================================================
// Dashboard & Overview
// ============================================================================

/**
 * @route   GET /api/api-monitoring/dashboard
 * @desc    Get comprehensive API monitoring dashboard
 * @access  Protected (Admin)
 */
router.get('/dashboard', getDashboard);

/**
 * @route   GET /api/api-monitoring/services
 * @desc    Get list of all monitored services with their configurations
 * @access  Protected (Admin)
 */
router.get('/services', getServices);

// ============================================================================
// Usage Statistics
// ============================================================================

/**
 * @route   GET /api/api-monitoring/usage/:service
 * @desc    Get detailed usage statistics for a specific service
 * @access  Protected (Admin)
 * @params  service - Service identifier (gemini, eventbrite, bls, etc.)
 * @query   days - Number of days to fetch (default: 7)
 */
router.get('/usage/:service', getServiceUsage);

// ============================================================================
// Quota Management
// ============================================================================

/**
 * @route   GET /api/api-monitoring/quotas
 * @desc    Get quota status for all services with warnings
 * @access  Protected (Admin)
 */
router.get('/quotas', getQuotaStatus);

// ============================================================================
// Error Logs
// ============================================================================

/**
 * @route   GET /api/api-monitoring/errors
 * @desc    Get all error logs with filtering and pagination
 * @access  Protected (Admin)
 * @query   service - Filter by service
 * @query   startDate - Filter from date (ISO string)
 * @query   endDate - Filter to date (ISO string)
 * @query   resolved - Filter by resolved status (true/false)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 50)
 */
router.get('/errors', getErrorLogs);

/**
 * @route   PUT /api/api-monitoring/errors/:errorId/resolve
 * @desc    Mark an error as resolved
 * @access  Protected (Admin)
 * @body    { notes: string } - Optional resolution notes
 */
router.put('/errors/:errorId/resolve', resolveError);

// ============================================================================
// Alerts
// ============================================================================

/**
 * @route   GET /api/api-monitoring/alerts
 * @desc    Get all alerts with filtering
 * @access  Protected (Admin)
 * @query   service - Filter by service
 * @query   alertType - Filter by alert type
 * @query   severity - Filter by severity (low/medium/high/critical)
 * @query   acknowledged - Filter by acknowledged status (true/false)
 * @query   page - Page number (default: 1)
 * @query   limit - Items per page (default: 50)
 */
router.get('/alerts', getAlerts);

/**
 * @route   PUT /api/api-monitoring/alerts/:alertId/acknowledge
 * @desc    Acknowledge an alert
 * @access  Protected (Admin)
 */
router.put('/alerts/:alertId/acknowledge', acknowledgeAlert);

// ============================================================================
// Performance Metrics
// ============================================================================

/**
 * @route   GET /api/api-monitoring/performance
 * @desc    Get API response time analytics
 * @access  Protected (Admin)
 * @query   days - Number of days to analyze (default: 7)
 */
router.get('/performance', getPerformanceMetrics);

// ============================================================================
// Reports
// ============================================================================

/**
 * @route   GET /api/api-monitoring/reports/weekly
 * @desc    Generate and return weekly API usage report
 * @access  Protected (Admin)
 */
router.get('/reports/weekly', getWeeklyReport);

export default router;
