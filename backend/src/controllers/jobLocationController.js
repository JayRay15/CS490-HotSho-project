/**
 * Job Location Controller
 * Handles job location mapping, geocoding, and commute calculations
 */

import { Job } from "../models/Job.js";
import { User } from "../models/User.js";
import {
  geocodeLocation,
  calculateCommuteDetails,
  compareJobLocations,
  batchGeocode,
} from "../utils/geocodingService.js";

/**
 * Get all jobs with their geocoded locations for map display
 * GET /api/job-locations
 */
export const getJobsWithLocations = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Get query parameters for filtering
    const { workMode, maxDistance, status } = req.query;

    // Build query
    const query = { userId };

    if (workMode) {
      query.workMode = workMode;
    }

    if (status) {
      query.status = status;
    }

    // Fetch jobs
    const jobs = await Job.find(query)
      .select(
        "title company location coordinates geocodedLocation workMode status salary url createdAt"
      )
      .sort({ createdAt: -1 });

    // Get user's home location for commute calculations
    const user = await User.findOne({ auth0Id: userId }).select("homeLocation");

    // Process jobs and add commute details if home location exists
    let jobsWithCommute = jobs.map((job) => {
      const jobObj = job.toObject();

      if (user?.homeLocation?.coordinates && job.coordinates?.lat) {
        jobObj.commuteDetails = calculateCommuteDetails(
          user.homeLocation.coordinates,
          job.coordinates
        );
      }

      return jobObj;
    });

    // Filter by max distance if specified
    if (maxDistance && user?.homeLocation?.coordinates) {
      const maxDistanceNum = parseFloat(maxDistance);
      jobsWithCommute = jobsWithCommute.filter((job) => {
        if (!job.commuteDetails) return true; // Keep jobs without location data
        return job.commuteDetails.distance.km <= maxDistanceNum;
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        jobs: jobsWithCommute,
        homeLocation: user?.homeLocation || null,
        totalCount: jobsWithCommute.length,
      },
    });
  } catch (error) {
    console.error("Error fetching job locations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch job locations",
      error: error.message,
    });
  }
};

/**
 * Geocode a job's location
 * POST /api/job-locations/:jobId/geocode
 */
export const geocodeJobLocation = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;
    const { jobId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const job = await Job.findOne({ _id: jobId, userId });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (!job.location) {
      return res.status(400).json({
        success: false,
        message: "Job has no location to geocode",
      });
    }

    // Geocode the location
    const geocodeResult = await geocodeLocation(job.location);

    if (!geocodeResult) {
      return res.status(400).json({
        success: false,
        message: "Could not geocode location. Please check the address.",
      });
    }

    // Update job with geocoded data
    job.coordinates = geocodeResult.coordinates;
    job.geocodedLocation = {
      displayName: geocodeResult.displayName,
      city: geocodeResult.addressComponents?.city,
      state: geocodeResult.addressComponents?.state,
      country: geocodeResult.addressComponents?.country,
      postalCode: geocodeResult.addressComponents?.postalCode,
      timezone: geocodeResult.timezone,
      geocodedAt: new Date(),
    };

    await job.save();

    return res.status(200).json({
      success: true,
      data: {
        coordinates: job.coordinates,
        geocodedLocation: job.geocodedLocation,
      },
    });
  } catch (error) {
    console.error("Error geocoding job location:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to geocode location",
      error: error.message,
    });
  }
};

/**
 * Batch geocode all jobs without coordinates
 * POST /api/job-locations/geocode-all
 */
export const geocodeAllJobs = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Find jobs without coordinates
    const jobsToGeocode = await Job.find({
      userId,
      location: { $exists: true, $ne: "" },
      "coordinates.lat": { $exists: false },
    }).select("_id location");

    const results = {
      success: [],
      failed: [],
    };

    // Geocode each job
    for (const job of jobsToGeocode) {
      try {
        const geocodeResult = await geocodeLocation(job.location);

        if (geocodeResult) {
          await Job.findByIdAndUpdate(job._id, {
            coordinates: geocodeResult.coordinates,
            geocodedLocation: {
              displayName: geocodeResult.displayName,
              city: geocodeResult.addressComponents?.city,
              state: geocodeResult.addressComponents?.state,
              country: geocodeResult.addressComponents?.country,
              postalCode: geocodeResult.addressComponents?.postalCode,
              timezone: geocodeResult.timezone,
              geocodedAt: new Date(),
            },
          });
          results.success.push(job._id);
        } else {
          results.failed.push({ id: job._id, reason: "No results" });
        }
      } catch (error) {
        results.failed.push({ id: job._id, reason: error.message });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        geocodedCount: results.success.length,
        failedCount: results.failed.length,
        totalProcessed: jobsToGeocode.length,
        failed: results.failed,
      },
    });
  } catch (error) {
    console.error("Error batch geocoding jobs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to batch geocode jobs",
      error: error.message,
    });
  }
};

/**
 * Set user's home location
 * PUT /api/job-locations/home-location
 */
export const setHomeLocation = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;
    const { address } = req.body;

    console.log("setHomeLocation called with:", { userId, address });

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Address is required",
      });
    }

    // Geocode the address
    console.log("Geocoding address:", address);
    const geocodeResult = await geocodeLocation(address);
    console.log("Geocode result:", geocodeResult);

    if (!geocodeResult) {
      return res.status(400).json({
        success: false,
        message: "Could not geocode address. Please check the address format.",
      });
    }

    // Update user's home location
    console.log("Updating user with auth0Id:", userId);
    console.log("Setting homeLocation to:", JSON.stringify({
      address: address,
      coordinates: geocodeResult.coordinates,
      displayName: geocodeResult.displayName,
      timezone: geocodeResult.timezone?.name || geocodeResult.timezone,
    }, null, 2));
    
    const user = await User.findOneAndUpdate(
      { auth0Id: userId },
      {
        $set: {
          homeLocation: {
            address: address,
            coordinates: geocodeResult.coordinates,
            displayName: geocodeResult.displayName,
            timezone: geocodeResult.timezone?.name || geocodeResult.timezone,
          }
        }
      },
      { new: true, upsert: false, runValidators: false }
    );

    console.log("User update result:", user ? "User found and updated" : "User NOT found");
    console.log("Full user object keys:", user ? Object.keys(user.toObject ? user.toObject() : user) : "N/A");
    console.log("User homeLocation after update:", JSON.stringify(user?.homeLocation, null, 2));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please make sure you have a profile.",
      });
    }

    // Extract homeLocation - need to convert to plain object
    const homeLocationData = user.homeLocation ? {
      address: user.homeLocation.address,
      coordinates: user.homeLocation.coordinates,
      displayName: user.homeLocation.displayName,
      timezone: user.homeLocation.timezone,
    } : null;

    console.log("Extracted homeLocationData:", JSON.stringify(homeLocationData, null, 2));

    const responseData = {
      success: true,
      data: homeLocationData,
    };
    console.log("Sending response:", JSON.stringify(responseData, null, 2));
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error setting home location:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to set home location",
      error: error.message,
    });
  }
};

/**
 * Get user's home location
 * GET /api/job-locations/home-location
 */
export const getHomeLocation = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await User.findOne({ auth0Id: userId }).select("homeLocation");

    return res.status(200).json({
      success: true,
      data: user?.homeLocation || null,
    });
  } catch (error) {
    console.error("Error getting home location:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get home location",
      error: error.message,
    });
  }
};

/**
 * Compare multiple job locations
 * POST /api/job-locations/compare
 */
export const compareLocations = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;
    const { jobIds } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: "At least 2 job IDs are required for comparison",
      });
    }

    // Get user's home location
    const user = await User.findOne({ auth0Id: userId }).select("homeLocation");

    if (!user?.homeLocation?.coordinates) {
      return res.status(400).json({
        success: false,
        message: "Please set your home location first",
      });
    }

    // Fetch the jobs
    const jobs = await Job.find({
      _id: { $in: jobIds },
      userId,
    }).select(
      "title company location coordinates geocodedLocation workMode status salary"
    );

    // Compare locations
    const comparison = compareJobLocations(
      user.homeLocation.coordinates,
      jobs.map((job) => ({
        ...job.toObject(),
        coordinates: job.coordinates,
      }))
    );

    // Calculate timezone differences
    const comparisonWithTimezone = comparison.map((job) => ({
      ...job,
      timezoneDiff:
        job.geocodedLocation?.timezone?.offset && user.homeLocation?.timezone?.offset
          ? job.geocodedLocation.timezone.offset - user.homeLocation.timezone.offset
          : null,
    }));

    return res.status(200).json({
      success: true,
      data: {
        homeLocation: user.homeLocation,
        jobs: comparisonWithTimezone,
      },
    });
  } catch (error) {
    console.error("Error comparing locations:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to compare locations",
      error: error.message,
    });
  }
};

/**
 * Get commute details for a specific job
 * GET /api/job-locations/:jobId/commute
 */
export const getCommuteDetails = async (req, res) => {
  try {
    const userId = req.auth?.payload?.sub || req.auth?.userId;
    const { jobId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Get user and job
    const [user, job] = await Promise.all([
      User.findOne({ auth0Id: userId }).select("homeLocation"),
      Job.findOne({ _id: jobId, userId }).select(
        "title company location coordinates geocodedLocation workMode"
      ),
    ]);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (!user?.homeLocation?.coordinates) {
      return res.status(400).json({
        success: false,
        message: "Please set your home location first",
      });
    }

    if (!job.coordinates?.lat) {
      return res.status(400).json({
        success: false,
        message: "Job location has not been geocoded yet",
      });
    }

    const commuteDetails = calculateCommuteDetails(
      user.homeLocation.coordinates,
      job.coordinates
    );

    return res.status(200).json({
      success: true,
      data: {
        job: job.toObject(),
        homeLocation: user.homeLocation,
        commuteDetails,
        timezoneDiff:
          job.geocodedLocation?.timezone?.offset && user.homeLocation?.timezone?.offset
            ? job.geocodedLocation.timezone.offset - user.homeLocation.timezone.offset
            : null,
      },
    });
  } catch (error) {
    console.error("Error getting commute details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get commute details",
      error: error.message,
    });
  }
};

export default {
  getJobsWithLocations,
  geocodeJobLocation,
  geocodeAllJobs,
  setHomeLocation,
  getHomeLocation,
  compareLocations,
  getCommuteDetails,
};
