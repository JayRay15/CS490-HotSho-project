import express from "express";
import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { connectDB } from "./utils/db.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import pdfAnalysisRoutes from "./routes/pdfAnalysisRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js";
import salaryRoutes from "./routes/salaryRoutes.js";
import coverLetterTemplateRoutes from "./routes/coverLetterTemplateRoutes.js";
import coverLetterRoutes from "./routes/coverLetterRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import skillGapRoutes from "./routes/skillGapRoutes.js";
import jobMatchRoutes from "./routes/jobMatchRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import applicationStatusRoutes from "./routes/applicationStatusRoutes.js";
import followUpRoutes from "./routes/followUp.js";
import technicalPrepRoutes from "./routes/technicalPrepRoutes.js";
import writingPracticeRoutes from "./routes/writingPracticeRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import referralRoutes from "./routes/referralRoutes.js";
import networkingEventRoutes from "./routes/networkingEventRoutes.js";
import interviewCoachingRoutes from "./routes/interviewCoachingRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";
import interviewQuestionBankRoutes from "./routes/interviewQuestionBankRoutes.js";
import companyResearchRoutes from "./routes/companyResearchRoutes.js";
import mockInterviewRoutes from "./routes/mockInterviewRoutes.js";
import productivityRoutes from "./routes/productivityRoutes.js";
import interviewPredictionRoutes from "./routes/interviewPredictionRoutes.js";
import mentorRoutes from "./routes/mentorRoutes.js";
import externalAdvisorRoutes from "./routes/externalAdvisorRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import relationshipMaintenanceRoutes from "./routes/relationshipMaintenanceRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import marketIntelligenceRoutes from "./routes/marketIntelligenceRoutes.js";
import linkedinRoutes from "./routes/linkedinRoutes.js";
import performanceDashboardRoutes from "./routes/performanceDashboardRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import networkingCampaignRoutes from "./routes/networkingCampaignRoutes.js";
import accountabilityRoutes from "./routes/accountabilityRoutes.js";
import peerSupportRoutes from "./routes/peerSupportRoutes.js";
import applicationSuccessRoutes from "./routes/applicationSuccessRoutes.js";
import interviewPerformanceRoutes from "./routes/interviewPerformanceRoutes.js";
import predictiveAnalyticsRoutes from "./routes/predictiveAnalyticsRoutes.js";
import responseTimePredictionRoutes from "./routes/responseTimePredictionRoutes.js";
import competitiveAnalysisRoutes from "./routes/competitiveAnalysisRoutes.js";
import informationalInterviewRoutes from "./routes/informationalInterviewRoutes.js";
import jobLocationRoutes from "./routes/jobLocationRoutes.js";
import githubRoutes from "./routes/githubRoutes.js";
import careerSimulationRoutes from "./routes/careerSimulationRoutes.js";
import applicationTimingRoutes from "./routes/applicationTimingRoutes.js";
import apiMonitoringRoutes from "./routes/apiMonitoringRoutes.js";
import monitoringRoutes from "./routes/monitoringRoutes.js";
import followUpReminderRoutes from "./routes/followUpReminderRoutes.js";
import abTestRoutes from "./routes/abTestRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import gmailRoutes from "./routes/gmailRoutes.js";
import { getPublicProject } from "./controllers/profileController.js";
import { viewSharedReport } from "./controllers/reportController.js";
import { startDeadlineReminderSchedule } from "./utils/deadlineReminders.js";
import { startInterviewReminderSchedule } from "./utils/interviewReminders.js";
import { startApplicationScheduler, startFollowUpScheduler } from "./utils/applicationScheduler.js";
import { startStatusAutomationScheduler } from "./utils/statusAutomationScheduler.js";
import { startTimingScheduler } from "./utils/timingScheduler.js";
import { startReminderEmailScheduler } from "./utils/reminderEmailScheduler.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
// Monitoring and Logging imports
import logger from "./utils/logger.js";
import { initializeSentry, sentryErrorHandler, sentryRequestHandler } from "./utils/sentry.js";
import { requestLoggingMiddleware, apiPerformanceMiddleware } from "./middleware/requestLogging.js";
// Security middleware
import { sanitizeInput, helmetMiddleware } from "./middleware/securityMiddleware.js";
// Cleanup schedule no longer needed - accounts are deleted immediately
// import { startCleanupSchedule } from "./utils/cleanupDeletedUsers.js";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend root, not src/
dotenv.config({ path: join(__dirname, '..', '.env') });

// Initialize Sentry error tracking (if configured)
await initializeSentry();

// Connect to MongoDB before starting the server
await connectDB();
logger.info('MongoDB connected successfully');

// Note: Automatic cleanup schedule removed - accounts are now deleted immediately upon request
// No grace period or scheduled deletion needed

const app = express();

// ============================================================================
// MIDDLEWARE: Request tracking and logging (must be first)
// ============================================================================

// Sentry request handler (must be first middleware)
app.use(sentryRequestHandler());

// ============================================================================
// MIDDLEWARE: Security Headers (Helmet)
// ============================================================================
app.use(helmetMiddleware);

// Request logging and performance tracking
app.use(requestLoggingMiddleware);
app.use(apiPerformanceMiddleware);

// ============================================================================
// MIDDLEWARE: Performance optimizations
// ============================================================================

// Gzip/Brotli compression for all responses
// This reduces response sizes by 60-80% for text-based content
app.use(compression({
  // Compression level (1-9, higher = better compression but slower)
  level: 6,
  // Minimum size to compress (don't compress tiny responses)
  threshold: 1024,
  // Filter function to determine which responses to compress
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression's default filter (compresses text-based content)
    return compression.filter(req, res);
  },
}));

// ============================================================================
// MIDDLEWARE: Browser caching for static assets
// ============================================================================

// Custom cache control middleware for API responses
const cacheMiddleware = (req, res, next) => {
  // Don't cache API mutations
  if (req.method !== 'GET') {
    res.setHeader('Cache-Control', 'no-store');
    return next();
  }

  // Cache static monitoring data for 5 minutes
  if (req.path.startsWith('/api/monitoring')) {
    res.setHeader('Cache-Control', 'public, max-age=300');
    return next();
  }

  // Cache salary/market data for 1 hour (data doesn't change frequently)
  if (req.path.startsWith('/api/salary') || req.path.startsWith('/api/market-intelligence')) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return next();
  }

  // Default: no caching for user-specific data
  res.setHeader('Cache-Control', 'private, no-cache');
  next();
};

app.use(cacheMiddleware);

// ============================================================================
// MIDDLEWARE: Core Express configuration
// ============================================================================

// Configure CORS to allow requests from frontend
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  credentials: false
}));

// Increase JSON body size limit to handle PDF buffers (base64 encoded PDFs can be large)
// Default is 100kb, we need at least 15MB for PDF files (5MB PDF * 1.33 base64 overhead + other data)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ============================================================================
// MIDDLEWARE: Security - XSS Protection
// ============================================================================
// Sanitize all inputs to prevent XSS attacks
app.use(sanitizeInput);

// Serve uploaded files statically with aggressive caching
// These files are user uploads with unique names, so long cache is safe
app.use('/uploads', express.static(join(__dirname, '..', 'public', 'uploads'), {
  maxAge: '7d', // Cache for 7 days
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Set immutable for hashed assets
    if (path.includes('-') && /\.[a-f0-9]{8,}\./i.test(path)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  },
}));

// ============================================================================
// ROUTES: Monitoring endpoints (public, no auth required)
// ============================================================================
app.use("/api/monitoring", monitoringRoutes);

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/pdf-analysis", pdfAnalysisRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api", coverLetterTemplateRoutes);
app.use("/api", coverLetterRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/skill-gaps", skillGapRoutes);
app.use("/api/job-matches", jobMatchRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/status", applicationStatusRoutes);
app.use("/api/follow-ups", followUpRoutes);
app.use("/api/technical-prep", technicalPrepRoutes);
app.use("/api/writing-practice", writingPracticeRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/networking-events", networkingEventRoutes);
app.use("/api/interview-coaching", interviewCoachingRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/interview-question-bank", interviewQuestionBankRoutes);
app.use("/api/company-research", companyResearchRoutes);
app.use("/api/mock-interviews", mockInterviewRoutes);
app.use("/api/productivity", productivityRoutes);
app.use("/api/interview-prediction", interviewPredictionRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/external-advisors", externalAdvisorRoutes);
console.log('✅ External Advisor routes registered at /api/external-advisors');
app.use("/api/reports", reportRoutes);
console.log('✅ Reports routes registered at /api/reports');
app.use("/api/relationship-maintenance", relationshipMaintenanceRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/market-intelligence", marketIntelligenceRoutes);
app.use("/api/linkedin", linkedinRoutes);
app.use("/api/performance-dashboard", performanceDashboardRoutes);
app.use("/api/teams", teamRoutes);
console.log('✅ Team routes registered at /api/teams');
app.use("/api/networking-campaigns", networkingCampaignRoutes);
console.log('✅ Networking Campaign routes registered at /api/networking-campaigns');
app.use("/api/accountability", accountabilityRoutes);
console.log('✅ Accountability routes registered at /api/accountability');
app.use("/api/peer-support", peerSupportRoutes);
console.log('✅ Peer Support routes registered at /api/peer-support');
app.use("/api/application-success", applicationSuccessRoutes);
console.log('✅ Application Success routes registered at /api/application-success');
app.use("/api/interview-performance", interviewPerformanceRoutes);
app.use("/api/github", githubRoutes);
console.log('✅ GitHub routes registered at /api/github');
app.use("/api/predictive-analytics", predictiveAnalyticsRoutes);
app.use("/api/response-time-prediction", responseTimePredictionRoutes);
console.log('� Response Time Prediction routes mounted at /api/response-time-prediction');
console.log(" Predictive Analytics routes mounted at /api/predictive-analytics");
console.log(' Interview Performance routes registered at /api/interview-performance');
app.use("/api/competitive-analysis", competitiveAnalysisRoutes);
console.log('✅ Competitive Analysis routes registered at /api/competitive-analysis');
app.use("/api/informational-interviews", informationalInterviewRoutes);
console.log('✅ Informational Interview routes registered at /api/informational-interviews');
app.use("/api/job-locations", jobLocationRoutes);
console.log('✅ Job Location Map routes registered at /api/job-locations');
app.use("/api/career-simulation", careerSimulationRoutes);
console.log('✅ Career Simulation routes registered at /api/career-simulation');
app.use("/api/application-timing", applicationTimingRoutes);
console.log('✅ Application Timing routes registered at /api/application-timing');
app.use("/api/api-monitoring", apiMonitoringRoutes);
console.log('✅ API Monitoring routes registered at /api/api-monitoring');
app.use("/api/follow-up-reminders", followUpReminderRoutes);
console.log('✅ Follow-Up Reminder routes registered at /api/follow-up-reminders');
app.use("/api/ab-tests", abTestRoutes);
console.log('✅ A/B Test routes registered at /api/ab-tests');
app.use("/api/offers", offerRoutes);
console.log('✅ Offer Comparison routes registered at /api/offers');
app.use("/api/gmail", gmailRoutes);
console.log('✅ Gmail Integration routes registered at /api/gmail');

// Mount profile routes under /api/profile (existing) and also under /api/users
// so frontend requests to /api/users/... (used elsewhere in the app) resolve correctly.
app.use("/api/profile", profileRoutes);
app.use("/api/users", profileRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// Public project page (shareable link)
app.get('/api/projects/:projectId', getPublicProject);

// Public shared report endpoint (no auth required)
app.get('/api/public/reports/:token', viewSharedReport);

// 404 handler - must come after all routes
app.use(notFoundHandler);

// Sentry error handler - must be before other error handlers
app.use(sentryErrorHandler());

// Global error handler - must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server started successfully`, { port: PORT, environment: process.env.NODE_ENV || 'development' });
  console.log(`🚀 Server running on port ${PORT}`);

  // Start daily deadline reminders if enabled via env flag
  try {
    startDeadlineReminderSchedule();
  } catch (err) {
    logger.error('Failed to start deadline reminder schedule', { error: err?.message || err });
  }
  // Start interview reminders if enabled via env flag
  try {
    startInterviewReminderSchedule();
  } catch (err) {
    logger.error('Failed to start interview reminder schedule', { error: err?.message || err });
  }
  // Start application automation schedulers
  try {
    startApplicationScheduler();
    startFollowUpScheduler();
  } catch (err) {
    logger.error('Failed to start application schedulers', { error: err?.message || err });
  }
  // Start status automation scheduler
  try {
    startStatusAutomationScheduler();
  } catch (err) {
    logger.error('Failed to start status automation scheduler', { error: err?.message || err });
  }
  // Start timing optimizer scheduler
  try {
    startTimingScheduler();
  } catch (err) {
    console.error('Failed to start timing scheduler:', err?.message || err);
  }
  // Start reminder email scheduler
  try {
    startReminderEmailScheduler();
  } catch (err) {
    console.error('Failed to start reminder email scheduler:', err?.message || err);
  }
});

