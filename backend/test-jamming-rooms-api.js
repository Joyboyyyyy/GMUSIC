import fetch from 'node-fetch';

const API_BASE = 'http://192.168.2.131:3002/api';

async function testJammingRoomAPI() {
  console.log('🧪 Testing Jamming Room API Endpoints...\n');

  const tests = [
    {
      name: 'Get Buildings with Music Rooms',
      endpoint: '/music-rooms/buildings',
      method: 'GET',
    },
    {
      name: 'Search Music Rooms',
      endpoint: '/music-rooms/search?q=studio',
      method: 'GET',
    },
    {
      name: 'Get Nearby Music Rooms',
      endpoint: '/music-rooms/nearby?latitude=19.0760&longitude=72.8777&radius=10',
      method: 'GET',
    },
  ];

  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      console.log(`📡 ${test.method} ${API_BASE}${test.endpoint}`);
      
      const response = await fetch(`${API_BASE}${test.endpoint}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ Success: ${response.status}`);
        console.log(`📊 Data: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
      } else {
        console.log(`❌ Failed: ${response.status}`);
        console.log(`📄 Error: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.log(`💥 Network Error: ${error.message}`);
    }
    
    console.log('─'.repeat(50));
  }

  // Test with a sample building ID (will need to be updated with real ID)
  console.log('\n🏢 Testing Building-Specific Endpoints...');
  
  try {
    // First get buildings to get a real building ID
    const buildingsResponse = await fetch(`${API_BASE}/music-rooms/buildings`);
    const buildingsData = await buildingsResponse.json();
    
    if (buildingsData.success && buildingsData.data.length > 0) {
      const sampleBuildingId = buildingsData.data[0].id;
      console.log(`📍 Using sample building ID: ${sampleBuildingId}`);
      
      // Test getting slots for this building
      const slotsResponse = await fetch(`${API_BASE}/music-rooms/buildings/${sampleBuildingId}/slots?date=2026-01-20`);
      const slotsData = await slotsResponse.json();
      
      console.log(`🕐 Slots Response: ${slotsResponse.status}`);
      console.log(`📊 Slots Data: ${JSON.stringify(slotsData, null, 2).substring(0, 300)}...`);
    } else {
      console.log('⚠️  No buildings found to test slots endpoint');
    }
  } catch (error) {
    console.log(`💥 Building-specific test error: ${error.message}`);
  }

  console.log('\n🎉 API Testing Complete!');
}

// Run the tests
testJammingRoomAPI().catch(console.error);