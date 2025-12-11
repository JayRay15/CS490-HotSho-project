import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { doubleCsrf } from 'csrf-csrf';
import xss from 'xss';

/**
 * Security Middleware Module
 * Implements comprehensive security measures for the application
 * 
 * Security Features:
 * - HTTP Security Headers (Helmet)
 * - CSRF Protection
 * - Rate Limiting
 * - XSS Prevention / Input Sanitization
 */

// ============================================================
// HTTP Security Headers Configuration (Helmet)
// ============================================================
export const helmetMiddleware = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://clerk.com", "https://*.clerk.accounts.dev"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      connectSrc: [
        "'self'",
        "https://clerk.com",
        "https://*.clerk.accounts.dev",
        "https://api.clerk.dev",
        "https://*.clerk.dev",
        process.env.FRONTEND_ORIGIN || "http://localhost:5173",
        "ws://localhost:*",
        "wss://localhost:*"
      ],
      frameSrc: ["'self'", "https://clerk.com", "https://*.clerk.accounts.dev"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'", "blob:"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      baseUri: ["'self'"],
      manifestSrc: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  // Strict Transport Security (HSTS)
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true
  },
  // X-Content-Type-Options
  xContentTypeOptions: true,
  // X-Frame-Options
  frameguard: { action: 'sameorigin' },
  // X-XSS-Protection (legacy browser support)
  xssFilter: true,
  // Referrer Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // X-DNS-Prefetch-Control
  dnsPrefetchControl: { allow: false },
  // X-Download-Options (IE)
  ieNoOpen: true,
  // X-Permitted-Cross-Domain-Policies
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  // Hide X-Powered-By header
  hidePoweredBy: true
});

// ============================================================
// Rate Limiting Configuration
// ============================================================

// General API rate limiter
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.auth?.payload?.sub || req.auth?.userId || req.ip;
  }
});

// Strict rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 failed login attempts per hour
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after an hour',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed requests
  keyGenerator: (req) => req.ip
});

// Rate limiter for password reset endpoints
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after an hour',
    code: 'PASSWORD_RESET_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip
});

// API-specific rate limiter for expensive operations
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute for API endpoints
  message: {
    success: false,
    message: 'Too many API requests, please slow down',
    code: 'API_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.auth?.payload?.sub || req.auth?.userId || req.ip;
  }
});

// ============================================================
// CSRF Protection Configuration
// ============================================================

const csrfSecret = process.env.CSRF_SECRET || 'your-csrf-secret-change-in-production';

const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => csrfSecret,
  cookieName: '__Host-csrf-token', // Use __Host- prefix for additional security
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 1000 // 1 hour
  },
  size: 64, // Token size in bytes
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'], // Safe methods don't need CSRF protection
  getTokenFromRequest: (req) => {
    // Check multiple locations for the CSRF token
    return req.headers['x-csrf-token'] || 
           req.headers['x-xsrf-token'] ||
           req.body?._csrf ||
           req.query?._csrf;
  }
});

export const csrfProtection = doubleCsrfProtection;
export const csrfTokenGenerator = generateToken;

// Middleware to attach CSRF token to response
export const attachCsrfToken = (req, res, next) => {
  try {
    const token = generateToken(req, res);
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Must be readable by JavaScript
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
    res.locals.csrfToken = token;
    next();
  } catch (error) {
    next(error);
  }
};

// ============================================================
// XSS Prevention / Input Sanitization
// ============================================================

// XSS filter options - configure allowed tags and attributes
const xssOptions = {
  whiteList: {}, // No HTML tags allowed by default
  stripIgnoreTag: true, // Strip all unknown tags
  stripIgnoreTagBody: ['script', 'style'], // Remove content of these tags entirely
  css: false // Disable CSS sanitization (strip all)
};

/**
 * Sanitize a single value recursively
 * @param {any} value - Value to sanitize
 * @returns {any} - Sanitized value
 */
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return xss(value, xssOptions);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    return sanitizeObject(value);
  }
  return value;
};

/**
 * Sanitize all string properties in an object
 * @param {object} obj - Object to sanitize
 * @returns {object} - Sanitized object
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(value);
  }
  return sanitized;
};

/**
 * Input Sanitization Middleware
 * Sanitizes req.body, req.query, and req.params to prevent XSS attacks
 */
export const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitize route parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Sanitize a specific field (utility function)
 * @param {string} input - Input string to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeField = (input) => {
  if (typeof input !== 'string') return input;
  return xss(input, xssOptions);
};

// ============================================================
// Additional Security Utilities
// ============================================================

/**
 * Security headers for specific sensitive responses
 */
export const sensitiveDataHeaders = (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
};

/**
 * Validate Content-Type for POST/PUT/PATCH requests
 */
export const validateContentType = (req, res, next) => {
  const methodsRequiringBody = ['POST', 'PUT', 'PATCH'];
  
  if (methodsRequiringBody.includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    // Allow requests without body (empty POST, etc.)
    if (req.body && Object.keys(req.body).length > 0) {
      if (!contentType || 
          (!contentType.includes('application/json') && 
           !contentType.includes('multipart/form-data') &&
           !contentType.includes('application/x-www-form-urlencoded'))) {
        return res.status(415).json({
          success: false,
          message: 'Unsupported Media Type. Please use application/json, multipart/form-data, or application/x-www-form-urlencoded',
          code: 'UNSUPPORTED_MEDIA_TYPE'
        });
      }
    }
  }
  
  next();
};

/**
 * Log security-related events
 */
export const securityEventLogger = (eventType) => (req, res, next) => {
  const securityLog = {
    timestamp: new Date().toISOString(),
    eventType,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.path,
    method: req.method,
    userId: req.auth?.payload?.sub || req.auth?.userId || 'anonymous'
  };
  
  // Log to console in development, could be sent to security monitoring service in production
  if (process.env.NODE_ENV !== 'test') {
    console.log('[SECURITY EVENT]', JSON.stringify(securityLog));
  }
  
  next();
};

export default {
  helmetMiddleware,
  generalRateLimiter,
  authRateLimiter,
  passwordResetLimiter,
  apiRateLimiter,
  csrfProtection,
  csrfTokenGenerator,
  attachCsrfToken,
  sanitizeInput,
  sanitizeField,
  sensitiveDataHeaders,
  validateContentType,
  securityEventLogger
};
