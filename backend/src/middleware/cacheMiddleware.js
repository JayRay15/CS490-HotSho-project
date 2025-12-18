/**
 * Cache Middleware
 * 
 * Middleware for automatic response caching
 * Supports route-level and controller-level caching
 */

import cache, { CACHE_TTL, generateKey, get, set } from '../utils/cache.js';

/**
 * Route-level caching middleware
 * Caches entire API responses
 * 
 * @param {string} prefix - Cache key prefix
 * @param {number} ttl - Time to live in seconds
 * @param {Function} keyGenerator - Optional custom key generator
 */
export const cacheResponse = (prefix, ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Skip if caching is disabled via query param
    if (req.query.noCache === 'true') {
      return next();
    }
    
    try {
      // Generate cache key
      const userId = req.auth?.payload?.sub || req.auth?.userId || 'anonymous';
      const cacheKey = keyGenerator 
        ? keyGenerator(req, userId)
        : generateKey(prefix, { userId, path: req.path, query: req.query });
      
      // Try to get from cache
      const cached = await get(cacheKey);
      
      if (cached) {
        // Add cache header
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        return res.json(cached);
      }
      
      // Store original json method
      const originalJson = res.json.bind(res);
      
      // Override json method to cache response
      res.json = async (data) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await set(cacheKey, data, ttl);
        }
        
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', cacheKey);
        return originalJson(data);
      };
      
      next();
      
    } catch (err) {
      console.error('Cache middleware error:', err.message);
      next(); // Continue without caching on error
    }
  };
};

/**
 * Cache invalidation middleware
 * Invalidates cache on data-modifying operations
 * 
 * @param {string[]} patterns - Cache key patterns to invalidate
 */
export const invalidateCache = (...patterns) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);
    
    // Override json method to invalidate after response
    res.json = async (data) => {
      // Invalidate cache after successful mutation
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.auth?.payload?.sub || req.auth?.userId;
        
        for (const pattern of patterns) {
          // Replace {userId} placeholder with actual userId
          const resolvedPattern = pattern.replace('{userId}', userId || '*');
          await cache.delPattern(resolvedPattern);
        }
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Pre-defined cache configurations for common routes
 */
export const cacheConfigs = {
  // User profile - cache for 10 minutes
  userProfile: cacheResponse('user', CACHE_TTL.user, 
    (req, userId) => generateKey('user:profile', userId)
  ),
  
  // Job list - cache for 2 minutes
  jobList: cacheResponse('jobs', CACHE_TTL.jobs,
    (req, userId) => generateKey('jobs:list', { 
      userId, 
      status: req.query.status,
      archived: req.query.archived,
      search: req.query.search
    })
  ),
  
  // Single job - cache for 5 minutes
  jobDetails: cacheResponse('job', CACHE_TTL.jobDetails,
    (req, userId) => generateKey('job:details', { userId, jobId: req.params.jobId })
  ),
  
  // Dashboard analytics - cache for 3 minutes
  dashboard: cacheResponse('dashboard', CACHE_TTL.dashboard,
    (req, userId) => generateKey('dashboard', userId)
  ),
  
  // Analytics data - cache for 15 minutes
  analytics: cacheResponse('analytics', CACHE_TTL.analytics,
    (req, userId) => generateKey('analytics', { userId, type: req.query.type })
  ),
  
  // Company info - cache for 1 hour
  companyInfo: cacheResponse('company', CACHE_TTL.companyInfo,
    (req, userId) => generateKey('company', req.params.companyId || req.query.name)
  ),
  
  // Salary data - cache for 30 minutes
  salaryData: cacheResponse('salary', CACHE_TTL.salaryData,
    (req, userId) => generateKey('salary', { ...req.query })
  ),
  
  // Templates - cache for 1 hour
  templates: cacheResponse('templates', CACHE_TTL.templates,
    (req, userId) => generateKey('templates', { userId, type: req.query.type })
  ),
};

/**
 * Pre-defined cache invalidation configurations
 */
export const invalidateConfigs = {
  // Invalidate job-related caches
  jobs: invalidateCache('jobs:{userId}*', 'job:{userId}*', 'dashboard:{userId}*', 'analytics:{userId}*'),
  
  // Invalidate user profile cache
  user: invalidateCache('user:{userId}*', 'dashboard:{userId}*'),
  
  // Invalidate all user caches
  all: invalidateCache('{userId}*'),
};

export default {
  cacheResponse,
  invalidateCache,
  cacheConfigs,
  invalidateConfigs
};
