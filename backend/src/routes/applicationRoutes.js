import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import {
  // Application Package Management
  generateApplicationPackage,
  getApplicationPackages,
  updateApplicationPackage,
  deleteApplicationPackage,
  
  // Application Package Quality Scoring (UC-122)
  scoreApplicationPackage,
  
  // Application Scheduling
  scheduleApplication,
  getScheduledApplications,
  
  // Automation Rules
  createAutomationRule,
  getAutomationRules,
  updateAutomationRule,
  deleteAutomationRule,
  
  // Application Templates
  createApplicationTemplate,
  getApplicationTemplates,
  updateApplicationTemplate,
  deleteApplicationTemplate,
  
  // Bulk Operations
  bulkApply,
  
  // Application Checklists
  createApplicationChecklist,
  getApplicationChecklist,
  updateChecklistItem,
  getAllChecklists
} from '../controllers/applicationAutomationController.js';

const router = express.Router();

// All routes require authentication
router.use(checkJwt);

// ===============================================
// Application Package Routes
// ===============================================
router.post('/packages', generateApplicationPackage);
router.get('/packages', getApplicationPackages);
router.put('/packages/:packageId', updateApplicationPackage);
router.delete('/packages/:packageId', deleteApplicationPackage);

// ===============================================
// Application Package Quality Scoring (UC-122)
// ===============================================
router.post('/packages/score', scoreApplicationPackage);

// ===============================================
// Application Scheduling Routes
// ===============================================
router.post('/schedule', scheduleApplication);
router.get('/scheduled', getScheduledApplications);

// ===============================================
// Automation Rules Routes
// ===============================================
router.post('/automation/rules', createAutomationRule);
router.get('/automation/rules', getAutomationRules);
router.put('/automation/rules/:ruleId', updateAutomationRule);
router.delete('/automation/rules/:ruleId', deleteAutomationRule);

// ===============================================
// Application Templates Routes
// ===============================================
router.post('/templates', createApplicationTemplate);
router.get('/templates', getApplicationTemplates);
router.put('/templates/:templateId', updateApplicationTemplate);
router.delete('/templates/:templateId', deleteApplicationTemplate);

// ===============================================
// Bulk Operations Routes
// ===============================================
router.post('/bulk-apply', bulkApply);

// ===============================================
// Application Checklists Routes
// ===============================================
router.post('/checklists', createApplicationChecklist);
router.get('/checklists', getAllChecklists);
router.get('/checklists/:jobId', getApplicationChecklist);
router.put('/checklists/:jobId/items/:itemId', updateChecklistItem);

export default router;
