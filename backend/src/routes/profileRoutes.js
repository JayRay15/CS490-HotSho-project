import express from "express";
import { checkJwt } from "../middleware/checkJwt.js";
import {
  addEmployment,
  updateEmployment,
  deleteEmployment,
  addSkill,
  updateSkill,
  deleteSkill,
  reorderSkills,
  addEducation,
  updateEducation,
  deleteEducation,
  addProject,
  updateProject,
  deleteProject
} from "../controllers/profileController.js";

const router = express.Router();

// Employment routes
router.post("/employment", checkJwt, addEmployment);
router.put("/employment/:employmentId", checkJwt, updateEmployment);
router.delete("/employment/:employmentId", checkJwt, deleteEmployment);

// Skills routes
router.post("/skills", checkJwt, addSkill);
router.put("/skills/reorder", checkJwt, reorderSkills);
router.put("/skills/:skillId", checkJwt, updateSkill);
router.delete("/skills/:skillId", checkJwt, deleteSkill);

// Education routes
router.post("/education", checkJwt, addEducation);
router.put("/education/:educationId", checkJwt, updateEducation);
router.delete("/education/:educationId", checkJwt, deleteEducation);

// Projects routes
router.post("/projects", checkJwt, addProject);
router.put("/projects/:projectId", checkJwt, updateProject);
router.delete("/projects/:projectId", checkJwt, deleteProject);

// Certifications routes
import {
  addCertification,
  updateCertification,
  deleteCertification
} from "../controllers/profileController.js";

router.post("/certifications", checkJwt, addCertification);
router.put("/certifications/:certificationId", checkJwt, updateCertification);
router.delete("/certifications/:certificationId", checkJwt, deleteCertification);

export default router;
