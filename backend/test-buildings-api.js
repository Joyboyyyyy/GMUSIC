import axios from 'axios';

async function testBuildingsAPI() {
  const baseURL = 'http://192.168.2.111:3002';
  
  console.log('Testing Buildings API endpoints...\n');
  
  // Test /api/buildings/public (should work)
  try {
    console.log('1. Testing /api/buildings/public (should work)...');
    const publicResponse = await axios.get(`${baseURL}/api/buildings/public`);
    console.log('✅ /api/buildings/public - SUCCESS');
    console.log(`   Status: ${publicResponse.status}`);
    console.log(`   Buildings count: ${publicResponse.data.data?.length || 0}\n`);
  } catch (error) {
    console.log('❌ /api/buildings/public - FAILED');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
  }
  
  // Test /api/buildings/all (should work but currently failing)
  try {
    console.log('2. Testing /api/buildings/all (should work but failing)...');
    const allResponse = await axios.get(`${baseURL}/api/buildings/all`);
    console.log('✅ /api/buildings/all - SUCCESS');
    console.log(`   Status: ${allResponse.status}`);
    console.log(`   Buildings count: ${allResponse.data.data?.length || 0}\n`);
  } catch (error) {
    console.log('❌ /api/buildings/all - FAILED');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
  }
  
  // Test /api/buildings/search (should work)
  try {
    console.log('3. Testing /api/buildings/search (should work)...');
    const searchResponse = await axios.get(`${baseURL}/api/buildings/search?q=`);
    console.log('✅ /api/buildings/search - SUCCESS');
    console.log(`   Status: ${searchResponse.status}`);
    console.log(`   Buildings count: ${searchResponse.data.data?.length || 0}\n`);
  } catch (error) {
    console.log('❌ /api/buildings/search - FAILED');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
  }
  
  // Test /api/buildings/ (should require auth)
  try {
    console.log('4. Testing /api/buildings/ (should require auth)...');
    const rootResponse = await axios.get(`${baseURL}/api/buildings/`);
    console.log('❌ /api/buildings/ - UNEXPECTED SUCCESS (should require auth)');
    console.log(`   Status: ${rootResponse.status}\n`);
  } catch (error) {
    console.log('✅ /api/buildings/ - CORRECTLY FAILED (requires auth)');
    console.log(`   Status: ${error.response?.status}`);
    console.log(`   Error: ${error.response?.data?.message || error.message}\n`);
  }
}

testBuildingsAPI().catch(console.error);