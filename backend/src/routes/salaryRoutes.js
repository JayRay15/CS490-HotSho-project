import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
  getSalaryResearch,
  compareSalaries,
  getSalaryBenchmarks,
  exportSalaryReport
} from "../controllers/salaryController.js";

const router = express.Router();

// UC-067: GET /api/salary/benchmarks - Get general salary benchmarks
router.get("/benchmarks", checkJwt, getSalaryBenchmarks);

// UC-067: GET /api/salary/compare - Compare salaries across multiple jobs
router.get("/compare", checkJwt, compareSalaries);

// UC-067: GET /api/salary/research/:jobId - Get salary research for specific job
router.get("/research/:jobId", checkJwt, getSalaryResearch);

// UC-067: POST /api/salary/export - Export salary research report
router.post("/export", checkJwt, exportSalaryReport);

export default router;
