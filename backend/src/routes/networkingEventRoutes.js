import express from 'express';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import {
  getNetworkingEvents,
  getNetworkingEventById,
  createNetworkingEvent,
  updateNetworkingEvent,
  deleteNetworkingEvent,
  getNetworkingStats,
  addConnection,
  updateConnection,
  deleteConnection,
  discoverEvents,
  getCategories
} from '../controllers/networkingEventController.js';

const router = express.Router();

// Apply Clerk middleware
router.use(clerkMiddleware());

// All routes require authentication
router.use(requireAuth());

// Main routes
router.get('/', getNetworkingEvents);
router.get('/stats', getNetworkingStats);
router.get('/discover', discoverEvents);
router.get('/categories', getCategories);
router.get('/:id', getNetworkingEventById);
router.post('/', createNetworkingEvent);
router.put('/:id', updateNetworkingEvent);
router.delete('/:id', deleteNetworkingEvent);

// Connection management routes
router.post('/:id/connections', addConnection);
router.put('/:id/connections/:connectionId', updateConnection);
router.delete('/:id/connections/:connectionId', deleteConnection);

export default router;
