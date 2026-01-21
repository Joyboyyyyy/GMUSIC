import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedJammingRooms() {
  try {
    console.log('🎵 Starting jamming room seeding...');

    // First, let's check if we have any buildings
    const existingBuildings = await prisma.building.findMany({
      where: { isActive: true },
      take: 5,
    });

    if (existingBuildings.length === 0) {
      console.log('📍 No buildings found, creating sample buildings...');
      
      // Create sample buildings with music rooms
      const sampleBuildings = [
        {
          name: 'Harmony Heights',
          registrationCode: 'HH001234',
          address: '123 Music Street, Downtown',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          zipCode: '400001',
          latitude: 19.0760,
          longitude: 72.8777,
          residenceCount: 50,
          musicRoomCount: 3,
          contactPersonName: 'Raj Sharma',
          contactEmail: 'raj@harmonyheights.com',
          contactPhone: '+91-9876543210',
          visibilityType: 'PUBLIC',
          approvalStatus: 'ACTIVE',
        },
        {
          name: 'Melody Manor',
          registrationCode: 'MM005678',
          address: '456 Rhythm Road, Bandra',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          zipCode: '400050',
          latitude: 19.0596,
          longitude: 72.8295,
          residenceCount: 75,
          musicRoomCount: 5,
          contactPersonName: 'Priya Patel',
          contactEmail: 'priya@melodymanor.com',
          contactPhone: '+91-9876543211',
          visibilityType: 'PUBLIC',
          approvalStatus: 'ACTIVE',
        },
        {
          name: 'Sound Symphony Apartments',
          registrationCode: 'SSA009012',
          address: '789 Beat Boulevard, Andheri',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          zipCode: '400058',
          latitude: 19.1136,
          longitude: 72.8697,
          residenceCount: 100,
          musicRoomCount: 4,
          contactPersonName: 'Amit Kumar',
          contactEmail: 'amit@soundsymphony.com',
          contactPhone: '+91-9876543212',
          visibilityType: 'PUBLIC',
          approvalStatus: 'ACTIVE',
        },
      ];

      for (const buildingData of sampleBuildings) {
        const building = await prisma.building.create({
          data: buildingData,
        });
        console.log(`✅ Created building: ${building.name}`);
        existingBuildings.push(building);
      }
    }

    // Now create music rooms for each building
    for (const building of existingBuildings.slice(0, 3)) {
      console.log(`🎼 Creating music rooms for ${building.name}...`);

      // Check if building already has music rooms (only count active rooms)
      const existingRooms = await prisma.musicRoom.findMany({
        where: { 
          buildingId: building.id,
          isActive: true,
        },
      });

      if (existingRooms.length > 0) {
        console.log(`⏭️  Building ${building.name} already has ${existingRooms.length} music rooms, skipping...`);
        continue;
      }

      // Define room templates
      const roomTemplates = [
        {
          name: 'Studio A - Main Hall',
          floor: 'Ground Floor',
          capacity: 8,
          instruments: ['PIANO', 'GUITAR', 'DRUMS', 'VOCALS'],
        },
        {
          name: 'Studio B - Acoustic Room',
          floor: '1st Floor',
          capacity: 6,
          instruments: ['GUITAR', 'VIOLIN', 'VOCALS', 'PIANO'],
        },
        {
          name: 'Studio C - Electric Lounge',
          floor: '1st Floor',
          capacity: 10,
          instruments: ['GUITAR', 'KEYBOARD', 'DRUMS', 'VOCALS'],
        },
        {
          name: 'Studio D - Recording Suite',
          floor: '2nd Floor',
          capacity: 5,
          instruments: ['VOCALS', 'GUITAR', 'KEYBOARD'],
        },
        {
          name: 'Studio E - Band Practice',
          floor: '2nd Floor',
          capacity: 12,
          instruments: ['DRUMS', 'GUITAR', 'KEYBOARD', 'VOCALS', 'PIANO'],
        },
      ];

      // Create rooms up to building's musicRoomCount, cycling through templates if needed
      const roomsToCreate = [];
      const targetCount = building.musicRoomCount || 3;
      
      for (let i = 0; i < targetCount; i++) {
        const template = roomTemplates[i % roomTemplates.length];
        const roomNumber = Math.floor(i / roomTemplates.length) > 0 
          ? ` ${Math.floor(i / roomTemplates.length) + 1}` 
          : '';
        
        roomsToCreate.push({
          buildingId: building.id,
          name: `${template.name}${roomNumber}`,
          floor: template.floor,
          capacity: template.capacity,
          instruments: template.instruments,
        });
      }

      for (const roomData of roomsToCreate) {
        const room = await prisma.musicRoom.create({
          data: roomData,
        });
        console.log(`  ✅ Created music room: ${room.name}`);
      }
    }

    // Update building music room counts to match actual rooms created
    for (const building of existingBuildings.slice(0, 3)) {
      const actualRoomCount = await prisma.musicRoom.count({
        where: { buildingId: building.id, isActive: true },
      });

      if (actualRoomCount !== building.musicRoomCount) {
        await prisma.building.update({
          where: { id: building.id },
          data: { musicRoomCount: actualRoomCount },
        });
        console.log(`📊 Updated ${building.name} music room count to ${actualRoomCount}`);
      }
    }

    console.log('🎉 Jamming room seeding completed successfully!');
    
    // Display summary
    const totalBuildings = await prisma.building.count({
      where: { isActive: true, musicRoomCount: { gt: 0 } },
    });
    const totalMusicRooms = await prisma.musicRoom.count({
      where: { isActive: true },
    });

    console.log('\n📈 SUMMARY:');
    console.log(`🏢 Buildings with music rooms: ${totalBuildings}`);
    console.log(`🎵 Total music rooms: ${totalMusicRooms}`);
    console.log('\n🚀 Ready for jamming room bookings!');

  } catch (error) {
    console.error('❌ Error seeding jamming rooms:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedJammingRooms()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });