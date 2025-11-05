// Test the analytics API endpoint directly
import axios from 'axios';

async function testAnalyticsAPI() {
  try {
    // Replace with your actual auth token from Clerk
    const token = 'YOUR_CLERK_TOKEN_HERE'; // You'll need to get this from the browser dev tools
    
    console.log('🧪 Testing Analytics API Endpoint\n');
    
    const response = await axios.get('http://localhost:5001/api/jobs/analytics', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('\n📊 Analytics Data Structure:');
    console.log(JSON.stringify(response.data.data, null, 2));
    
    // Check specific fields
    const data = response.data.data;
    console.log('\n🔍 Data Availability Check:');
    console.log(`funnelAnalytics: ${data.funnelAnalytics ? 'Present' : 'Missing'}`);
    console.log(`companyAnalytics: ${data.companyAnalytics ? `Present (${data.companyAnalytics.length} items)` : 'Missing'}`);
    console.log(`industryAnalytics: ${data.industryAnalytics ? `Present (${data.industryAnalytics.length} items)` : 'Missing'}`);
    console.log(`approachAnalytics: ${data.approachAnalytics ? 'Present' : 'Missing'}`);
    console.log(`goalTracking: ${data.goalTracking ? 'Present' : 'Missing'}`);
    console.log(`recommendations: ${data.recommendations ? `Present (${data.recommendations.length} items)` : 'Missing'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

console.log('⚠️  NOTE: You need to replace YOUR_CLERK_TOKEN_HERE with an actual token');
console.log('   Get it from: Browser Dev Tools > Network tab > any API call > Authorization header\n');

// Uncomment the line below after adding your token
// testAnalyticsAPI();
