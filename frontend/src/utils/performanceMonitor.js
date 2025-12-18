/**
 * Performance Monitoring Hook for React
 * 
 * Tracks and reports frontend performance metrics
 * including component render times, API call durations,
 * and user interaction responsiveness.
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// Performance metrics storage
const metrics = {
  apiCalls: [],
  renders: [],
  interactions: [],
  errors: []
};

/**
 * Hook to monitor API call performance
 * 
 * @returns {Function} Wrapped fetch function with timing
 */
export const usePerformanceMonitor = () => {
  const measureApiCall = useCallback(async (url, options = {}) => {
    const startTime = performance.now();
    const correlationId = Math.random().toString(36).substring(7);
    
    try {
      const response = await fetch(url, options);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      metrics.apiCalls.push({
        url,
        method: options.method || 'GET',
        duration,
        status: response.status,
        correlationId,
        timestamp: Date.now()
      });
      
      // Log slow API calls
      if (duration > 1000) {
        console.warn(`[Performance] Slow API call: ${url} took ${duration.toFixed(0)}ms`);
      }
      
      return response;
    } catch (error) {
      const endTime = performance.now();
      metrics.errors.push({
        type: 'api',
        url,
        error: error.message,
        duration: endTime - startTime,
        timestamp: Date.now()
      });
      throw error;
    }
  }, []);
  
  return { measureApiCall };
};

/**
 * Hook to track component render performance
 * 
 * @param {string} componentName - Name of the component
 */
export const useRenderTracking = (componentName) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());
  
  useEffect(() => {
    const now = performance.now();
    const renderDuration = now - lastRenderTime.current;
    renderCount.current++;
    
    metrics.renders.push({
      component: componentName,
      renderCount: renderCount.current,
      duration: renderDuration,
      timestamp: Date.now()
    });
    
    // Log slow renders
    if (renderDuration > 16) { // More than 1 frame (60fps = 16.67ms)
      console.warn(`[Performance] Slow render: ${componentName} took ${renderDuration.toFixed(0)}ms`);
    }
    
    lastRenderTime.current = now;
  });
  
  return renderCount.current;
};

/**
 * Hook to track user interaction responsiveness
 * 
 * @returns {Object} Interaction tracking functions
 */
export const useInteractionTracking = () => {
  const startInteraction = useCallback((interactionName) => {
    return {
      name: interactionName,
      startTime: performance.now(),
      end: function() {
        const duration = performance.now() - this.startTime;
        
        metrics.interactions.push({
          name: this.name,
          duration,
          timestamp: Date.now()
        });
        
        // Log slow interactions
        if (duration > 100) {
          console.warn(`[Performance] Slow interaction: ${this.name} took ${duration.toFixed(0)}ms`);
        }
        
        return duration;
      }
    };
  }, []);
  
  return { startInteraction };
};

/**
 * Get performance report
 * 
 * @returns {Object} Performance metrics summary
 */
export const getPerformanceReport = () => {
  const calculateStats = (values) => {
    if (values.length === 0) return { avg: 0, p50: 0, p95: 0, max: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    return {
      avg: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      max: sorted[sorted.length - 1]
    };
  };
  
  const apiDurations = metrics.apiCalls.map(c => c.duration);
  const renderDurations = metrics.renders.map(r => r.duration);
  const interactionDurations = metrics.interactions.map(i => i.duration);
  
  return {
    summary: {
      totalApiCalls: metrics.apiCalls.length,
      totalRenders: metrics.renders.length,
      totalInteractions: metrics.interactions.length,
      totalErrors: metrics.errors.length
    },
    apiPerformance: calculateStats(apiDurations),
    renderPerformance: calculateStats(renderDurations),
    interactionPerformance: calculateStats(interactionDurations),
    slowestApiCalls: [...metrics.apiCalls]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5),
    recentErrors: metrics.errors.slice(-10)
  };
};

/**
 * Clear performance metrics
 */
export const clearPerformanceMetrics = () => {
  metrics.apiCalls = [];
  metrics.renders = [];
  metrics.interactions = [];
  metrics.errors = [];
};

/**
 * Performance observer for Core Web Vitals
 */
export const initCoreWebVitals = () => {
  if (typeof window === 'undefined' || !window.PerformanceObserver) {
    return;
  }
  
  // Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('[Web Vitals] LCP:', lastEntry.startTime.toFixed(0), 'ms');
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    // LCP not supported
  }
  
  // First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        console.log('[Web Vitals] FID:', entry.processingStart - entry.startTime, 'ms');
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    // FID not supported
  }
  
  // Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      console.log('[Web Vitals] CLS:', clsValue.toFixed(4));
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    // CLS not supported
  }
};

/**
 * Simulated high load scenario for testing
 * 
 * @param {Function} apiCall - API call function to test
 * @param {number} concurrentRequests - Number of concurrent requests
 * @param {number} duration - Duration in seconds
 */
export const simulateHighLoad = async (apiCall, concurrentRequests = 10, duration = 10) => {
  console.log(`[Load Test] Starting: ${concurrentRequests} concurrent requests for ${duration}s`);
  
  const results = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    responseTimes: []
  };
  
  const endTime = Date.now() + (duration * 1000);
  
  const worker = async () => {
    while (Date.now() < endTime) {
      const startTime = performance.now();
      try {
        await apiCall();
        results.successfulRequests++;
        results.responseTimes.push(performance.now() - startTime);
      } catch (e) {
        results.failedRequests++;
      }
      results.totalRequests++;
      
      // Small delay
      await new Promise(r => setTimeout(r, 50));
    }
  };
  
  // Start workers
  const workers = Array(concurrentRequests).fill(null).map(() => worker());
  await Promise.all(workers);
  
  // Calculate stats
  const sorted = [...results.responseTimes].sort((a, b) => a - b);
  const stats = {
    avg: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
    p95: sorted[Math.floor(sorted.length * 0.95)],
    max: sorted[sorted.length - 1]
  };
  
  console.log(`[Load Test] Complete:`);
  console.log(`  Total: ${results.totalRequests}`);
  console.log(`  Success: ${results.successfulRequests}`);
  console.log(`  Failed: ${results.failedRequests}`);
  console.log(`  Avg Response: ${stats.avg}ms`);
  console.log(`  P95 Response: ${stats.p95}ms`);
  
  return { results, stats };
};

export default {
  usePerformanceMonitor,
  useRenderTracking,
  useInteractionTracking,
  getPerformanceReport,
  clearPerformanceMetrics,
  initCoreWebVitals,
  simulateHighLoad
};
