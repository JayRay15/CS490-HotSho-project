# Security and Scalability Demo Guide

This guide explains how to showcase the security and scalability features during the Sprint 4 demo.

## 1. Security Protections Demo

### 1.1 CSRF Protection (Form Submission)

**What to show:**
- Open browser DevTools → Network tab
- Submit a form (e.g., create job application, update profile)
- In the request headers, show the `X-CSRF-Token` header is present
- Explain: "All form submissions include CSRF tokens to prevent cross-site request forgery attacks"

**How to verify:**
1. Open DevTools (F12) → Network tab
2. Filter by "XHR" or "Fetch"
3. Submit any form in the application
4. Click on the request → Headers tab
5. Look for `X-CSRF-Token` header

**If CSRF token is missing:**
- Check that frontend is reading the token from cookies
- Verify `attachCsrfToken` middleware is being called

### 1.2 XSS Protection (Malicious Input Test)

**What to show:**
- Navigate to any text input field (e.g., job title, company name)
- Enter malicious script: `<script>alert('XSS')</script>`
- Submit the form
- Show that the script is sanitized and doesn't execute
- In the database or response, show the sanitized version: `&lt;script&gt;alert('XSS')&lt;/script&gt;`

**How to verify:**
1. Go to any form (e.g., Add Job, Edit Profile)
2. Enter: `<script>alert('XSS')</script>` in a text field
3. Submit the form
4. View the saved data - it should be escaped/sanitized
5. Check browser console - no alert should appear

**Backend verification:**
- All inputs go through `sanitizeInput` middleware
- Uses `xss` library with strict whitelist (no HTML tags allowed)

### 1.3 Security Headers (CSP, HSTS)

**What to show:**
- Open browser DevTools → Network tab
- Load any page
- Click on any request → Headers tab → Response Headers
- Show these headers:
  - `Content-Security-Policy` - Shows allowed sources for scripts, styles, etc.
  - `Strict-Transport-Security` (HSTS) - Forces HTTPS
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`

**How to verify:**
1. Open DevTools (F12) → Network tab
2. Reload the page
3. Click on the main document request (usually the first one)
4. Scroll to "Response Headers"
5. Look for security headers listed above

**Expected headers:**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' ...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
```

### 1.4 SQL Injection Prevention

**What to say:**
- "All database queries use parameterized queries through Mongoose ORM"
- "MongoDB with Mongoose automatically escapes special characters"
- "No raw string concatenation in database queries"

**How to verify (code review):**
- Show that all database queries use Mongoose models
- No direct MongoDB queries with string interpolation
- Example: `User.findOne({ email: req.body.email })` ✅
- Bad: `User.findOne({ email: req.body.email + "' OR 1=1" })` ❌

## 2. Scalability Features Demo

### 2.1 Load Testing Results

**What to show:**
- Display pre-run load test results report
- Show metrics:
  - 50 concurrent users
  - Average response time < 500ms
  - 95th percentile < 500ms
  - Error rate < 1%

**How to run load test:**
```bash
cd backend
node scripts/loadTest.js --concurrent=50 --duration=60
```

**Save results:**
- Copy the console output to a file: `load-test-results.txt`
- Or redirect output: `node scripts/loadTest.js --concurrent=50 --duration=60 > load-test-results.txt`

**What to highlight:**
- "50 concurrent users handled successfully"
- "Sub-500ms response times for 95% of requests"
- "Error rate below 1%"
- "Production-ready infrastructure"

### 2.2 Redis Caching Layer

**What to show:**
- Explain: "Redis caching layer reduces database load"
- Show cache statistics (if available via monitoring endpoint)
- Or show in logs: "✅ Redis cache connected and ready"

**How to verify:**
1. Check backend logs on startup:
   - Look for: `✅ Redis cache connected and ready`
   - Or: `⚠️ Redis connection failed, using in-memory cache` (fallback)

2. Check environment variables:
   - `REDIS_URL` or `REDIS_HOST` should be set in production

3. Monitor cache usage:
   - Check `/api/monitoring` endpoint (if cache stats are exposed)
   - Or check backend logs for cache hit/miss messages

**What to say:**
- "Redis caching layer implemented with automatic fallback to in-memory cache"
- "Frequently accessed data cached to reduce database queries"
- "Cache TTLs configured per data type (user data: 10min, job lists: 2min)"

### 2.3 Database Connection Pooling

**What to show:**
- Explain: "MongoDB connection pooling configured for scalability"
- Show connection pool settings:
  - Max pool size: 10 connections
  - Min pool size: 2 connections
  - Connection timeout: 10 seconds

**How to verify:**
1. Check `backend/src/utils/db.js`:
   - Show `maxPoolSize: 10`
   - Show `minPoolSize: 2`

2. Check backend logs on startup:
   - Look for: `Pool Size: min=2, max=10`

3. Monitor connections (if monitoring endpoint available):
   - Check `/api/monitoring` for connection stats

**What to say:**
- "Connection pooling efficiently manages database connections"
- "Prevents connection exhaustion under load"
- "Automatically scales between min and max pool size"

## 3. Demo Script

### Quick Demo Flow (2-3 minutes)

1. **Security Headers (30 seconds)**
   - Open DevTools → Network → Click main request → Show Response Headers
   - Point out CSP, HSTS, X-Frame-Options
   - "Enterprise-grade security headers protect against common attacks"

2. **XSS Protection (30 seconds)**
   - Enter `<script>alert('test')</script>` in a form field
   - Submit and show it's sanitized
   - "All inputs sanitized to prevent XSS attacks"

3. **Load Testing Results (30 seconds)**
   - Open `load-test-results.txt` or show console output
   - Highlight: "50 concurrent users, sub-500ms response times"
   - "Production-ready performance"

4. **Infrastructure (30 seconds)**
   - Show Redis connection in logs: "✅ Redis cache connected"
   - Show database pooling config: "Connection pool: min=2, max=10"
   - "Scalable infrastructure handles growth efficiently"

## 4. Troubleshooting

### Security Headers Not Showing
- Verify `helmetMiddleware` is imported and used in `server.js`
- Check that middleware is applied before routes
- Ensure production environment is set (`NODE_ENV=production`)

### CSRF Token Missing
- Check frontend is reading `XSRF-TOKEN` cookie
- Verify `attachCsrfToken` middleware is called
- Check CORS allows credentials if needed

### Redis Not Connected
- Check `REDIS_URL` or `REDIS_HOST` environment variable
- Verify Redis service is running (if local)
- Application will fallback to in-memory cache automatically
- This is acceptable for demo - mention "graceful fallback"

### Load Test Fails
- Ensure backend is running
- Check API endpoints are accessible
- Reduce concurrent users if needed: `--concurrent=10`
- Test locally first before production

## 5. Pre-Demo Checklist

- [ ] Security middleware added to `server.js`
- [ ] Backend restarted with security middleware active
- [ ] Load test run and results saved
- [ ] Redis connection verified (or fallback confirmed)
- [ ] Database connection pooling verified in logs
- [ ] Browser DevTools ready to show headers
- [ ] Test form ready for XSS demonstration
- [ ] Load test results file accessible

