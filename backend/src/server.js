import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./utils/db.js";
import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

dotenv.config();

// Set Auth0 environment variables if not already set
if (!process.env.AUTH0_AUDIENCE) {
  process.env.AUTH0_AUDIENCE = 'https://jobSeekerATS-API';
}
if (!process.env.AUTH0_DOMAIN) {
  process.env.AUTH0_DOMAIN = 'dev-572ox7lten831zkg.us.auth0.com';
}

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
