/**
 * Performance Utilities
 * 
 * Utilities for measuring and optimizing web performance metrics.
 * Implements Core Web Vitals tracking and performance optimizations.
 */

// ============================================================================
// Core Web Vitals Tracking
// ============================================================================

/**
 * Measure and report Core Web Vitals
 * LCP (Largest Contentful Paint) - Loading performance
 * FID (First Input Delay) - Interactivity  
 * CLS (Cumulative Layout Shift) - Visual stability
 * TTFB (Time to First Byte) - Server response time
 * FCP (First Contentful Paint) - Initial render time
 */
export const measureWebVitals = (onReport) => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
        return;
    }

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        onReport({
            name: 'LCP',
            value: lastEntry.startTime,
            rating: lastEntry.startTime < 2500 ? 'good' : lastEntry.startTime < 4000 ? 'needs-improvement' : 'poor',
        });
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // First Input Delay
    const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
            onReport({
                name: 'FID',
                value: entry.processingStart - entry.startTime,
                rating: entry.processingStart - entry.startTime < 100 ? 'good' : entry.processingStart - entry.startTime < 300 ? 'needs-improvement' : 'poor',
            });
        });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });

    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
                clsValue += entry.value;
            }
        });
        onReport({
            name: 'CLS',
            value: clsValue,
            rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
        });
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // Time to First Byte
    const navigationEntry = performance.getEntriesByType('navigation')[0];
    if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        onReport({
            name: 'TTFB',
            value: ttfb,
            rating: ttfb < 200 ? 'good' : ttfb < 600 ? 'needs-improvement' : 'poor',
        });
    }

    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
                onReport({
                    name: 'FCP',
                    value: entry.startTime,
                    rating: entry.startTime < 1800 ? 'good' : entry.startTime < 3000 ? 'needs-improvement' : 'poor',
                });
            }
        });
    });
    fcpObserver.observe({ type: 'paint', buffered: true });

    // Cleanup function
    return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
        fcpObserver.disconnect();
    };
};

// ============================================================================
// Resource Hints
// ============================================================================

/**
 * Preload critical resources
 */
export const preloadResource = (href, as, type = null, crossOrigin = null) => {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    if (crossOrigin) link.crossOrigin = crossOrigin;
    document.head.appendChild(link);
};

/**
 * Prefetch resources for future navigation
 */
export const prefetchResource = (href) => {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
};

/**
 * Preconnect to external origins
 */
export const preconnect = (origin, crossOrigin = true) => {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    if (crossOrigin) link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
};

/**
 * DNS prefetch for external domains
 */
export const dnsPrefetch = (origin) => {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = origin;
    document.head.appendChild(link);
};

// ============================================================================
// Request Animation Frame Utilities
// ============================================================================

/**
 * Debounce function for performance
 */
export const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
};

/**
 * Throttle function using requestAnimationFrame
 */
export const throttleRAF = (fn) => {
    let rafId = null;
    return (...args) => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            fn(...args);
            rafId = null;
        });
    };
};

// ============================================================================
// Memory Management
// ============================================================================

/**
 * Check memory usage (Chrome only)
 */
export const getMemoryUsage = () => {
    if (typeof window === 'undefined' || !performance.memory) {
        return null;
    }

    return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        usagePercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100,
    };
};

// ============================================================================
// Network Information
// ============================================================================

/**
 * Get network connection information
 */
export const getNetworkInfo = () => {
    if (typeof navigator === 'undefined' || !navigator.connection) {
        return null;
    }

    const connection = navigator.connection;
    return {
        effectiveType: connection.effectiveType, // 4g, 3g, 2g, slow-2g
        downlink: connection.downlink, // Mbps
        rtt: connection.rtt, // Round trip time in ms
        saveData: connection.saveData, // User has data saver enabled
    };
};

/**
 * Adapt resource loading based on network conditions
 */
export const shouldLoadHighQuality = () => {
    const networkInfo = getNetworkInfo();
    if (!networkInfo) return true; // Default to high quality

    // Don't load high quality on slow connections or data saver mode
    if (networkInfo.saveData) return false;
    if (networkInfo.effectiveType === '2g' || networkInfo.effectiveType === 'slow-2g') return false;

    return true;
};

// ============================================================================
// Bundle Analysis Helpers
// ============================================================================

/**
 * Log performance marks for debugging
 */
export const logPerformanceMarks = () => {
    if (typeof performance === 'undefined') return;

    const marks = performance.getEntriesByType('mark');
    const measures = performance.getEntriesByType('measure');

    console.group('Performance Marks');
    marks.forEach(mark => console.log(`${mark.name}: ${mark.startTime.toFixed(2)}ms`));
    console.groupEnd();

    console.group('Performance Measures');
    measures.forEach(measure => console.log(`${measure.name}: ${measure.duration.toFixed(2)}ms`));
    console.groupEnd();
};

/**
 * Create a performance mark
 */
export const mark = (name) => {
    if (typeof performance !== 'undefined') {
        performance.mark(name);
    }
};

/**
 * Measure between two marks
 */
export const measure = (name, startMark, endMark) => {
    if (typeof performance !== 'undefined') {
        try {
            performance.measure(name, startMark, endMark);
        } catch (e) {
            // Marks might not exist
        }
    }
};

// ============================================================================
// Initialize Performance Monitoring
// ============================================================================

/**
 * Initialize performance monitoring on app start
 */
export const initPerformanceMonitoring = (options = {}) => {
    const {
        reportToConsole = process.env.NODE_ENV === 'development',
        reportToAnalytics = process.env.NODE_ENV === 'production',
        analyticsEndpoint = '/api/monitoring/web-vitals',
    } = options;

    const handleReport = (metric) => {
        if (reportToConsole) {
            const color = metric.rating === 'good' ? 'green' : metric.rating === 'needs-improvement' ? 'orange' : 'red';
            console.log(`%c${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`, `color: ${color}`);
        }

        if (reportToAnalytics) {
            // Send to analytics endpoint
            navigator.sendBeacon?.(analyticsEndpoint, JSON.stringify(metric));
        }
    };

    // Start measuring Web Vitals
    const cleanup = measureWebVitals(handleReport);

    // Preconnect to critical origins
    preconnect('https://fonts.googleapis.com');
    preconnect('https://fonts.gstatic.com');

    return cleanup;
};

export default {
    measureWebVitals,
    preloadResource,
    prefetchResource,
    preconnect,
    dnsPrefetch,
    debounce,
    throttleRAF,
    getMemoryUsage,
    getNetworkInfo,
    shouldLoadHighQuality,
    mark,
    measure,
    logPerformanceMarks,
    initPerformanceMonitoring,
};
