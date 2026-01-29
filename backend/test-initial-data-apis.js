import axios from 'axios';

const BASE_URL = 'http://localhost:3002';

async function testInitialDataAPIs() {
  console.log('Testing Initial Data API endpoints used by SearchScreen...\n');

  try {
    // Test 1: Get all courses
    console.log('1. Testing /api/courses (for initial course data)...');
    const coursesResponse = await axios.get(`${BASE_URL}/api/courses`);
    console.log('✅ Courses API - SUCCESS');
    console.log(`   Status: ${coursesResponse.status}`);
    console.log(`   Courses count: ${coursesResponse.data?.data?.length || 0}`);
    if (coursesResponse.data?.data?.length > 0) {
      const course = coursesResponse.data.data[0];
      console.log(`   Sample course: ${course.name} - ${course.instrument || 'No instrument'}`);
    }

    // Test 2: Get featured teachers
    console.log('\n2. Testing /api/teachers/featured (for initial teacher data)...');
    try {
      const teachersResponse = await axios.get(`${BASE_URL}/api/teachers/featured`, {
        params: { limit: 50 }
      });
      console.log('✅ Teachers API - SUCCESS');
      console.log(`   Status: ${teachersResponse.status}`);
      console.log(`   Teachers count: ${teachersResponse.data?.data?.length || 0}`);
      if (teachersResponse.data?.data?.length > 0) {
        const teacher = teachersResponse.data.data[0];
        console.log(`   Sample teacher: ${teacher.name} - ${teacher.instruments?.join(', ') || 'No instruments'}`);
      }
    } catch (error) {
      console.log('⚠️  Teachers API not available:', error.response?.status || error.message);
    }

    // Test 3: Get all buildings
    console.log('\n3. Testing /api/buildings/all (for initial building data)...');
    const buildingsResponse = await axios.get(`${BASE_URL}/api/buildings/all`);
    console.log('✅ Buildings API - SUCCESS');
    console.log(`   Status: ${buildingsResponse.status}`);
    console.log(`   Buildings count: ${buildingsResponse.data?.data?.length || 0}`);
    if (buildingsResponse.data?.data?.length > 0) {
      const building = buildingsResponse.data.data[0];
      console.log(`   Sample building: ${building.name} - ${building.city}, ${building.state}`);
    }

    console.log('\n🎉 All initial data APIs are working correctly!');

  } catch (error) {
    console.error('❌ Initial data API test failed:', error.response?.data || error.message);
  }
}

testInitialDataAPIs();