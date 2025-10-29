import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./utils/db.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { startCleanupSchedule } from "./utils/cleanupDeletedUsers.js";

dotenv.config();

// Connect to MongoDB before starting the server
await connectDB();

// Start the automatic cleanup schedule for deleted accounts
startCleanupSchedule();

const app = express();

// Configure CORS to allow requests from frontend
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  credentials: false
}));

app.use(express.json());

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
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

// 404 handler - must come after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
