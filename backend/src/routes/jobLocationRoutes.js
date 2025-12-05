/**
 * Job Location Routes
 * Routes for job location mapping, geocoding, and commute calculations
 */

import { Router } from "express";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import {
  getJobsWithLocations,
  geocodeJobLocation,
  geocodeAllJobs,
  setHomeLocation,
  getHomeLocation,
  compareLocations,
  getCommuteDetails,
} from "../controllers/jobLocationController.js";

const router = Router();

// Apply Clerk authentication to all routes
router.use(clerkMiddleware());
router.use(requireAuth());

/**
 * @route   GET /api/job-locations
 * @desc    Get all jobs with their geocoded locations for map display
 * @access  Private
 * @query   workMode - Filter by work mode (Remote, Hybrid, On-site)
 * @query   maxDistance - Filter by maximum distance from home (km)
 * @query   status - Filter by job status
 */
router.get("/", getJobsWithLocations);

/**
 * @route   POST /api/job-locations/:jobId/geocode
 * @desc    Geocode a specific job's location
 * @access  Private
 * @params  jobId - The job ID to geocode
 */
router.post("/:jobId/geocode", geocodeJobLocation);

/**
 * @route   POST /api/job-locations/geocode-all
 * @desc    Batch geocode all jobs without coordinates
 * @access  Private
 */
router.post("/geocode-all", geocodeAllJobs);

/**
 * @route   PUT /api/job-locations/home-location
 * @desc    Set user's home location for commute calculations
 * @access  Private
 * @body    address - The home address to geocode
 */
router.put("/home-location", setHomeLocation);

/**
 * @route   GET /api/job-locations/home-location
 * @desc    Get user's home location
 * @access  Private
 */
router.get("/home-location", getHomeLocation);

/**
 * @route   POST /api/job-locations/compare
 * @desc    Compare multiple job locations (side-by-side comparison)
 * @access  Private
 * @body    jobIds - Array of job IDs to compare
 */
router.post("/compare", compareLocations);

/**
 * @route   GET /api/job-locations/:jobId/commute
 * @desc    Get detailed commute information for a specific job
 * @access  Private
 * @params  jobId - The job ID
 */
router.get("/:jobId/commute", getCommuteDetails);

export default router;
