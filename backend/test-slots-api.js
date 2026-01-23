// Test script to debug the slots API endpoint
import musicRoomService from './src/services/musicRoom.service.js';

async function testSlotsAPI() {
  try {
    console.log('Testing getAvailableSlots...');
    
    // Test with an actual building ID from the database
    const buildingId = 'e32ad6c1-e6c1-4586-aa8b-73315b4938ee'; // Tarush building
    const date = new Date().toISOString().split('T')[0];
    
    console.log(`Building ID: ${buildingId}`);
    console.log(`Date: ${date}`);
    
    const slots = await musicRoomService.getAvailableSlots(buildingId, date);
    
    console.log('\n✅ Success! Slots returned:');
    console.log(JSON.stringify(slots, null, 2));
    console.log(`\nTotal slots: ${slots.length}`);
    console.log(`Available: ${slots.filter(s => s.available).length}`);
    console.log(`Booked: ${slots.filter(s => !s.available).length}`);
    
  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }
}

testSlotsAPI();
