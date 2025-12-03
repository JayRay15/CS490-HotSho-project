import express from 'express';
import { checkJwt } from '../middleware/checkJwt.js';
import {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  addVersion,
  getVersion,
  restoreVersion,
  deleteDocument,
  permanentlyDeleteDocument,
  linkToJob,
  unlinkFromJob,
  getDocumentsByJob,
  importExistingDocuments,
  getDocumentStats
} from '../controllers/documentController.js';

const router = express.Router();

// Apply JWT authentication to all routes
router.use(checkJwt);

// ============================================================================
// Document Management Routes
// ============================================================================

/**
 * @route   GET /api/documents/stats
 * @desc    Get document statistics for the user
 * @access  Protected
 */
router.get('/stats', getDocumentStats);

/**
 * @route   POST /api/documents/import
 * @desc    Import existing resumes and cover letters into document system
 * @access  Protected
 */
router.post('/import', importExistingDocuments);

/**
 * @route   GET /api/documents/job/:jobId
 * @desc    Get all documents linked to a specific job
 * @access  Protected
 */
router.get('/job/:jobId', getDocumentsByJob);

/**
 * @route   GET /api/documents
 * @desc    Get all documents for the user with optional filters
 * @access  Protected
 * @query   { category?, status?, search?, tags?, sortBy?, sortOrder? }
 */
router.get('/', getDocuments);

/**
 * @route   GET /api/documents/:id
 * @desc    Get a single document with full version history
 * @access  Protected
 */
router.get('/:id', getDocumentById);

/**
 * @route   POST /api/documents
 * @desc    Create a new document
 * @access  Protected
 * @body    { name, description?, category, tags?, fileName, fileSize?, fileData?, mimeType?, linkedJobs?, notes? }
 */
router.post('/', createDocument);

/**
 * @route   PUT /api/documents/:id
 * @desc    Update document metadata
 * @access  Protected
 * @body    { name?, description?, category?, tags?, linkedJobs?, isFavorite?, status? }
 */
router.put('/:id', updateDocument);

/**
 * @route   POST /api/documents/:id/versions
 * @desc    Add a new version to the document
 * @access  Protected
 * @body    { fileName, fileSize?, fileData?, mimeType?, notes? }
 */
router.post('/:id/versions', addVersion);

/**
 * @route   GET /api/documents/:id/versions/:versionNumber
 * @desc    Get a specific version of a document
 * @access  Protected
 */
router.get('/:id/versions/:versionNumber', getVersion);

/**
 * @route   POST /api/documents/:id/versions/:versionNumber/restore
 * @desc    Restore a specific version as the current version
 * @access  Protected
 */
router.post('/:id/versions/:versionNumber/restore', restoreVersion);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Soft delete a document
 * @access  Protected
 */
router.delete('/:id', deleteDocument);

/**
 * @route   DELETE /api/documents/:id/permanent
 * @desc    Permanently delete a document
 * @access  Protected
 */
router.delete('/:id/permanent', permanentlyDeleteDocument);

/**
 * @route   POST /api/documents/:id/link-job
 * @desc    Link document to a job
 * @access  Protected
 * @body    { jobId }
 */
router.post('/:id/link-job', linkToJob);

/**
 * @route   DELETE /api/documents/:id/link-job/:jobId
 * @desc    Unlink document from a job
 * @access  Protected
 */
router.delete('/:id/link-job/:jobId', unlinkFromJob);

export default router;
