/**
 * Geocoding Service
 * Uses OpenStreetMap Nominatim API for free geocoding
 * Includes rate limiting, caching, and commute calculations
 */

import GeocodingCache from "../models/GeocodingCache.js";

// Rate limiting - Nominatim requires max 1 request per second
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1100; // 1.1 seconds between requests

// User-Agent required by Nominatim usage policy
const USER_AGENT = "HotSho-JobTracker/1.0 (job tracking application)";

/**
 * Geocode a location string to coordinates
 * @param {string} locationString - Address or location to geocode
 * @returns {Promise<Object>} Geocoding result with coordinates
 */
export async function geocodeLocation(locationString) {
  if (!locationString || locationString.trim() === "") {
    console.log("geocodeLocation: Empty location string provided");
    return null;
  }

  try {
    console.log("geocodeLocation: Attempting to geocode:", locationString);
    // Check cache first
    const cacheResult = await GeocodingCache.findOrCreate(
      locationString,
      fetchFromNominatim
    );

    console.log("geocodeLocation: Cache result:", cacheResult ? "found" : "null");
    return cacheResult?.data || null;
  } catch (error) {
    console.error("Geocoding error:", error.message);
    console.error("Geocoding error stack:", error.stack);
    return null;
  }
}

/**
 * Fetch geocoding data from Nominatim API
 * @param {string} locationString - Address to geocode
 * @returns {Promise<Object>} Geocoding result
 */
async function fetchFromNominatim(locationString) {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();

  try {
    const encodedLocation = encodeURIComponent(locationString);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}&limit=1&addressdetails=1`;

    console.log("fetchFromNominatim: Fetching URL:", url);

    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
    });

    console.log("fetchFromNominatim: Response status:", response.status);

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("fetchFromNominatim: Response data length:", data?.length || 0);

    if (!data || data.length === 0) {
      console.log(`No geocoding results for: ${locationString}`);
      return null;
    }

    const result = data[0];
    const address = result.address || {};

    console.log("fetchFromNominatim: Found coordinates:", result.lat, result.lon);

    return {
      coordinates: {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      },
      displayName: result.display_name,
      addressComponents: {
        city:
          address.city || address.town || address.village || address.municipality,
        state: address.state || address.region,
        country: address.country,
        postalCode: address.postcode,
      },
      timezone: await getTimezoneForCoordinates(
        parseFloat(result.lat),
        parseFloat(result.lon)
      ),
    };
  } catch (error) {
    console.error("Nominatim API error:", error.message);
    throw error;
  }
}

/**
 * Get timezone for coordinates
 * Uses a simple approximation based on longitude
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} Timezone information
 */
async function getTimezoneForCoordinates(lat, lng) {
  // Simple timezone approximation based on longitude
  // Each 15 degrees of longitude = 1 hour offset from UTC
  const offset = Math.round(lng / 15);

  // Get timezone name (simplified)
  let name = "UTC";
  if (offset > 0) {
    name = `UTC+${offset}`;
  } else if (offset < 0) {
    name = `UTC${offset}`;
  }

  return {
    name,
    offset,
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} coord1 - First coordinate {lat, lng}
 * @param {Object} coord2 - Second coordinate {lat, lng}
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(coord1, coord2) {
  if (!coord1 || !coord2 || !coord1.lat || !coord2.lat) {
    return null;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Estimate commute time based on distance
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} mode - Transportation mode (driving, transit, cycling, walking)
 * @returns {Object} Estimated travel times
 */
export function estimateCommuteTime(distanceKm, mode = "driving") {
  if (distanceKm === null || distanceKm === undefined) {
    return null;
  }

  // Average speeds in km/h
  const speeds = {
    driving: 40, // Average urban driving speed
    transit: 25, // Average public transit speed
    cycling: 15, // Average cycling speed
    walking: 5, // Average walking speed
  };

  const speed = speeds[mode] || speeds.driving;
  const timeHours = distanceKm / speed;
  const timeMinutes = Math.round(timeHours * 60);

  return {
    mode,
    distanceKm,
    distanceMiles: Math.round(distanceKm * 0.621371 * 10) / 10,
    timeMinutes,
    timeFormatted: formatTime(timeMinutes),
  };
}

/**
 * Format time in minutes to readable string
 * @param {number} minutes - Time in minutes
 * @returns {string} Formatted time string
 */
function formatTime(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${mins} min`;
}

/**
 * Calculate commute details between two locations
 * @param {Object} homeCoords - Home coordinates {lat, lng}
 * @param {Object} jobCoords - Job coordinates {lat, lng}
 * @returns {Object} Commute details for all transportation modes
 */
export function calculateCommuteDetails(homeCoords, jobCoords) {
  const distance = calculateDistance(homeCoords, jobCoords);

  if (distance === null) {
    return null;
  }

  return {
    distance: {
      km: distance,
      miles: Math.round(distance * 0.621371 * 10) / 10,
    },
    estimates: {
      driving: estimateCommuteTime(distance, "driving"),
      transit: estimateCommuteTime(distance, "transit"),
      cycling: estimateCommuteTime(distance, "cycling"),
      walking: estimateCommuteTime(distance, "walking"),
    },
  };
}

/**
 * Batch geocode multiple locations
 * @param {string[]} locations - Array of location strings
 * @returns {Promise<Object[]>} Array of geocoding results
 */
export async function batchGeocode(locations) {
  const results = [];

  for (const location of locations) {
    const result = await geocodeLocation(location);
    results.push({
      originalLocation: location,
      geocoded: result,
    });
  }

  return results;
}

/**
 * Compare multiple job locations
 * @param {Object} homeLocation - Home coordinates
 * @param {Object[]} jobs - Array of jobs with coordinates
 * @returns {Object[]} Jobs with commute comparison data
 */
export function compareJobLocations(homeLocation, jobs) {
  return jobs
    .map((job) => {
      if (!job.coordinates) {
        return {
          ...job,
          commuteDetails: null,
        };
      }

      const commuteDetails = calculateCommuteDetails(
        homeLocation,
        job.coordinates
      );

      return {
        ...job,
        commuteDetails,
      };
    })
    .sort((a, b) => {
      // Sort by driving time (shortest first)
      const aTime = a.commuteDetails?.estimates?.driving?.timeMinutes || Infinity;
      const bTime = b.commuteDetails?.estimates?.driving?.timeMinutes || Infinity;
      return aTime - bTime;
    });
}

export default {
  geocodeLocation,
  calculateDistance,
  estimateCommuteTime,
  calculateCommuteDetails,
  batchGeocode,
  compareJobLocations,
};
