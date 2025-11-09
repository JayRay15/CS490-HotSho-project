import express from "express";
import { getCompanyInfo, getCompanyNews } from "../controllers/companyController.js";

const router = express.Router();

// Note: These endpoints don't require authentication since they fetch public company data
// GET /api/companies/info - Fetch company information
router.get("/info", getCompanyInfo);

// GET /api/companies/news - Fetch company news
router.get("/news", getCompanyNews);

export default router;
