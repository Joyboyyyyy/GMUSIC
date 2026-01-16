import db from './src/lib/db.js';

async function debugTeacherAssignments() {
  console.log('\n=== TEACHER ASSIGNMENTS ===\n');

  const assignments = await db.teacherAssignment.findMany({
    select: {
      id: true,
      buildingId: true,
      teacherId: true,
      authorizedInstruments: true,
      building: {
        select: { name: true }
      },
      teacher: {
        select: { name: true, email: true }
      },
    },
  });

  console.log(`Found ${assignments.length} teacher assignments:\n`);

  assignments.forEach(a => {
    console.log(`Building: ${a.building.name}`);
    console.log(`  Teacher: ${a.teacher.name} (${a.teacher.email})`);
    console.log(`  Instruments: ${a.authorizedInstruments.join(', ')}`);
    console.log(`  Building ID: ${a.buildingId}`);
    console.log(`  Teacher ID: ${a.teacherId}`);
    console.log('');
  });

  await db.$disconnect();
}

debugTeacherAssignments().catch(console.error);
