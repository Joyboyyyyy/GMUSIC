import db from './src/lib/db.js';

async function debugTeachers() {
  console.log('\n=== DEBUGGING TEACHER ASSIGNMENTS ===\n');

  // Get all courses
  const courses = await db.course.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      buildingId: true,
      building: {
        select: { name: true }
      },
      timeSlots: {
        where: { isActive: true },
        select: {
          id: true,
          teacherId: true,
        },
      },
    },
  });

  console.log(`Found ${courses.length} active courses\n`);

  for (const course of courses) {
    console.log(`Course: ${course.name}`);
    console.log(`  Building: ${course.building.name}`);
    console.log(`  TimeSlots: ${course.timeSlots.length}`);
    
    const teacherIds = [...new Set(course.timeSlots.map(ts => ts.teacherId).filter(Boolean))];
    console.log(`  Unique Teacher IDs: ${teacherIds.length > 0 ? teacherIds.join(', ') : 'NONE'}`);
    
    if (teacherIds.length > 0) {
      const teachers = await db.user.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true, name: true, role: true },
      });
      
      console.log(`  Teachers:`);
      teachers.forEach(t => {
        console.log(`    - ${t.name} (${t.role}) [${t.id}]`);
      });
    }
    console.log('');
  }

  // Check for users with TEACHER role
  console.log('\n=== ALL TEACHERS IN DATABASE ===\n');
  const allTeachers = await db.user.findMany({
    where: { role: 'TEACHER' },
    select: { id: true, name: true, email: true },
  });

  console.log(`Found ${allTeachers.length} users with TEACHER role:\n`);
  allTeachers.forEach(t => {
    console.log(`  - ${t.name} (${t.email}) [${t.id}]`);
  });

  await db.$disconnect();
}

debugTeachers().catch(console.error);
