import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const courses = [
  {
    title: 'Complete Guitar Mastery: Beginner to Pro',
    description: 'Learn guitar from scratch with comprehensive lessons covering chords, scales, techniques, and songs.',
    price: 1999,
    duration: 720,
  },
  {
    title: 'Piano Fundamentals: Classical & Modern',
    description: 'Master piano basics including reading sheet music, finger techniques, and playing beautiful pieces.',
    price: 2499,
    duration: 900,
  },
  {
    title: 'Music Production in Ableton Live',
    description: 'Create professional electronic music from scratch. Learn synthesis, sampling, mixing, and mastering.',
    price: 3499,
    duration: 680,
  },
  {
    title: 'Vocal Training: Find Your Voice',
    description: 'Develop proper breathing techniques, expand your range, and learn to sing with confidence.',
    price: 1799,
    duration: 540,
  },
  {
    title: 'Drumming Essentials: Rhythm & Technique',
    description: 'Build solid drumming foundations with exercises for coordination, timing, and groove.',
    price: 2199,
    duration: 600,
  },
];

async function main() {
  console.log('Seeding database with courses...');
  
  for (const course of courses) {
    const existing = await prisma.course.findFirst({
      where: { title: course.title },
    });
    
    if (!existing) {
      const created = await prisma.course.create({
        data: course,
      });
      console.log(`Created course: ${created.title} (ID: ${created.id})`);
    } else {
      console.log(`Course already exists: ${existing.title} (ID: ${existing.id})`);
    }
  }
  
  console.log('Seeding complete!');
  
  // List all courses
  const allCourses = await prisma.course.findMany();
  console.log('\nAll courses in database:');
  allCourses.forEach(c => {
    console.log(`  - ${c.id}: ${c.title} (₹${c.price})`);
  });
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
