/**
 * Secure Session Configuration
 * 
 * This module provides secure session/cookie configuration settings
 * for the application. Since we use Clerk for authentication (stateless JWT),
 * this primarily configures security settings for any application cookies.
 */

/**
 * Secure cookie options for production
 * These settings ensure cookies are transmitted securely and are resistant to attacks
 */
export const secureCookieOptions = {
  // Cookie is only sent over HTTPS in production
  secure: process.env.NODE_ENV === 'production',
  
  // Cookie cannot be accessed by client-side JavaScript (prevents XSS theft)
  httpOnly: true,
  
  // Cookie is only sent with same-site requests (CSRF protection)
  // 'strict' - Only sent with same-site requests
  // 'lax' - Sent with same-site requests and top-level navigations (recommended)
  // 'none' - Sent with all requests (requires secure: true)
  sameSite: 'strict',
  
  // Cookie path - restrict to specific paths if needed
  path: '/',
  
  // Cookie expiration (in milliseconds)
  // Default: 24 hours
  maxAge: 24 * 60 * 60 * 1000,
  
  // Domain - set if you need to share cookies across subdomains
  // domain: '.yourdomain.com',
};

/**
 * Session cookie options (if using express-session in the future)
 */
export const sessionCookieOptions = {
  name: 'hotsho.sid', // Custom session cookie name (avoid default 'connect.sid')
  ...secureCookieOptions,
  // Rolling session - reset expiry on each request
  rolling: true,
  // Save uninitialized sessions
  saveUninitialized: false,
  // Resave even if session wasn't modified
  resave: false,
};

/**
 * CSRF cookie options
 */
export const csrfCookieOptions = {
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'strict',
  path: '/',
  maxAge: 60 * 60 * 1000, // 1 hour
};

/**
 * JWT Token Options for any custom tokens
 * (Note: Primary authentication uses Clerk, these are for internal tokens)
 */
export const jwtOptions = {
  // Token expiration time
  expiresIn: '1h',
  
  // Algorithm to use for signing
  algorithm: 'HS256',
  
  // Issuer claim
  issuer: 'hotsho-api',
  
  // Audience claim
  audience: 'hotsho-client',
};

/**
 * Refresh token options
 */
export const refreshTokenOptions = {
  expiresIn: '7d',
  algorithm: 'HS256',
  issuer: 'hotsho-api',
  audience: 'hotsho-client',
};

/**
 * Password hashing options (bcrypt)
 */
export const passwordHashOptions = {
  // Number of salt rounds (higher = more secure but slower)
  // 10-12 is recommended for production
  saltRounds: 12,
};

/**
 * Session timeout configurations
 */
export const sessionTimeouts = {
  // Absolute session timeout (max session duration regardless of activity)
  absoluteTimeout: 8 * 60 * 60 * 1000, // 8 hours
  
  // Idle session timeout (timeout after inactivity)
  idleTimeout: 30 * 60 * 1000, // 30 minutes
  
  // Token refresh threshold (refresh if token expires within this time)
  refreshThreshold: 5 * 60 * 1000, // 5 minutes
};

/**
 * Security-related environment variables validation
 */
export const validateSecurityEnv = () => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'CLERK_SECRET_KEY',
  ];
  
  const warnings = [];
  const errors = [];
  
  // Check for missing required variables
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });
  
  // Check for weak secrets in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      warnings.push('JWT_SECRET should be at least 32 characters in production');
    }
    
    if (process.env.CSRF_SECRET && process.env.CSRF_SECRET.length < 32) {
      warnings.push('CSRF_SECRET should be at least 32 characters in production');
    }
    
    // Check for development values in production
    const devValues = ['development', 'your-secret', 'changeme', 'secret', 'password'];
    Object.keys(process.env).forEach(key => {
      if (key.includes('SECRET') || key.includes('KEY') || key.includes('PASSWORD')) {
        if (devValues.some(v => process.env[key]?.toLowerCase().includes(v))) {
          warnings.push(`${key} appears to contain a development value`);
        }
      }
    });
  }
  
  return { errors, warnings };
};

/**
 * Middleware to set secure headers for sensitive data responses
 */
export const secureResponseHeaders = (req, res, next) => {
  // Prevent caching of sensitive data
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
};

export default {
  secureCookieOptions,
  sessionCookieOptions,
  csrfCookieOptions,
  jwtOptions,
  refreshTokenOptions,
  passwordHashOptions,
  sessionTimeouts,
  validateSecurityEnv,
  secureResponseHeaders
};
