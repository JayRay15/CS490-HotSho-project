# Scalability Implementation Guide

## Overview

This document outlines the scalability measures implemented in the HotSho application to ensure it remains performant as the user base grows.

**Implementation Date:** December 2024  
**Version:** 1.0.0

---

## Table of Contents

1. [Database Connection Pooling](#1-database-connection-pooling)
2. [Caching Layer](#2-caching-layer)
3. [Database Indexes](#3-database-indexes)
4. [Pagination](#4-pagination)
5. [Resource Monitoring](#5-resource-monitoring)
6. [Auto-Scaling Strategies](#6-auto-scaling-strategies)
7. [Load Testing](#7-load-testing)
8. [Future Growth Strategies](#8-future-growth-strategies)

---

## 1. Database Connection Pooling

### Implementation

**Location:** `backend/src/utils/db.js`

MongoDB connection pooling is configured to efficiently manage database connections:

```javascript
const connectionOptions = {
  maxPoolSize: 10,           // Maximum connections in pool
  minPoolSize: 2,            // Minimum connections to maintain
  maxIdleTimeMS: 30000,      // Close idle connections after 30s
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  compressors: ['zlib'],     // Enable compression
  w: 'majority',             // Write concern
  retryWrites: true,
  retryReads: true
};
```

### Pool Size Guidelines

| User Base | maxPoolSize | minPoolSize |
|-----------|-------------|-------------|
| < 1,000 users | 10 | 2 |
| 1,000 - 10,000 | 20 | 5 |
| 10,000 - 50,000 | 50 | 10 |
| > 50,000 | 100 | 20 |

### Monitoring Pool Health

```bash
# Check connection stats via API
curl http://localhost:5000/api/monitoring

# Or via MongoDB shell
db.serverStatus().connections
```

---

## 2. Caching Layer

### Implementation

**Location:** `backend/src/utils/cache.js`

A two-tier caching strategy is implemented:

1. **Primary:** Redis (for production/distributed)
2. **Fallback:** In-memory cache (node-cache)

### Redis Free Tier Options

| Provider | Free Tier | Recommended For |
|----------|-----------|-----------------|
| [Redis Cloud](https://redis.com/redis-enterprise-cloud/) | 30MB | Production |
| [Upstash](https://upstash.com/) | 10K commands/day | Development |
| [Railway](https://railway.app/) | 500MB | Side projects |

### Configuration

Set environment variables:

```bash
# Option 1: Redis URL (most providers)
REDIS_URL=redis://default:password@host:port

# Option 2: Individual settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_TLS=true
```

### Cache TTL Configuration

| Data Type | TTL | Reason |
|-----------|-----|--------|
| User Profile | 10 min | Infrequent changes |
| Job List | 2 min | Active updates |
| Dashboard | 3 min | Moderate activity |
| Analytics | 15 min | Expensive queries |
| Company Info | 1 hour | Rarely changes |
| Templates | 1 hour | Static data |

### Cache Invalidation

Cache is automatically invalidated when data changes:

```javascript
// In controllers, after data mutation:
import { invalidateUserCache } from '../utils/cache.js';

await invalidateUserCache(userId);
```

---

## 3. Database Indexes

### Implementation

**Location:** `backend/scripts/optimizeIndexes.js`

Run the index optimization script:

```bash
cd backend
node scripts/optimizeIndexes.js
```

### Key Indexes

#### Jobs Collection
```javascript
{ userId: 1 }                        // Primary lookup
{ userId: 1, status: 1 }             // Status filtering
{ userId: 1, archived: 1 }           // Archive filtering
{ userId: 1, createdAt: -1 }         // Sorted listings
{ title: 'text', company: 'text' }   // Full-text search
```

#### Users Collection
```javascript
{ clerkId: 1 }                       // Auth lookup (unique)
{ email: 1 }                         // Email lookup (unique)
```

### Index Maintenance

```bash
# Check index usage
db.jobs.aggregate([{ $indexStats: {} }])

# Rebuild indexes if needed
db.jobs.reIndex()
```

---

## 4. Pagination

### Implementation

**Location:** `backend/src/utils/pagination.js`

Two pagination strategies are available:

### Offset-Based Pagination

Best for: Small to medium datasets, random access

```javascript
GET /api/jobs?page=1&limit=20&sortBy=createdAt&sortOrder=desc
```

Response:
```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 200,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Cursor-Based Pagination

Best for: Large datasets, infinite scroll

```javascript
GET /api/jobs?cursor=lastItemId&limit=20
```

Response:
```json
{
  "data": [...],
  "pagination": {
    "hasMore": true,
    "nextCursor": "507f1f77bcf86cd799439011",
    "count": 20
  }
}
```

### Frontend Integration

```javascript
// Offset-based
const fetchJobs = async (page = 1) => {
  const res = await fetch(`/api/jobs?page=${page}&limit=20`);
  return res.json();
};

// Cursor-based (infinite scroll)
const fetchMoreJobs = async (cursor) => {
  const url = cursor 
    ? `/api/jobs?cursor=${cursor}&limit=20`
    : `/api/jobs?limit=20`;
  return fetch(url).then(r => r.json());
};
```

---

## 5. Resource Monitoring

### Implementation

**Location:** `backend/src/utils/monitoring.js`

### Monitoring Endpoints

```bash
# Quick health check
GET /api/health

# Detailed monitoring report
GET /api/monitoring
```

### Monitored Metrics

| Metric | Threshold | Alert |
|--------|-----------|-------|
| Memory Usage | > 85% | Warning |
| CPU Usage | > 80% | Warning |
| Response Time | > 5000ms | Warning |
| Error Rate | > 10% | Critical |
| DB Connections | > 80% of pool | Warning |

### Sample Monitoring Response

```json
{
  "status": "healthy",
  "uptime": { "seconds": 3600, "formatted": "1h 0m 0s" },
  "system": {
    "cpu": { "usage": "12.50", "cores": 4 },
    "memory": {
      "system": { "used": "4.2 GB", "usagePercent": "52.50" },
      "process": { "heapUsed": "85 MB", "heapUsagePercent": "45.00" }
    }
  },
  "database": {
    "connection": { "state": "connected", "poolSize": 10 },
    "health": true
  },
  "cache": {
    "cacheType": "redis",
    "hitRate": "85.50%",
    "totalOperations": 1500
  },
  "requests": {
    "totalRequests": 5000,
    "errorRate": "0.50%",
    "responseTime": { "average": "120ms", "p95": "350ms" }
  }
}
```

---

## 6. Auto-Scaling Strategies

### Free Tier Options

#### Railway.app (Recommended)
- Auto-sleep when inactive
- Scale on demand
- $5 free credits/month

```yaml
# railway.toml
[deploy]
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
```

#### Render.com
- Free tier with auto-scaling
- Sleep after 15 min inactivity

#### Fly.io
- Free tier available
- Global deployment

### Manual Scaling Checklist

When traffic increases:

1. **Horizontal Scaling**
   - Add more server instances
   - Use load balancer (nginx, HAProxy)

2. **Database Scaling**
   - Increase connection pool size
   - Add read replicas
   - Enable MongoDB sharding

3. **Cache Scaling**
   - Upgrade Redis tier
   - Add Redis Cluster

### Environment-Based Configuration

```javascript
// config/scaling.js
export const scalingConfig = {
  development: {
    dbPoolSize: 5,
    cacheEnabled: false,
    rateLimit: 1000
  },
  staging: {
    dbPoolSize: 10,
    cacheEnabled: true,
    rateLimit: 500
  },
  production: {
    dbPoolSize: 20,
    cacheEnabled: true,
    rateLimit: 100
  }
};
```

---

## 7. Load Testing

### Tools Recommended

1. **Artillery** (JavaScript-based)
2. **k6** (Modern, scriptable)
3. **Apache Bench** (Simple HTTP testing)

### Load Test Script

**Location:** `backend/scripts/loadTest.js`

```bash
# Run load test
cd backend
node scripts/loadTest.js

# Or with Artillery
npx artillery run load-test.yml
```

### Test Scenarios

| Scenario | Concurrent Users | Duration | Pass Criteria |
|----------|------------------|----------|---------------|
| Normal Load | 50 | 5 min | p95 < 500ms |
| Peak Load | 200 | 10 min | p95 < 2000ms |
| Stress Test | 500 | 15 min | No crashes |
| Soak Test | 100 | 1 hour | Memory stable |

### Performance Baselines

| Endpoint | Expected p50 | Expected p95 |
|----------|--------------|--------------|
| GET /api/health | < 10ms | < 50ms |
| GET /api/jobs | < 100ms | < 300ms |
| POST /api/jobs | < 150ms | < 500ms |
| GET /api/jobs/:id | < 80ms | < 200ms |

---

## 8. Future Growth Strategies

### Short-Term (< 10,000 users)

- [x] Connection pooling
- [x] In-memory caching
- [x] Database indexes
- [x] Basic monitoring
- [ ] CDN for static assets

### Medium-Term (10,000 - 100,000 users)

- [ ] Redis cluster
- [ ] Read replicas for MongoDB
- [ ] Job queues (Bull/BullMQ)
- [ ] Microservices split
- [ ] Kubernetes deployment

### Long-Term (> 100,000 users)

- [ ] MongoDB sharding
- [ ] Multi-region deployment
- [ ] GraphQL for efficient data fetching
- [ ] Event-driven architecture
- [ ] Dedicated search (Elasticsearch)

### Architecture Evolution

```
Current:              Short-Term:           Long-Term:
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Client  │         │  Client  │         │  Client  │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     ▼                    ▼                    ▼
┌──────────┐         ┌──────────┐         ┌──────────┐
│ Express  │         │   CDN    │         │  Gateway │
│  Server  │         └────┬─────┘         └────┬─────┘
└────┬─────┘              │                    │
     │               ┌────┴─────┐         ┌────┴─────┐
     ▼               ▼          ▼         ▼          ▼
┌──────────┐    ┌──────┐  ┌──────┐   ┌──────┐  ┌──────┐
│ MongoDB  │    │Server│  │Redis │   │Svc A │  │Svc B │
└──────────┘    └──┬───┘  └──────┘   └──┬───┘  └──┬───┘
                   │                     │         │
                   ▼                     ▼         ▼
              ┌──────────┐          ┌──────────────────┐
              │ MongoDB  │          │  MongoDB Cluster │
              │ + Replica│          │    (Sharded)     │
              └──────────┘          └──────────────────┘
```

---

## Configuration Reference

### Environment Variables

```bash
# Database
MONGO_URI=mongodb+srv://...
DB_POOL_SIZE=10
DB_MIN_POOL_SIZE=2

# Cache (Redis)
REDIS_URL=redis://...
CACHE_ENABLED=true
CACHE_DEFAULT_TTL=300

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
MONITORING_ENABLED=true
ALERT_EMAIL=admin@example.com
```

### Performance Tuning

```javascript
// Recommended Node.js settings
// Add to package.json scripts or deployment config
{
  "start": "node --max-old-space-size=512 src/server.js"
}
```

---

## Maintenance Tasks

### Daily
- Review error logs
- Check cache hit rate
- Monitor response times

### Weekly
- Run `npm audit`
- Review slow queries
- Check disk usage

### Monthly
- Update dependencies
- Review database indexes
- Load test critical paths
- Backup verification

---

## References

- [MongoDB Performance Best Practices](https://docs.mongodb.com/manual/administration/production-notes/)
- [Redis Optimization Guide](https://redis.io/topics/memory-optimization)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express.js Performance Tips](https://expressjs.com/en/advanced/best-practice-performance.html)
