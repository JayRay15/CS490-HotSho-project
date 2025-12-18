/**
 * Resource Monitoring Utility
 * 
 * Monitors and tracks system resources including:
 * - CPU usage
 * - Memory usage
 * - Database connections
 * - API response times
 * - Request rates
 */

import mongoose from 'mongoose';
import os from 'os';
import { getConnectionStats, healthCheck as dbHealthCheck } from './db.js';
import { getStats as getCacheStats } from './cache.js';

// Monitoring state
const state = {
  startTime: Date.now(),
  requestCount: 0,
  errorCount: 0,
  responseTimes: [],
  maxResponseTimeHistory: 100, // Keep last 100 response times
  endpoints: new Map(), // Track per-endpoint stats
  alerts: [],
  maxAlerts: 50
};

// Thresholds for alerts
const THRESHOLDS = {
  memoryUsagePercent: 85,      // Alert if memory usage > 85%
  cpuUsagePercent: 80,         // Alert if CPU usage > 80%
  responseTimeMs: 5000,        // Alert if response time > 5s
  errorRatePercent: 10,        // Alert if error rate > 10%
  dbConnectionsPercent: 80     // Alert if using > 80% of pool
};

/**
 * Get CPU usage percentage
 * Note: This is a snapshot, not real-time average
 */
const getCpuUsage = () => {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;
  
  cpus.forEach(cpu => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });
  
  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = ((total - idle) / total) * 100;
  
  return {
    usage: usage.toFixed(2),
    cores: cpus.length,
    model: cpus[0]?.model || 'Unknown'
  };
};

/**
 * Get memory usage
 */
const getMemoryUsage = () => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  
  const processMemory = process.memoryUsage();
  
  return {
    system: {
      total: formatBytes(totalMemory),
      free: formatBytes(freeMemory),
      used: formatBytes(usedMemory),
      usagePercent: ((usedMemory / totalMemory) * 100).toFixed(2)
    },
    process: {
      heapTotal: formatBytes(processMemory.heapTotal),
      heapUsed: formatBytes(processMemory.heapUsed),
      external: formatBytes(processMemory.external),
      rss: formatBytes(processMemory.rss),
      heapUsagePercent: ((processMemory.heapUsed / processMemory.heapTotal) * 100).toFixed(2)
    }
  };
};

/**
 * Format bytes to human readable format
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get database connection stats
 */
const getDatabaseStats = async () => {
  const connectionStats = getConnectionStats();
  const health = await dbHealthCheck();
  
  // Get MongoDB server stats if connected
  let serverStats = null;
  if (mongoose.connection.readyState === 1) {
    try {
      const adminDb = mongoose.connection.db.admin();
      serverStats = await adminDb.serverStatus();
    } catch (err) {
      // May not have admin access
    }
  }
  
  return {
    connection: connectionStats,
    health: health.healthy,
    serverStats: serverStats ? {
      connections: serverStats.connections,
      opcounters: serverStats.opcounters,
      uptime: serverStats.uptime
    } : null
  };
};

/**
 * Record a request for monitoring
 */
export const recordRequest = (req, res, responseTime) => {
  state.requestCount++;
  
  // Track response time
  state.responseTimes.push(responseTime);
  if (state.responseTimes.length > state.maxResponseTimeHistory) {
    state.responseTimes.shift();
  }
  
  // Track errors
  if (res.statusCode >= 400) {
    state.errorCount++;
  }
  
  // Track per-endpoint stats
  const endpoint = `${req.method} ${req.path}`;
  if (!state.endpoints.has(endpoint)) {
    state.endpoints.set(endpoint, { count: 0, totalTime: 0, errors: 0 });
  }
  const endpointStats = state.endpoints.get(endpoint);
  endpointStats.count++;
  endpointStats.totalTime += responseTime;
  if (res.statusCode >= 400) {
    endpointStats.errors++;
  }
  
  // Check for alerts
  if (responseTime > THRESHOLDS.responseTimeMs) {
    addAlert('slow_response', `Slow response: ${endpoint} took ${responseTime}ms`);
  }
};

/**
 * Add an alert
 */
const addAlert = (type, message) => {
  state.alerts.unshift({
    type,
    message,
    timestamp: new Date().toISOString()
  });
  
  if (state.alerts.length > state.maxAlerts) {
    state.alerts.pop();
  }
};

/**
 * Get request statistics
 */
const getRequestStats = () => {
  const responseTimes = state.responseTimes;
  const avgResponseTime = responseTimes.length > 0
    ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2)
    : 0;
  
  const sortedTimes = [...responseTimes].sort((a, b) => a - b);
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
  
  const errorRate = state.requestCount > 0
    ? ((state.errorCount / state.requestCount) * 100).toFixed(2)
    : 0;
  
  // Get top endpoints by request count
  const topEndpoints = Array.from(state.endpoints.entries())
    .map(([endpoint, stats]) => ({
      endpoint,
      count: stats.count,
      avgResponseTime: (stats.totalTime / stats.count).toFixed(2),
      errorRate: ((stats.errors / stats.count) * 100).toFixed(2)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  return {
    totalRequests: state.requestCount,
    totalErrors: state.errorCount,
    errorRate: `${errorRate}%`,
    responseTime: {
      average: `${avgResponseTime}ms`,
      p50: `${p50}ms`,
      p95: `${p95}ms`,
      p99: `${p99}ms`
    },
    topEndpoints
  };
};

/**
 * Check system health and generate alerts
 */
const checkHealth = async () => {
  const alerts = [];
  
  const memory = getMemoryUsage();
  if (parseFloat(memory.system.usagePercent) > THRESHOLDS.memoryUsagePercent) {
    alerts.push({
      type: 'memory',
      severity: 'warning',
      message: `High memory usage: ${memory.system.usagePercent}%`
    });
  }
  
  const cpu = getCpuUsage();
  if (parseFloat(cpu.usage) > THRESHOLDS.cpuUsagePercent) {
    alerts.push({
      type: 'cpu',
      severity: 'warning',
      message: `High CPU usage: ${cpu.usage}%`
    });
  }
  
  const requestStats = getRequestStats();
  if (parseFloat(requestStats.errorRate) > THRESHOLDS.errorRatePercent) {
    alerts.push({
      type: 'errors',
      severity: 'critical',
      message: `High error rate: ${requestStats.errorRate}`
    });
  }
  
  return alerts;
};

/**
 * Get complete monitoring report
 */
export const getMonitoringReport = async () => {
  const uptime = Math.floor((Date.now() - state.startTime) / 1000);
  
  const [dbStats, healthAlerts] = await Promise.all([
    getDatabaseStats(),
    checkHealth()
  ]);
  
  return {
    status: healthAlerts.length === 0 ? 'healthy' : 'degraded',
    uptime: {
      seconds: uptime,
      formatted: formatUptime(uptime)
    },
    system: {
      cpu: getCpuUsage(),
      memory: getMemoryUsage(),
      platform: process.platform,
      nodeVersion: process.version
    },
    database: dbStats,
    cache: getCacheStats(),
    requests: getRequestStats(),
    alerts: {
      current: healthAlerts,
      recent: state.alerts.slice(0, 10)
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Format uptime to human readable format
 */
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  
  return parts.join(' ');
};

/**
 * Monitoring middleware
 * Tracks request timing and records metrics
 */
export const monitoringMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Override res.end to capture timing
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - start;
    recordRequest(req, res, responseTime);
    
    // Add timing header
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    
    return originalEnd.apply(this, args);
  };
  
  next();
};

/**
 * Reset monitoring state (for testing)
 */
export const resetMonitoringState = () => {
  state.requestCount = 0;
  state.errorCount = 0;
  state.responseTimes = [];
  state.endpoints.clear();
  state.alerts = [];
};

export default {
  getMonitoringReport,
  monitoringMiddleware,
  recordRequest,
  resetMonitoringState,
  THRESHOLDS
};
