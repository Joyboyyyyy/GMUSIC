import axios from 'axios';

async function debugAllRoute() {
  const baseURL = 'http://192.168.2.111:3002';
  
  console.log('🔍 Debugging /api/buildings/all endpoint...\n');
  
  try {
    // Make request with detailed logging
    const response = await axios.get(`${baseURL}/api/buildings/all`, {
      validateStatus: () => true, // Don't throw on 4xx/5xx
      timeout: 10000
    });
    
    console.log('📊 Response Details:');
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers:`, response.headers);
    console.log(`   Data:`, JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Request Error:');
    console.log(`   Message: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, error.response.data);
    }
  }
}

debugAllRoute();