import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import {
  createCareerSimulation,
  getCareerSimulation,
  getUserSimulations,
  getPathDetails,
  comparePaths,
  deleteCareerSimulation
} from '../controllers/careerSimulationController.js';

const router = express.Router();

// All routes require authentication
router.use(checkJwt);

/**
 * UC-128: Career Path Simulation Routes
 */

// POST /api/career-simulation - Create new simulation
router.post('/', createCareerSimulation);

// GET /api/career-simulation - Get all user's simulations
router.get('/', getUserSimulations);

// GET /api/career-simulation/:id - Get specific simulation
router.get('/:id', getCareerSimulation);

// GET /api/career-simulation/:id/path/:pathId - Get detailed path info
router.get('/:id/path/:pathId', getPathDetails);

// POST /api/career-simulation/:id/compare - Compare multiple paths
router.post('/:id/compare', comparePaths);

// DELETE /api/career-simulation/:id - Delete simulation
router.delete('/:id', deleteCareerSimulation);

export default router;
