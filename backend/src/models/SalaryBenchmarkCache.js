import mongoose from "mongoose";

/**
 * UC-112: Salary Benchmark Cache Model
 * 
 * This model stores cached salary benchmark data from external sources (BLS API)
 * to minimize API calls and improve performance. Data is cached based on job title
 * and location, with automatic expiration after a configurable period.
 */

const salaryBenchmarkCacheSchema = new mongoose.Schema(
  {
    // Unique identifier for the cached data
    jobTitle: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    
    // Normalized job title for better matching
    normalizedJobTitle: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    
    location: {
      type: String,
      required: true,
      default: 'National',
      index: true,
    },
    
    // BLS occupation code used for this data
    occupationCode: {
      type: String,
      required: true,
    },
    
    // BLS area code used for this data
    areaCode: {
      type: String,
      required: true,
      default: '0000000', // Default to National
    },
    
    // Source of the data
    dataSource: {
      type: String,
      enum: ['BLS', 'Glassdoor', 'Manual'],
      default: 'BLS',
      required: true,
    },
    
    // Year of the salary data
    dataYear: {
      type: String,
      required: true,
    },
    
    // Salary statistics
    salaryData: {
      // Basic range
      min: {
        type: Number,
        required: true,
      },
      max: {
        type: Number,
        required: true,
      },
      median: {
        type: Number,
        required: true,
      },
      mean: {
        type: Number,
      },
      
      // Percentile breakdown
      percentiles: {
        p10: Number,
        p25: Number,
        p50: Number, // Same as median
        p75: Number,
        p90: Number,
      },
    },
    
    // Additional metadata
    metadata: {
      sampleSize: Number, // Number of data points (if available)
      confidence: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium',
      },
      notes: String,
    },
    
    // Cache control
    cacheExpiry: {
      type: Date,
      required: true,
      index: true,
    },
    
    // Track how many times this cache entry has been used
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

// Compound index for efficient lookups
salaryBenchmarkCacheSchema.index({ normalizedJobTitle: 1, location: 1 });
salaryBenchmarkCacheSchema.index({ cacheExpiry: 1 }); // For TTL-like cleanup

// Pre-save middleware to normalize job title
salaryBenchmarkCacheSchema.pre('save', function (next) {
  if (this.isModified('jobTitle')) {
    this.normalizedJobTitle = this.jobTitle.toLowerCase().trim();
  }
  next();
});

/**
 * Static method to find cached data
 * @param {string} jobTitle - Job title to search for
 * @param {string} location - Location (optional, defaults to 'National')
 * @returns {Promise<Object|null>} Cached salary data or null if not found/expired
 */
salaryBenchmarkCacheSchema.statics.findCachedData = async function (jobTitle, location = 'National') {
  const normalizedTitle = jobTitle.toLowerCase().trim();
  const normalizedLocation = location || 'National';
  
  const cached = await this.findOne({
    normalizedJobTitle: normalizedTitle,
    location: normalizedLocation,
    cacheExpiry: { $gt: new Date() }, // Not expired
  });
  
  if (cached) {
    // Update hit count and last accessed time
    cached.hitCount += 1;
    cached.lastAccessed = new Date();
    await cached.save();
  }
  
  return cached;
};

/**
 * Static method to cache new data
 * @param {string} jobTitle - Job title
 * @param {string} location - Location
 * @param {Object} salaryData - Salary data to cache
 * @param {Object} options - Additional options (dataSource, occupationCode, etc.)
 * @returns {Promise<Object>} Saved cache entry
 */
salaryBenchmarkCacheSchema.statics.cacheData = async function (
  jobTitle,
  location,
  salaryData,
  options = {}
) {
  const {
    dataSource = 'BLS',
    occupationCode = '',
    areaCode = '',
    dataYear = new Date().getFullYear().toString(),
    cacheDurationDays = 30, // Default: 30 days
    metadata = {},
  } = options;
  
  const normalizedTitle = jobTitle.toLowerCase().trim();
  const normalizedLocation = location || 'National';
  
  // Calculate cache expiry (default 30 days from now)
  const cacheExpiry = new Date();
  cacheExpiry.setDate(cacheExpiry.getDate() + cacheDurationDays);
  
  // Check if cache entry already exists
  const existingCache = await this.findOne({
    normalizedJobTitle: normalizedTitle,
    location: normalizedLocation,
  });
  
  if (existingCache) {
    // Update existing cache
    existingCache.salaryData = salaryData;
    existingCache.dataSource = dataSource;
    existingCache.occupationCode = occupationCode;
    existingCache.areaCode = areaCode;
    existingCache.dataYear = dataYear;
    existingCache.metadata = metadata;
    existingCache.cacheExpiry = cacheExpiry;
    existingCache.lastAccessed = new Date();
    
    return await existingCache.save();
  }
  
  // Create new cache entry
  const newCache = new this({
    jobTitle,
    normalizedJobTitle: normalizedTitle,
    location: normalizedLocation,
    occupationCode,
    areaCode,
    dataSource,
    dataYear,
    salaryData,
    metadata,
    cacheExpiry,
  });
  
  return await newCache.save();
};

/**
 * Static method to clean up expired cache entries
 * Should be called periodically (e.g., daily cron job)
 */
salaryBenchmarkCacheSchema.statics.cleanupExpired = async function () {
  const result = await this.deleteMany({
    cacheExpiry: { $lt: new Date() },
  });
  
  return result.deletedCount;
};

/**
 * Instance method to check if cache is expired
 */
salaryBenchmarkCacheSchema.methods.isExpired = function () {
  return this.cacheExpiry < new Date();
};

/**
 * Instance method to extend cache expiry
 */
salaryBenchmarkCacheSchema.methods.extendExpiry = async function (days = 30) {
  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + days);
  this.cacheExpiry = newExpiry;
  return await this.save();
};

export const SalaryBenchmarkCache = mongoose.model('SalaryBenchmarkCache', salaryBenchmarkCacheSchema);
