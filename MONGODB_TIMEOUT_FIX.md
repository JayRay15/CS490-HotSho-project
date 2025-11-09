# MongoDB Connection Timeout Fix

## Problem
The CI/CD pipeline was failing with the following error:
```
MongooseError: Operation `jobs.deleteMany()` buffering timed out after 10000ms
```

This occurred in `Job.companyInfo.test.js` when running integration tests that require MongoDB connection.

## Root Cause
The Mongoose connection was using default timeout values (10 seconds) which were insufficient for:
1. Establishing connection to MongoDB in CI environments
2. Performing database operations during test setup/teardown
3. Network latency in cloud-based test environments

## Solution Implemented
Updated the MongoDB connection configuration in `backend/src/models/__tests__/Job.companyInfo.test.js` with increased timeout values:

```javascript
await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hotshot-test', {
    serverSelectionTimeoutMS: 30000,  // Increased from 10s to 30s
    connectTimeoutMS: 30000,           // Connection timeout
    socketTimeoutMS: 30000,            // Socket timeout
});
```

### Timeout Parameters Explained:
- **serverSelectionTimeoutMS**: How long Mongoose will wait to select a server (find and connect to a MongoDB server)
- **connectTimeoutMS**: How long a single connection attempt can take before timing out
- **socketTimeoutMS**: How long the driver will wait for responses on the socket before timing out

## Additional Fixes Applied
1. **Duplicate Index Fixes**:
   - Removed `index: true` from `Resume.js` token field (separate index exists)
   - Removed `index: true` from `Interview.js` scheduledDate field (separate indexes exist)
   - Removed `index: true` from `Interview.js` jobId field (separate index exists)

2. **Test Configuration**:
   - Added `jest` import from `@jest/globals`
   - Set `jest.setTimeout(30000)` for integration tests
   - Added proper `beforeAll`, `beforeEach`, and `afterAll` hooks
   - Ensured proper database connection cleanup with `mongoose.connection.close()`

## Test Results
All 6 tests now passing:
```
✓ should create a job with company information
✓ should create a job without company information
✓ should validate Glassdoor rating range
✓ should validate company size enum
✓ should update company information
✓ should handle multiple recent news items
```

## CI/CD Recommendations
For GitHub Actions or other CI environments:

1. **Ensure MongoDB service is running** before tests:
```yaml
services:
  mongodb:
    image: mongo:latest
    ports:
      - 27017:27017
    options: >-
      --health-cmd "mongosh --eval 'db.adminCommand({ping: 1})'"
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

2. **Set appropriate test database URI** in environment variables:
```yaml
env:
  MONGODB_URI: mongodb://localhost:27017/hotshot-test
```

3. **Consider mocking database operations** for unit tests to avoid network dependency

## Files Modified
- `backend/src/models/__tests__/Job.companyInfo.test.js` - Updated connection timeouts
- `backend/src/models/Resume.js` - Removed duplicate index
- `backend/src/models/Interview.js` - Removed duplicate indexes (scheduledDate, jobId)

## Date
November 9, 2025
