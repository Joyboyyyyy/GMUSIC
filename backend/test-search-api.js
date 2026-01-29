import axios from 'axios';

const BASE_URL = 'http://localhost:3002';

async function testSearchAPI() {
  console.log('Testing Search API endpoints...\n');

  try {
    // Test 1: Search all with query
    console.log('1. Testing /api/search with query "guitar"...');
    const searchResponse = await axios.get(`${BASE_URL}/api/search`, {
      params: { q: 'guitar' }
    });
    console.log('✅ Search with query - SUCCESS');
    console.log(`   Status: ${searchResponse.status}`);
    console.log(`   Results count: ${searchResponse.data?.data?.length || 0}`);
    if (searchResponse.data?.data?.length > 0) {
      console.log(`   First result: ${searchResponse.data.data[0].title} (${searchResponse.data.data[0].type})`);
    }

    // Test 2: Search courses only
    console.log('\n2. Testing /api/search with type "courses"...');
    const coursesResponse = await axios.get(`${BASE_URL}/api/search`, {
      params: { q: 'music', type: 'courses' }
    });
    console.log('✅ Search courses - SUCCESS');
    console.log(`   Status: ${coursesResponse.status}`);
    console.log(`   Results count: ${coursesResponse.data?.data?.length || 0}`);

    // Test 3: Search teachers only
    console.log('\n3. Testing /api/search with type "teachers"...');
    const teachersResponse = await axios.get(`${BASE_URL}/api/search`, {
      params: { q: 'teacher', type: 'teachers' }
    });
    console.log('✅ Search teachers - SUCCESS');
    console.log(`   Status: ${teachersResponse.status}`);
    console.log(`   Results count: ${teachersResponse.data?.data?.length || 0}`);

    // Test 4: Search buildings only
    console.log('\n4. Testing /api/search with type "buildings"...');
    const buildingsResponse = await axios.get(`${BASE_URL}/api/search`, {
      params: { q: 'music', type: 'buildings' }
    });
    console.log('✅ Search buildings - SUCCESS');
    console.log(`   Status: ${buildingsResponse.status}`);
    console.log(`   Results count: ${buildingsResponse.data?.data?.length || 0}`);

    // Test 5: Empty search (should return all)
    console.log('\n5. Testing /api/search with empty query...');
    const emptyResponse = await axios.get(`${BASE_URL}/api/search`);
    console.log('✅ Empty search - SUCCESS');
    console.log(`   Status: ${emptyResponse.status}`);
    console.log(`   Results count: ${emptyResponse.data?.data?.length || 0}`);

  } catch (error) {
    console.error('❌ Search API test failed:', error.response?.data || error.message);
  }
}

testSearchAPI();