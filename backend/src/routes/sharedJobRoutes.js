import express from 'express';
import { clerkMiddleware } from '@clerk/express';
import {
  shareJobWithTeam,
  getSharedJobs,
  getSharedJob,
  addComment,
  updateComment,
  deleteComment,
  addReaction,
  togglePin,
  archiveSharedJob
} from '../controllers/sharedJobController.js';
import { verifyTeamMembership, verifyTeamActive } from '../middleware/teamMiddleware.js';

const router = express.Router();

// Apply Clerk authentication
router.use(clerkMiddleware());

/**
 * @route   POST /api/teams/:teamId/shared-jobs
 * @desc    Share a job with the team
 * @access  Protected (team members)
 */
router.post('/:teamId/shared-jobs', shareJobWithTeam);

/**
 * @route   GET /api/teams/:teamId/shared-jobs
 * @desc    Get all shared jobs for a team
 * @access  Protected (team members)
 */
router.get('/:teamId/shared-jobs', getSharedJobs);

/**
 * @route   GET /api/teams/:teamId/shared-jobs/:sharedJobId
 * @desc    Get a single shared job
 * @access  Protected (team members)
 */
router.get('/:teamId/shared-jobs/:sharedJobId', getSharedJob);

/**
 * @route   POST /api/teams/:teamId/shared-jobs/:sharedJobId/comments
 * @desc    Add a comment to a shared job
 * @access  Protected (team members)
 */
router.post('/:teamId/shared-jobs/:sharedJobId/comments', addComment);

/**
 * @route   PUT /api/teams/:teamId/shared-jobs/:sharedJobId/comments/:commentId
 * @desc    Update a comment
 * @access  Protected (comment author)
 */
router.put('/:teamId/shared-jobs/:sharedJobId/comments/:commentId', updateComment);

/**
 * @route   DELETE /api/teams/:teamId/shared-jobs/:sharedJobId/comments/:commentId
 * @desc    Delete a comment
 * @access  Protected (comment author or admin)
 */
router.delete('/:teamId/shared-jobs/:sharedJobId/comments/:commentId', deleteComment);

/**
 * @route   POST /api/teams/:teamId/shared-jobs/:sharedJobId/comments/:commentId/reactions
 * @desc    Add reaction to a comment
 * @access  Protected (team members)
 */
router.post('/:teamId/shared-jobs/:sharedJobId/comments/:commentId/reactions', addReaction);

/**
 * @route   PUT /api/teams/:teamId/shared-jobs/:sharedJobId/pin
 * @desc    Toggle pin status on shared job
 * @access  Protected (admin/mentor/coach)
 */
router.put('/:teamId/shared-jobs/:sharedJobId/pin', togglePin);

/**
 * @route   PUT /api/teams/:teamId/shared-jobs/:sharedJobId/archive
 * @desc    Archive a shared job
 * @access  Protected (sharer or admin)
 */
router.put('/:teamId/shared-jobs/:sharedJobId/archive', archiveSharedJob);

export default router;
