import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  addInteraction,
  getUpcomingFollowUps,
  getContactStats,
  linkContactToJob
} from '../controllers/contactController.js';

const router = express.Router();

// All routes require authentication
router.use(checkJwt);

// GET /api/contacts/stats - Get contact statistics
router.get('/stats', getContactStats);

// GET /api/contacts/follow-ups/upcoming - Get upcoming follow-ups
router.get('/follow-ups/upcoming', getUpcomingFollowUps);

// GET /api/contacts - Get all contacts
router.get('/', getContacts);

// GET /api/contacts/:id - Get single contact
router.get('/:id', getContactById);

// POST /api/contacts - Create new contact
router.post('/', createContact);

// PUT /api/contacts/:id - Update contact
router.put('/:id', updateContact);

// DELETE /api/contacts/:id - Delete contact
router.delete('/:id', deleteContact);

// POST /api/contacts/:id/interactions - Add interaction to contact
router.post('/:id/interactions', addInteraction);

// POST /api/contacts/:id/link-job/:jobId - Link contact to job
router.post('/:id/link-job/:jobId', linkContactToJob);

export default router;
