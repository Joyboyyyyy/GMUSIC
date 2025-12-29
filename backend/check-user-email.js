/**
 * Script to check if a user exists in the database
 * Usage: node check-user-email.js YOUR_EMAIL@example.com
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node check-user-email.js YOUR_EMAIL@example.com');
  process.exit(1);
}

console.log(`🔍 Checking if user exists for email: ${email}\n`);

try {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  if (user) {
    console.log('✅ User found in database:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name || 'Not set'}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log('\n✅ This user will receive password reset emails');
  } else {
    console.log('❌ User NOT found in database');
    console.log('\n⚠️  Password reset emails are only sent to registered users.');
    console.log('   This is a security feature to prevent email enumeration.');
    console.log('\n💡 To receive reset emails, the user must first sign up.');
  }
} catch (error) {
  console.error('❌ Error checking user:', error.message);
  console.error(error);
} finally {
  await prisma.$disconnect();
}

