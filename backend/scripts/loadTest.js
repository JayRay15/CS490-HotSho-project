/**
 * Load Testing Script
 * 
 * Simple load testing utility for the HotSho API
 * Tests various endpoints under simulated load
 * 
 * Usage: node scripts/loadTest.js [options]
 * 
 * Options:
 *   --endpoint=<url>     Specific endpoint to test (default: all)
 *   --concurrent=<n>     Number of concurrent requests (default: 10)
 *   --duration=<s>       Test duration in seconds (default: 30)
 *   --rampUp=<s>        Ramp-up time in seconds (default: 5)
 */

import http from 'http';
import https from 'https';

// Configuration
const config = {
  baseUrl: process.env.API_URL || 'http://localhost:5000',
  concurrent: parseInt(process.argv.find(a => a.startsWith('--concurrent='))?.split('=')[1]) || 10,
  duration: parseInt(process.argv.find(a => a.startsWith('--duration='))?.split('=')[1]) || 30,
  rampUp: parseInt(process.argv.find(a => a.startsWith('--rampUp='))?.split('=')[1]) || 5,
  targetEndpoint: process.argv.find(a => a.startsWith('--endpoint='))?.split('=')[1] || null
};

// Test endpoints
const endpoints = [
  { method: 'GET', path: '/api/health', name: 'Health Check', public: true },
  { method: 'GET', path: '/api/monitoring', name: 'Monitoring', public: true },
];

// Results tracking
const results = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: [],
  startTime: null,
  endTime: null,
  byEndpoint: {}
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Make an HTTP request and track timing
 */
function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const url = new URL(config.baseUrl + endpoint.path);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HotSho-LoadTest/1.0'
      },
      timeout: 30000
    };
    
    const startTime = Date.now();
    
    const req = lib.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        const success = res.statusCode >= 200 && res.statusCode < 400;
        
        resolve({
          endpoint: endpoint.name,
          path: endpoint.path,
          statusCode: res.statusCode,
          responseTime,
          success,
          error: null
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        endpoint: endpoint.name,
        path: endpoint.path,
        statusCode: 0,
        responseTime: Date.now() - startTime,
        success: false,
        error: err.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        endpoint: endpoint.name,
        path: endpoint.path,
        statusCode: 0,
        responseTime: 30000,
        success: false,
        error: 'Timeout'
      });
    });
    
    req.end();
  });
}

/**
 * Record a result
 */
function recordResult(result) {
  results.totalRequests++;
  results.responseTimes.push(result.responseTime);
  
  if (result.success) {
    results.successfulRequests++;
  } else {
    results.failedRequests++;
    if (result.error) {
      results.errors.push(result.error);
    }
  }
  
  // Track per-endpoint stats
  if (!results.byEndpoint[result.endpoint]) {
    results.byEndpoint[result.endpoint] = {
      total: 0,
      success: 0,
      failed: 0,
      responseTimes: []
    };
  }
  
  const endpointStats = results.byEndpoint[result.endpoint];
  endpointStats.total++;
  endpointStats.responseTimes.push(result.responseTime);
  if (result.success) {
    endpointStats.success++;
  } else {
    endpointStats.failed++;
  }
}

/**
 * Calculate statistics
 */
function calculateStats(times) {
  if (times.length === 0) return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
  
  const sorted = [...times].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round(sum / sorted.length),
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)]
  };
}

/**
 * Print progress bar
 */
function printProgress(current, total) {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round(percentage / 2);
  const empty = 50 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  
  process.stdout.write(`\r${colors.cyan}[${bar}] ${percentage}%${colors.reset}`);
}

/**
 * Run a single worker (simulated user)
 */
async function runWorker(workerId, testEndpoints, durationMs) {
  const workerStartTime = Date.now();
  
  while (Date.now() - workerStartTime < durationMs) {
    // Select random endpoint
    const endpoint = testEndpoints[Math.floor(Math.random() * testEndpoints.length)];
    
    // Make request
    const result = await makeRequest(endpoint);
    recordResult(result);
    
    // Small delay between requests (10-50ms)
    await new Promise(r => setTimeout(r, 10 + Math.random() * 40));
  }
}

/**
 * Main load test function
 */
async function runLoadTest() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║              HotSho API Load Testing Tool                  ║
╚════════════════════════════════════════════════════════════╝
  `);
  
  console.log(`${colors.blue}Configuration:${colors.reset}`);
  console.log(`  Base URL:     ${config.baseUrl}`);
  console.log(`  Concurrent:   ${config.concurrent} users`);
  console.log(`  Duration:     ${config.duration} seconds`);
  console.log(`  Ramp-up:      ${config.rampUp} seconds`);
  console.log();
  
  // Determine endpoints to test
  let testEndpoints = endpoints;
  if (config.targetEndpoint) {
    testEndpoints = endpoints.filter(e => e.path.includes(config.targetEndpoint));
    if (testEndpoints.length === 0) {
      // Custom endpoint
      testEndpoints = [{ method: 'GET', path: config.targetEndpoint, name: config.targetEndpoint, public: true }];
    }
  }
  
  console.log(`${colors.blue}Endpoints to test:${colors.reset}`);
  testEndpoints.forEach(e => console.log(`  ${e.method} ${e.path}`));
  console.log();
  
  // Warm-up request
  console.log(`${colors.yellow}Warming up...${colors.reset}`);
  await makeRequest({ method: 'GET', path: '/api/health', name: 'Warm-up' });
  
  // Start test
  console.log(`${colors.green}Starting load test...${colors.reset}\n`);
  results.startTime = Date.now();
  
  const workers = [];
  const durationMs = config.duration * 1000;
  const rampUpDelay = (config.rampUp * 1000) / config.concurrent;
  
  // Spawn workers with ramp-up
  for (let i = 0; i < config.concurrent; i++) {
    await new Promise(r => setTimeout(r, rampUpDelay));
    workers.push(runWorker(i, testEndpoints, durationMs - (i * rampUpDelay)));
    printProgress(i + 1, config.concurrent);
  }
  
  console.log(`\n${colors.green}All workers started. Running test...${colors.reset}\n`);
  
  // Progress tracking
  const progressInterval = setInterval(() => {
    const elapsed = Math.round((Date.now() - results.startTime) / 1000);
    const reqPerSec = Math.round(results.totalRequests / elapsed);
    console.log(`  Time: ${elapsed}s | Requests: ${results.totalRequests} | RPS: ${reqPerSec} | Errors: ${results.failedRequests}`);
  }, 5000);
  
  // Wait for all workers to complete
  await Promise.all(workers);
  
  clearInterval(progressInterval);
  results.endTime = Date.now();
  
  // Generate report
  generateReport();
}

/**
 * Generate and print test report
 */
function generateReport() {
  const duration = (results.endTime - results.startTime) / 1000;
  const rps = Math.round(results.totalRequests / duration);
  const errorRate = ((results.failedRequests / results.totalRequests) * 100).toFixed(2);
  const stats = calculateStats(results.responseTimes);
  
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                    LOAD TEST RESULTS                       ║
╚════════════════════════════════════════════════════════════╝

${colors.cyan}Summary:${colors.reset}
  Duration:           ${duration.toFixed(2)} seconds
  Total Requests:     ${results.totalRequests}
  Successful:         ${results.successfulRequests}
  Failed:             ${results.failedRequests}
  Requests/Second:    ${rps}
  Error Rate:         ${errorRate}%

${colors.cyan}Response Times:${colors.reset}
  Minimum:            ${stats.min}ms
  Maximum:            ${stats.max}ms
  Average:            ${stats.avg}ms
  Median (p50):       ${stats.p50}ms
  95th Percentile:    ${stats.p95}ms
  99th Percentile:    ${stats.p99}ms

${colors.cyan}Per-Endpoint Results:${colors.reset}
`);
  
  for (const [endpoint, data] of Object.entries(results.byEndpoint)) {
    const endpointStats = calculateStats(data.responseTimes);
    const endpointErrorRate = ((data.failed / data.total) * 100).toFixed(2);
    
    console.log(`  ${endpoint}:`);
    console.log(`    Requests: ${data.total} | Success: ${data.success} | Failed: ${data.failed}`);
    console.log(`    Avg: ${endpointStats.avg}ms | p95: ${endpointStats.p95}ms | Error Rate: ${endpointErrorRate}%`);
    console.log();
  }
  
  // Performance assessment
  console.log(`${colors.cyan}Performance Assessment:${colors.reset}`);
  
  const assessments = [];
  
  if (stats.p95 < 500) {
    assessments.push(`  ${colors.green}✓${colors.reset} p95 response time is excellent (< 500ms)`);
  } else if (stats.p95 < 2000) {
    assessments.push(`  ${colors.yellow}⚠${colors.reset} p95 response time is acceptable (< 2000ms)`);
  } else {
    assessments.push(`  ${colors.red}✗${colors.reset} p95 response time is too high (> 2000ms)`);
  }
  
  if (parseFloat(errorRate) < 1) {
    assessments.push(`  ${colors.green}✓${colors.reset} Error rate is excellent (< 1%)`);
  } else if (parseFloat(errorRate) < 5) {
    assessments.push(`  ${colors.yellow}⚠${colors.reset} Error rate is acceptable (< 5%)`);
  } else {
    assessments.push(`  ${colors.red}✗${colors.reset} Error rate is too high (> 5%)`);
  }
  
  if (rps > 100) {
    assessments.push(`  ${colors.green}✓${colors.reset} Throughput is excellent (> 100 RPS)`);
  } else if (rps > 50) {
    assessments.push(`  ${colors.yellow}⚠${colors.reset} Throughput is acceptable (> 50 RPS)`);
  } else {
    assessments.push(`  ${colors.red}✗${colors.reset} Throughput may need improvement (< 50 RPS)`);
  }
  
  assessments.forEach(a => console.log(a));
  
  // Errors summary
  if (results.errors.length > 0) {
    const errorCounts = {};
    results.errors.forEach(e => {
      errorCounts[e] = (errorCounts[e] || 0) + 1;
    });
    
    console.log(`\n${colors.red}Error Summary:${colors.reset}`);
    Object.entries(errorCounts).forEach(([error, count]) => {
      console.log(`  ${error}: ${count} occurrences`);
    });
  }
  
  console.log(`
${colors.cyan}Recommendations:${colors.reset}`);
  
  if (stats.p95 > 500) {
    console.log('  - Consider adding more database indexes');
    console.log('  - Enable Redis caching for frequent queries');
    console.log('  - Review slow database queries');
  }
  
  if (parseFloat(errorRate) > 5) {
    console.log('  - Investigate error sources');
    console.log('  - Increase rate limit thresholds if needed');
    console.log('  - Check database connection pool size');
  }
  
  if (rps < 50) {
    console.log('  - Consider horizontal scaling');
    console.log('  - Optimize slow endpoints');
    console.log('  - Review middleware chain for bottlenecks');
  }
  
  console.log();
}

// Run the test
runLoadTest().catch(err => {
  console.error(`${colors.red}Load test failed:${colors.reset}`, err.message);
  process.exit(1);
});
