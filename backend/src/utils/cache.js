/**
 * Caching Layer Implementation
 * 
 * Supports Redis (for production/distributed caching) with fallback to
 * in-memory cache (node-cache) for development or when Redis is unavailable.
 * 
 * Redis Free Tier Options:
 * - Redis Cloud (redis.com): 30MB free
 * - Upstash (upstash.com): 10,000 commands/day free
 * - Railway: 500MB free
 */

import Redis from 'ioredis';
import NodeCache from 'node-cache';

// Cache configuration
const config = {
  // Default TTL in seconds
  defaultTTL: 300, // 5 minutes
  
  // TTL for different data types (in seconds)
  ttl: {
    user: 600,           // 10 minutes - user data changes infrequently
    jobs: 120,           // 2 minutes - job list may change more often
    jobDetails: 300,     // 5 minutes
    analytics: 900,      // 15 minutes - analytics data is expensive to compute
    dashboard: 180,      // 3 minutes
    companyInfo: 3600,   // 1 hour - company info rarely changes
    salaryData: 1800,    // 30 minutes
    templates: 3600,     // 1 hour - templates change rarely
  },
  
  // Redis connection options
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    keyPrefix: 'hotsho:',
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    lazyConnect: true, // Don't connect immediately
  },
  
  // In-memory cache options (fallback)
  nodeCache: {
    stdTTL: 300,         // Default TTL: 5 minutes
    checkperiod: 60,     // Check for expired keys every 60 seconds
    useClones: false,    // Don't clone objects (faster)
    maxKeys: 1000,       // Maximum number of keys
  }
};

// Cache statistics
const stats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
  lastError: null,
  usingRedis: false
};

// Redis client instance
let redisClient = null;

// In-memory cache instance (fallback)
let memoryCache = null;

/**
 * Initialize the caching layer
 * Attempts Redis first, falls back to in-memory cache
 */
export const initCache = async () => {
  // Always initialize memory cache as fallback
  memoryCache = new NodeCache(config.nodeCache);
  console.log('✅ In-memory cache initialized');
  
  // Try to connect to Redis if configured
  if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    try {
      const redisUrl = process.env.REDIS_URL;
      
      if (redisUrl) {
        // Use Redis URL if provided (common for cloud services)
        redisClient = new Redis(redisUrl, {
          keyPrefix: config.redis.keyPrefix,
          maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
          lazyConnect: true
        });
      } else {
        // Use individual connection options
        redisClient = new Redis(config.redis);
      }
      
      // Set up event handlers
      redisClient.on('connect', () => {
        console.log('🔄 Connecting to Redis...');
      });
      
      redisClient.on('ready', () => {
        stats.usingRedis = true;
        console.log('✅ Redis cache connected and ready');
      });
      
      redisClient.on('error', (err) => {
        stats.errors++;
        stats.lastError = err.message;
        console.error('⚠️ Redis error:', err.message);
        // Fall back to memory cache
        stats.usingRedis = false;
      });
      
      redisClient.on('close', () => {
        console.log('⚠️ Redis connection closed');
        stats.usingRedis = false;
      });
      
      // Attempt to connect
      await redisClient.connect();
      
      // Test connection
      await redisClient.ping();
      stats.usingRedis = true;
      
    } catch (err) {
      console.warn('⚠️ Redis connection failed, using in-memory cache:', err.message);
      stats.usingRedis = false;
      redisClient = null;
    }
  } else {
    console.log('ℹ️ Redis not configured, using in-memory cache only');
  }
  
  return stats.usingRedis ? 'redis' : 'memory';
};

/**
 * Generate a cache key
 * @param {string} prefix - Key prefix (e.g., 'user', 'jobs')
 * @param {string|object} identifier - Unique identifier or query params
 */
export const generateKey = (prefix, identifier) => {
  if (typeof identifier === 'object') {
    // Create consistent key from object
    const sorted = Object.keys(identifier).sort().reduce((obj, key) => {
      obj[key] = identifier[key];
      return obj;
    }, {});
    return `${prefix}:${JSON.stringify(sorted)}`;
  }
  return `${prefix}:${identifier}`;
};

/**
 * Get a value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any>} - Cached value or null
 */
export const get = async (key) => {
  try {
    let value = null;
    
    if (stats.usingRedis && redisClient) {
      const data = await redisClient.get(key);
      if (data) {
        value = JSON.parse(data);
      }
    } else if (memoryCache) {
      value = memoryCache.get(key);
    }
    
    if (value !== null && value !== undefined) {
      stats.hits++;
      return value;
    }
    
    stats.misses++;
    return null;
    
  } catch (err) {
    stats.errors++;
    stats.lastError = err.message;
    console.error('Cache get error:', err.message);
    return null;
  }
};

/**
 * Set a value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (optional)
 */
export const set = async (key, value, ttl = config.defaultTTL) => {
  try {
    if (stats.usingRedis && redisClient) {
      await redisClient.setex(key, ttl, JSON.stringify(value));
    } else if (memoryCache) {
      memoryCache.set(key, value, ttl);
    }
    
    stats.sets++;
    return true;
    
  } catch (err) {
    stats.errors++;
    stats.lastError = err.message;
    console.error('Cache set error:', err.message);
    return false;
  }
};

/**
 * Delete a value from cache
 * @param {string} key - Cache key
 */
export const del = async (key) => {
  try {
    if (stats.usingRedis && redisClient) {
      await redisClient.del(key);
    } else if (memoryCache) {
      memoryCache.del(key);
    }
    
    stats.deletes++;
    return true;
    
  } catch (err) {
    stats.errors++;
    stats.lastError = err.message;
    console.error('Cache delete error:', err.message);
    return false;
  }
};

/**
 * Delete all keys matching a pattern
 * @param {string} pattern - Pattern to match (e.g., 'user:*')
 */
export const delPattern = async (pattern) => {
  try {
    if (stats.usingRedis && redisClient) {
      // Use SCAN for safer pattern deletion
      const stream = redisClient.scanStream({
        match: config.redis.keyPrefix + pattern,
        count: 100
      });
      
      const pipeline = redisClient.pipeline();
      let count = 0;
      
      stream.on('data', (keys) => {
        for (const key of keys) {
          pipeline.del(key);
          count++;
        }
      });
      
      await new Promise((resolve, reject) => {
        stream.on('end', resolve);
        stream.on('error', reject);
      });
      
      await pipeline.exec();
      stats.deletes += count;
      
    } else if (memoryCache) {
      // For in-memory cache, iterate through keys
      const keys = memoryCache.keys();
      const matchingKeys = keys.filter(k => 
        k.startsWith(pattern.replace('*', ''))
      );
      matchingKeys.forEach(k => memoryCache.del(k));
      stats.deletes += matchingKeys.length;
    }
    
    return true;
    
  } catch (err) {
    stats.errors++;
    stats.lastError = err.message;
    console.error('Cache delete pattern error:', err.message);
    return false;
  }
};

/**
 * Clear all cache
 */
export const flush = async () => {
  try {
    if (stats.usingRedis && redisClient) {
      await redisClient.flushdb();
    }
    if (memoryCache) {
      memoryCache.flushAll();
    }
    
    console.log('Cache flushed');
    return true;
    
  } catch (err) {
    stats.errors++;
    stats.lastError = err.message;
    console.error('Cache flush error:', err.message);
    return false;
  }
};

/**
 * Get or set cache (cache-aside pattern)
 * If key exists, return cached value
 * If not, execute fetchFn, cache result, and return
 * 
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Async function to fetch data if not cached
 * @param {number} ttl - Time to live in seconds
 */
export const getOrSet = async (key, fetchFn, ttl = config.defaultTTL) => {
  try {
    // Try to get from cache
    const cached = await get(key);
    if (cached !== null) {
      return { data: cached, fromCache: true };
    }
    
    // Fetch fresh data
    const data = await fetchFn();
    
    // Cache the result
    await set(key, data, ttl);
    
    return { data, fromCache: false };
    
  } catch (err) {
    stats.errors++;
    stats.lastError = err.message;
    throw err;
  }
};

/**
 * Invalidate user-related cache
 * @param {string} userId - User ID
 */
export const invalidateUserCache = async (userId) => {
  await delPattern(`user:${userId}*`);
  await delPattern(`jobs:${userId}*`);
  await delPattern(`dashboard:${userId}*`);
  await delPattern(`analytics:${userId}*`);
};

/**
 * Get cache statistics
 */
export const getStats = () => {
  const hitRate = stats.hits + stats.misses > 0
    ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2)
    : 0;
  
  return {
    ...stats,
    hitRate: `${hitRate}%`,
    totalOperations: stats.hits + stats.misses + stats.sets + stats.deletes,
    cacheType: stats.usingRedis ? 'redis' : 'memory',
    memoryCacheKeys: memoryCache ? memoryCache.keys().length : 0
  };
};

/**
 * Close cache connections
 */
export const closeCache = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      console.log('Redis connection closed');
    }
    if (memoryCache) {
      memoryCache.close();
      console.log('Memory cache closed');
    }
  } catch (err) {
    console.error('Error closing cache:', err.message);
  }
};

// Cache TTL constants for easy reference
export const CACHE_TTL = config.ttl;

// Export cache instance for direct access if needed
export { redisClient, memoryCache };

export default {
  initCache,
  generateKey,
  get,
  set,
  del,
  delPattern,
  flush,
  getOrSet,
  invalidateUserCache,
  getStats,
  closeCache,
  CACHE_TTL
};
