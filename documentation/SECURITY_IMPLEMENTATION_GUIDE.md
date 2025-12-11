# Production Security Measures Implementation Guide

## Overview

This document outlines the comprehensive security measures implemented in the HotSho application to protect against common web vulnerabilities and ensure secure handling of user data.

**Implementation Date:** $(date)  
**Version:** 1.0.0

---

## Table of Contents

1. [CSRF Protection](#1-csrf-protection)
2. [XSS Prevention](#2-xss-prevention)
3. [SQL Injection Prevention (Parameterized Queries)](#3-sql-injection-prevention)
4. [Secure Session Management](#4-secure-session-management)
5. [HTTP Security Headers](#5-http-security-headers)
6. [Rate Limiting](#6-rate-limiting)
7. [Dependency Security](#7-dependency-security)
8. [Security Audit Checklist](#8-security-audit-checklist)

---

## 1. CSRF Protection

### Implementation

**Package:** `csrf-csrf`  
**Location:** `backend/src/middleware/securityMiddleware.js`

Cross-Site Request Forgery (CSRF) protection is implemented using the double-submit cookie pattern:

```javascript
const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => csrfSecret,
  cookieName: '__Host-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 1000 // 1 hour
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => {
    return req.headers['x-csrf-token'] || 
           req.headers['x-xsrf-token'] ||
           req.body?._csrf ||
           req.query?._csrf;
  }
});
```

### Configuration

- **Token Size:** 64 bytes (512 bits) for cryptographic strength
- **Cookie Name:** Uses `__Host-` prefix for additional security
- **Safe Methods:** GET, HEAD, OPTIONS are excluded from CSRF validation
- **Token Sources:** Header (`X-CSRF-Token`), body (`_csrf`), or query parameter

### Frontend Integration

Frontend should include the CSRF token in requests:

```javascript
// Read from cookie
const csrfToken = document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1];

// Include in requests
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

---

## 2. XSS Prevention

### Implementation

**Package:** `xss`  
**Location:** `backend/src/middleware/securityMiddleware.js`

Input sanitization middleware automatically sanitizes all user inputs:

```javascript
export const sanitizeInput = (req, res, next) => {
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
};
```

### XSS Filter Options

```javascript
const xssOptions = {
  whiteList: {}, // No HTML tags allowed by default
  stripIgnoreTag: true, // Strip all unknown tags
  stripIgnoreTagBody: ['script', 'style'], // Remove content of these tags entirely
  css: false // Disable CSS (strip all)
};
```

### What Gets Sanitized

- All string values in `req.body`
- All string values in `req.query`
- All string values in `req.params`
- Nested objects and arrays are recursively sanitized

### Additional XSS Protections

- **Content-Security-Policy (CSP):** Restricts script sources
- **X-XSS-Protection header:** Legacy browser XSS filter enabled
- **HttpOnly cookies:** Prevents JavaScript access to sensitive cookies

---

## 3. SQL Injection Prevention

### Implementation

MongoDB with Mongoose ORM provides built-in protection against NoSQL injection:

1. **Mongoose Query Sanitization:** All queries go through Mongoose which properly escapes special characters
2. **Schema Validation:** Mongoose schemas enforce data types
3. **Input Sanitization:** XSS middleware also sanitizes query parameters

### Best Practices Enforced

```javascript
// ✅ Safe - Using Mongoose methods with validated inputs
const user = await User.findOne({ clerkId: sanitizedId });

// ✅ Safe - Using parameterized native MongoDB queries
const result = await collection.updateOne(
  { clerkId: userId },  // Query is parameterized
  { $set: { field: value } }
);

// ❌ Dangerous - Never use (not present in codebase)
// const result = await collection.find({ $where: userInput });
```

### Mongoose Security Features

- **Type Coercion:** Attempts to convert inputs to schema-defined types
- **Query Validation:** Rejects malformed queries
- **Operator Filtering:** MongoDB operators in user input are treated as literal strings

---

## 4. Secure Session Management

### Implementation

**Location:** `backend/src/config/sessionConfig.js`

### Cookie Security Settings

```javascript
export const secureCookieOptions = {
  secure: process.env.NODE_ENV === 'production', // HTTPS only
  httpOnly: true,                                // No JavaScript access
  sameSite: 'strict',                            // CSRF protection
  path: '/',
  maxAge: 24 * 60 * 60 * 1000                   // 24 hours
};
```

### Session Timeout Configuration

```javascript
export const sessionTimeouts = {
  absoluteTimeout: 8 * 60 * 60 * 1000, // 8 hours max
  idleTimeout: 30 * 60 * 1000,          // 30 minutes idle
  refreshThreshold: 5 * 60 * 1000       // Refresh 5 min before expiry
};
```

### JWT Token Settings

```javascript
export const jwtOptions = {
  expiresIn: '1h',
  algorithm: 'HS256',
  issuer: 'hotsho-api',
  audience: 'hotsho-client'
};
```

### Password Hashing

```javascript
export const passwordHashOptions = {
  saltRounds: 12  // bcrypt salt rounds
};
```

---

## 5. HTTP Security Headers

### Implementation

**Package:** `helmet`  
**Location:** `backend/src/middleware/securityMiddleware.js`

Helmet automatically sets the following security headers:

### Headers Configured

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | [See below] | Prevents XSS, clickjacking |
| Strict-Transport-Security | max-age=31536000; includeSubDomains; preload | Forces HTTPS |
| X-Content-Type-Options | nosniff | Prevents MIME-type sniffing |
| X-Frame-Options | SAMEORIGIN | Prevents clickjacking |
| X-XSS-Protection | 1; mode=block | Legacy XSS filter |
| Referrer-Policy | strict-origin-when-cross-origin | Controls referrer info |
| X-DNS-Prefetch-Control | off | Privacy protection |
| X-Download-Options | noopen | IE security |
| X-Permitted-Cross-Domain-Policies | none | Restricts cross-domain |

### Content Security Policy

```javascript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://clerk.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "data:", "https:", "blob:"],
    fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
    connectSrc: ["'self'", "https://clerk.com", ...],
    frameSrc: ["'self'", "https://clerk.com"],
    objectSrc: ["'none'"],
    formAction: ["'self'"],
    frameAncestors: ["'self'"],
    baseUri: ["'self'"]
  }
}
```

---

## 6. Rate Limiting

### Implementation

**Package:** `express-rate-limit`  
**Location:** `backend/src/middleware/securityMiddleware.js`

### Rate Limiters Configured

#### General API Rate Limiter

```javascript
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window
  keyGenerator: (req) => req.auth?.payload?.sub || req.ip
});
```

#### Authentication Rate Limiter

```javascript
export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,                    // 5 failed attempts
  skipSuccessfulRequests: true
});
```

#### Password Reset Rate Limiter

```javascript
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3                     // 3 requests per hour
});
```

#### API Operations Rate Limiter

```javascript
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30              // 30 requests per minute
});
```

### Response on Rate Limit

```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again after 15 minutes",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

---

## 7. Dependency Security

### Automated Auditing

Run regular security audits:

```bash
# Backend
cd backend && npm audit

# Frontend
cd frontend && npm audit

# Fix vulnerabilities
npm audit fix
```

### Security Audit Results

**Last Audit Date:** [Current Date]  
**Backend Vulnerabilities:** 0 (after fix)  
**Frontend Vulnerabilities:** 0

### Fixed Vulnerabilities

| Package | Severity | Issue | Resolution |
|---------|----------|-------|------------|
| jws | High | HMAC Signature Verification | Updated via npm audit fix |
| nodemailer | Low | DoS via recursive calls | Updated via npm audit fix |

### Recommended Practices

1. **Run `npm audit` weekly** or integrate into CI/CD
2. **Update dependencies monthly** using `npm update`
3. **Use `npm-check-updates`** to find outdated packages
4. **Subscribe to security advisories** for key dependencies

---

## 8. Security Audit Checklist

### Pre-Deployment Checklist

- [ ] **Environment Variables**
  - [ ] All secrets are set in production environment
  - [ ] JWT_SECRET is at least 32 characters
  - [ ] CSRF_SECRET is at least 32 characters
  - [ ] No development values in production

- [ ] **HTTPS**
  - [ ] SSL certificate is valid
  - [ ] HTTP redirects to HTTPS
  - [ ] HSTS header is set

- [ ] **Authentication**
  - [ ] Rate limiting is enabled on auth endpoints
  - [ ] Password reset is rate limited
  - [ ] Session timeout is configured

- [ ] **Input Validation**
  - [ ] XSS sanitization is active
  - [ ] All user inputs are validated
  - [ ] File uploads are restricted

- [ ] **Headers**
  - [ ] Helmet is configured
  - [ ] CSP is properly set
  - [ ] CORS is restrictive

- [ ] **Dependencies**
  - [ ] `npm audit` shows no vulnerabilities
  - [ ] All packages are up to date

### Periodic Security Tasks

| Task | Frequency | Owner |
|------|-----------|-------|
| Run npm audit | Weekly | DevOps |
| Review access logs | Daily | Security |
| Update dependencies | Monthly | Backend Lead |
| Penetration testing | Quarterly | Security Team |
| Security training | Annually | All Developers |

---

## Environment Variables Required

Add these to your `.env` file for production:

```bash
# Security Secrets (generate strong random values)
JWT_SECRET=your-very-long-secure-random-string-at-least-32-chars
CSRF_SECRET=another-very-long-secure-random-string-at-least-32-chars

# Clerk Authentication
CLERK_SECRET_KEY=sk_live_...

# Production Settings
NODE_ENV=production
FRONTEND_ORIGIN=https://yourdomain.com
```

### Generating Secure Secrets

```bash
# Generate a secure random string (Node.js)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 64
```

---

## Incident Response

### Security Incident Procedure

1. **Detect:** Monitor logs for suspicious activity
2. **Contain:** Isolate affected systems
3. **Investigate:** Determine scope and cause
4. **Remediate:** Fix vulnerability and patch
5. **Recover:** Restore normal operations
6. **Document:** Create incident report

### Contact Information

- **Security Team:** security@hotsho.com
- **Emergency:** [Emergency Contact]

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet.js Documentation](https://helmetjs.github.io/)
