import express from "express";
import {
    getCompanyInfo,
    getCompanyNews,
    exportNewsSummary,
    getComprehensiveResearch,
    exportResearchReport
} from "../controllers/companyController.js";

const router = express.Router();

// Note: These endpoints don't require authentication since they fetch public company data
// GET /api/companies/info - Fetch company information
router.get("/info", getCompanyInfo);

// GET /api/companies/news - Fetch company news
router.get("/news", getCompanyNews);

// GET /api/companies/news/export - Export news summary for applications
router.get("/news/export", exportNewsSummary);

// UC-064: GET /api/companies/research - Conduct comprehensive company research
router.get("/research", getComprehensiveResearch);

// UC-064: GET /api/companies/research/export - Export comprehensive research report
router.get("/research/export", exportResearchReport);

export default router;
