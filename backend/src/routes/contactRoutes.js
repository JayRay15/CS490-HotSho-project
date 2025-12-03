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
  linkContactToJob,
  batchCreateContacts,
  generateReferenceRequest,
  discoverContactsController,
  discoverExternalContactsController,
  getDiscoveryFiltersController,
  getSuggestedContactsController,
  trackDiscoverySuccess,
  findConnectionPaths
} from '../controllers/contactController.js';

const router = express.Router();

// All routes require authentication
router.use(checkJwt);

// GET /api/contacts/stats - Get contact statistics
router.get('/stats', getContactStats);

// GET /api/contacts/follow-ups/upcoming - Get upcoming follow-ups
router.get('/follow-ups/upcoming', getUpcomingFollowUps);

// Discovery routes (must be before /:id routes)
// GET /api/contacts/discover - Discover new contacts (mock + external)
router.get('/discover', discoverContactsController);

// GET /api/contacts/discover/external - Discover from external APIs only (OpenAlex, Wikidata, Wikipedia)
router.get('/discover/external', discoverExternalContactsController);

// GET /api/contacts/discover/filters - Get discovery filter options
router.get('/discover/filters', getDiscoveryFiltersController);

// GET /api/contacts/discover/suggestions - Get personalized suggestions
router.get('/discover/suggestions', getSuggestedContactsController);

// POST /api/contacts/discover/track - Track discovery actions
router.post('/discover/track', trackDiscoverySuccess);

// GET /api/contacts/connection-paths - Find connection paths to a target
router.get('/connection-paths', findConnectionPaths);

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

// POST /api/contacts/batch - Batch create contacts
router.post('/batch', batchCreateContacts);

// POST /api/contacts/reference-request - Generate reference request email
router.post('/reference-request', generateReferenceRequest);

export default router;
