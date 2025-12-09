# Monitoring and Incident Response Guide

This document provides comprehensive guidance on the monitoring and logging infrastructure, including setup instructions, usage guidelines, and incident response procedures.

## Table of Contents

1. [Overview](#overview)
2. [Monitoring Components](#monitoring-components)
3. [Setup Instructions](#setup-instructions)
4. [Usage Guide](#usage-guide)
5. [Incident Response Procedures](#incident-response-procedures)
6. [Alerting Configuration](#alerting-configuration)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The application includes a comprehensive monitoring and logging system with the following capabilities:

- **Structured Logging**: JSON-formatted logs with searchable fields
- **Error Tracking**: Sentry integration for error capture and alerting
- **Health Checks**: Endpoints for uptime monitoring (UptimeRobot compatible)
- **Performance Metrics**: API response times and error rates
- **Dashboard**: Real-time metrics visualization

---

## Monitoring Components

### Backend Components

| Component | File | Description |
|-----------|------|-------------|
| Logger | `src/utils/logger.js` | Structured logging with levels and metrics |
| Sentry | `src/utils/sentry.js` | Error tracking and performance monitoring |
| Request Logging | `src/middleware/requestLogging.js` | HTTP request/response logging |
| Monitoring Routes | `src/routes/monitoringRoutes.js` | Health check and metrics endpoints |
| Error Handler | `src/middleware/errorHandler.js` | Global error handling with logging |

### Frontend Components

| Component | File | Description |
|-----------|------|-------------|
| Sentry | `src/utils/sentry.js` | Frontend error tracking |
| ErrorBoundary | `src/components/ErrorBoundary.jsx` | React error boundary with Sentry |
| Monitoring Dashboard | `src/pages/SystemMonitoringDashboard.jsx` | Metrics visualization |
| Test Error Page | `src/pages/TestErrorPage.jsx` | Error verification testing |

---

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env` files:

#### Backend (.env)

```env
# Sentry Configuration (get from https://sentry.io)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Logging Configuration
LOG_LEVEL=info  # Options: error, warn, info, http, debug
LOG_REQUEST_BODY=false  # Set to true to log request bodies (dev only)

# Application Version (for release tracking)
APP_VERSION=1.0.0

# Allow test errors in production (optional, not recommended)
ALLOW_TEST_ERRORS=false
```

#### Frontend (.env)

```env
# Sentry Configuration
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Application Version
VITE_APP_VERSION=1.0.0
```

### 2. Install Dependencies

#### Backend

```bash
cd backend
npm install @sentry/node uuid
```

#### Frontend

```bash
cd frontend
npm install @sentry/react
```

### 3. Sentry Setup

1. Create a free account at [sentry.io](https://sentry.io)
2. Create two projects:
   - **Node.js** project for backend
   - **React** project for frontend
3. Copy the DSN from Project Settings > Client Keys
4. Add to environment variables as shown above

### 4. UptimeRobot Setup

1. Create a free account at [uptimerobot.com](https://uptimerobot.com)
2. Add a new monitor:
   - **Monitor Type**: HTTP(s)
   - **URL**: `https://your-domain.com/api/monitoring/health`
   - **Monitoring Interval**: 5 minutes
3. Configure alerts (email, SMS, Slack, etc.)

---

## Usage Guide

### Health Check Endpoints

| Endpoint | Description | Use Case |
|----------|-------------|----------|
| `GET /api/monitoring/health` | Basic health check | UptimeRobot, load balancers |
| `GET /api/monitoring/health/detailed` | Detailed health with service status | Debugging, dashboards |
| `GET /api/monitoring/ready` | Readiness probe | Kubernetes |
| `GET /api/monitoring/live` | Liveness probe | Kubernetes |
| `GET /api/monitoring/metrics` | Application metrics | Monitoring dashboards |
| `GET /api/monitoring/dashboard` | Comprehensive dashboard data | Admin UI |

### Log Levels

| Level | When to Use |
|-------|-------------|
| `error` | Critical errors requiring immediate attention |
| `warn` | Warning conditions to monitor |
| `info` | Normal operational messages |
| `http` | HTTP request/response logging |
| `debug` | Detailed debugging information |

### Using the Logger

```javascript
import logger from './utils/logger.js';

// Basic logging
logger.info('Operation completed', { userId: 123, action: 'update' });
logger.error('Database connection failed', { error: err.message });

// Request-scoped logging
const reqLogger = logger.forRequest(req);
reqLogger.info('Processing request');

// Timed operations
const result = await logger.time('fetchUserData', async () => {
  return await User.findById(userId);
}, { userId });
```

### Frontend Error Tracking

```javascript
import { captureException, captureMessage, addBreadcrumb } from './utils/sentry';

// Capture an error
try {
  riskyOperation();
} catch (error) {
  captureException(error, { context: 'user_action' });
}

// Add context breadcrumbs
addBreadcrumb('User clicked save', 'ui', 'info', { formId: 'profile' });

// Capture a message
captureMessage('User completed onboarding', 'info', { userId });
```

---

## Incident Response Procedures

### Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **P1 - Critical** | Service is down | 15 minutes | Database offline, API unreachable |
| **P2 - High** | Major feature broken | 1 hour | Authentication failing, payment errors |
| **P3 - Medium** | Minor feature impact | 4 hours | Slow responses, non-critical errors |
| **P4 - Low** | Cosmetic/minor issues | 24 hours | UI bugs, minor logging issues |

### Incident Response Steps

#### 1. Detection

Incidents can be detected via:
- UptimeRobot alerts (downtime)
- Sentry alerts (error spikes)
- System Monitoring Dashboard
- User reports

#### 2. Triage

1. Check the System Monitoring Dashboard (`/admin/system-monitoring`)
2. Review recent errors in Sentry
3. Check health endpoint: `GET /api/monitoring/health/detailed`
4. Review server logs

#### 3. Communication

For P1/P2 incidents:
1. Acknowledge the alert
2. Post in team communication channel
3. Update status page (if applicable)

#### 4. Investigation

```bash
# Check server logs
tail -f /var/log/app/server.log | grep ERROR

# Check health endpoints
curl http://localhost:5000/api/monitoring/health/detailed

# Check database connection
curl http://localhost:5000/api/monitoring/ready
```

#### 5. Resolution

1. Implement fix
2. Deploy to staging
3. Verify fix in staging
4. Deploy to production
5. Verify fix in production
6. Update incident log

#### 6. Post-Incident

1. Document the incident
2. Identify root cause
3. Implement preventive measures
4. Update monitoring/alerting if needed

### Incident Log Template

```markdown
## Incident: [Title]

**Date**: YYYY-MM-DD
**Severity**: P1/P2/P3/P4
**Duration**: X hours Y minutes
**Affected Systems**: [List]

### Timeline
- HH:MM - Issue detected
- HH:MM - Investigation started
- HH:MM - Root cause identified
- HH:MM - Fix implemented
- HH:MM - Issue resolved

### Root Cause
[Description of what caused the incident]

### Resolution
[Description of how it was fixed]

### Preventive Measures
[List of actions to prevent recurrence]
```

---

## Alerting Configuration

### Sentry Alert Rules

Configure in Sentry Dashboard > Alerts:

1. **Critical Error Alert**
   - When: Error occurs more than 10 times in 1 hour
   - Action: Email + Slack notification

2. **Error Spike Alert**
   - When: Error count increases 200% vs previous hour
   - Action: Email notification

3. **Performance Alert**
   - When: Transaction duration > 5 seconds
   - Action: Slack notification

### UptimeRobot Configuration

| Monitor | Check Interval | Alert Contacts |
|---------|---------------|----------------|
| API Health | 5 min | Team email |
| Frontend | 5 min | Team email |
| Database (via health) | 5 min | Team email |

---

## Troubleshooting

### Common Issues

#### Sentry Not Receiving Events

1. Verify DSN is correct in environment
2. Check network connectivity to Sentry
3. Verify Sentry package is installed
4. Check browser console for Sentry errors

```bash
# Test Sentry connection (backend)
curl -X POST /api/monitoring/test-error -H "Content-Type: application/json" -d '{"type":"error"}'
```

#### High Error Rate

1. Check recent deployments
2. Review Sentry error groupings
3. Check database connection status
4. Review memory and CPU usage

```bash
# Check health details
curl http://localhost:5000/api/monitoring/health/detailed
```

#### Slow Response Times

1. Check API performance metrics at `/api/monitoring/metrics`
2. Review slow endpoints in dashboard
3. Check database query performance
4. Review memory usage

### Debug Commands

```bash
# Check server is running
curl http://localhost:5000/api/monitoring/live

# Get detailed health status
curl http://localhost:5000/api/monitoring/health/detailed | jq

# Get metrics
curl http://localhost:5000/api/monitoring/metrics | jq

# Get dashboard data
curl http://localhost:5000/api/monitoring/dashboard | jq
```

---

## Dashboard URLs

| Dashboard | URL | Description |
|-----------|-----|-------------|
| System Monitoring | `/admin/system-monitoring` | Real-time metrics |
| API Monitoring | `/admin/api-monitoring` | External API usage |
| Test Errors | `/admin/test-errors` | Error verification |
| Sentry | `https://sentry.io` | Error tracking |
| UptimeRobot | `https://uptimerobot.com` | Uptime monitoring |

---

## Contact Information

For critical incidents, contact:
- **On-Call Engineer**: [Define rotation]
- **Team Lead**: [Contact info]
- **Escalation**: [Contact info]

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2024-12-09 | 1.0 | Initial documentation |
