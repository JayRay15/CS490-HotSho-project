// Quick test script to verify interview performance endpoints
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';

async function testEndpoints() {
  console.log('🧪 Testing Interview Performance API Endpoints\n');
  
  // Test health check first
  try {
    const healthRes = await fetch(`${API_URL}/health`);
    const health = await healthRes.json();
    console.log('✅ Health check:', health.message);
  } catch (err) {
    console.log('❌ Health check failed:', err.message);
    return;
  }

  // Test interview performance endpoint (will fail without auth, but should return 401 not 404)
  try {
    const analyticsRes = await fetch(`${API_URL}/interview-performance/analytics`);
    console.log(`\n📊 Analytics endpoint status: ${analyticsRes.status}`);
    
    if (analyticsRes.status === 401 || analyticsRes.status === 403) {
      console.log('✅ Route exists but requires authentication (expected)');
    } else if (analyticsRes.status === 404) {
      console.log('❌ Route not found - routes not mounted correctly');
    } else {
      console.log('ℹ️  Unexpected status:', analyticsRes.status);
    }
  } catch (err) {
    console.log('❌ Failed to reach analytics endpoint:', err.message);
  }

  // Test other endpoints
  const endpoints = ['trends', 'coaching', 'benchmarks'];
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`${API_URL}/interview-performance/${endpoint}`);
      console.log(`📊 ${endpoint} endpoint status: ${res.status}${res.status === 401 ? ' ✅' : res.status === 404 ? ' ❌' : ''}`);
    } catch (err) {
      console.log(`❌ ${endpoint} endpoint failed:`, err.message);
    }
  }
}

testEndpoints().catch(console.error);
