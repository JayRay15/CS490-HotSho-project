import mongoose from "mongoose";

/**
 * GeocodingCache Model
 * Caches geocoding results from OpenStreetMap Nominatim API
 * to minimize API calls and improve performance
 */
const geocodingCacheSchema = new mongoose.Schema(
  {
    // The original location string that was geocoded
    locationQuery: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true, // Normalize for consistent lookups
    },
    // Geocoding result coordinates
    coordinates: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
    // Full address returned by geocoding API
    displayName: {
      type: String,
    },
    // Address components for filtering
    addressComponents: {
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },
    // Timezone information for international locations
    timezone: {
      name: String,
      offset: Number, // UTC offset in hours
    },
    // Track API usage
    source: {
      type: String,
      enum: ["nominatim", "manual"],
      default: "nominatim",
    },
    // Cache validity - entries expire after 30 days
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: { expireAfterSeconds: 0 }, // TTL index
    },
    // Track how often this cached entry is used
    hitCount: {
      type: Number,
      default: 0,
    },
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient lookups
geocodingCacheSchema.index({ "coordinates.lat": 1, "coordinates.lng": 1 });
geocodingCacheSchema.index({ "addressComponents.country": 1 });

// Method to record a cache hit
geocodingCacheSchema.methods.recordHit = async function () {
  this.hitCount += 1;
  this.lastAccessed = new Date();
  await this.save();
};

// Static method to find or create cache entry
geocodingCacheSchema.statics.findOrCreate = async function (
  locationQuery,
  geocodeFunction
) {
  const normalizedQuery = locationQuery.toLowerCase().trim();

  // Try to find existing cache entry
  let cached = await this.findOne({ locationQuery: normalizedQuery });

  if (cached) {
    // Record cache hit asynchronously
    cached.recordHit().catch(console.error);
    return {
      cached: true,
      data: {
        coordinates: cached.coordinates,
        displayName: cached.displayName,
        addressComponents: cached.addressComponents,
        timezone: cached.timezone,
      },
    };
  }

  // If not cached, call the geocode function
  const result = await geocodeFunction(locationQuery);

  if (result && result.coordinates) {
    // Store in cache
    cached = await this.create({
      locationQuery: normalizedQuery,
      coordinates: result.coordinates,
      displayName: result.displayName,
      addressComponents: result.addressComponents,
      timezone: result.timezone,
    });

    return {
      cached: false,
      data: {
        coordinates: cached.coordinates,
        displayName: cached.displayName,
        addressComponents: cached.addressComponents,
        timezone: cached.timezone,
      },
    };
  }

  return null;
};

const GeocodingCache = mongoose.model("GeocodingCache", geocodingCacheSchema);

export default GeocodingCache;
