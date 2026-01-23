import db from './src/lib/db.js';

async function getBuildings() {
  try {
    const buildings = await db.building.findMany({
      where: { isActive: true },
      select: { id: true, name: true, city: true }
    });
    
    console.log('Active Buildings:');
    console.log(JSON.stringify(buildings, null, 2));
    console.log(`\nTotal: ${buildings.length} buildings`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getBuildings();
