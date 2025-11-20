import express from "express";
import cors from "cors";
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
import contactRoutes from "./routes/contactRoutes.js";
import { getPublicProject } from "./controllers/profileController.js";
import { startDeadlineReminderSchedule } from "./utils/deadlineReminders.js";
import { startInterviewReminderSchedule } from "./utils/interviewReminders.js";
import { startApplicationScheduler, startFollowUpScheduler } from "./utils/applicationScheduler.js";
import { startStatusAutomationScheduler } from "./utils/statusAutomationScheduler.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
// Cleanup schedule no longer needed - accounts are deleted immediately
// import { startCleanupSchedule } from "./utils/cleanupDeletedUsers.js";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend root, not src/
dotenv.config({ path: join(__dirname, '..', '.env') });

// Connect to MongoDB before starting the server
await connectDB();

// Note: Automatic cleanup schedule removed - accounts are now deleted immediately upon request
// No grace period or scheduled deletion needed

const app = express();

// Configure CORS to allow requests from frontend
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  credentials: false
}));

// Increase JSON body size limit to handle PDF buffers (base64 encoded PDFs can be large)
// Default is 100kb, we need at least 15MB for PDF files (5MB PDF * 1.33 base64 overhead + other data)
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/interviews", interviewRoutes);
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
app.use("/api/contacts", contactRoutes);
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

// 404 handler - must come after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  // Start daily deadline reminders if enabled via env flag
  try {
    startDeadlineReminderSchedule();
  } catch (err) {
    console.error('Failed to start deadline reminder schedule:', err?.message || err);
  }
  // Start interview reminders if enabled via env flag
  try {
    startInterviewReminderSchedule();
  } catch (err) {
    console.error('Failed to start interview reminder schedule:', err?.message || err);
  }
  // Start application automation schedulers
  try {
    startApplicationScheduler();
    startFollowUpScheduler();
  } catch (err) {
    console.error('Failed to start application schedulers:', err?.message || err);
  }
  // Start status automation scheduler
  try {
    startStatusAutomationScheduler();
  } catch (err) {
    console.error('Failed to start status automation scheduler:', err?.message || err);
  }
});
