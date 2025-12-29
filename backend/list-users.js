/**
 * List all users in the database
 * Usage: node list-users.js
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

console.log('📋 Listing all users in database...\n');

try {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      isVerified: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (users.length === 0) {
    console.log('❌ No users found in database');
    console.log('\n💡 You need to sign up first before testing forgot password.');
  } else {
    console.log(`✅ Found ${users.length} user(s):\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Verified: ${user.isVerified ? '✅ Yes' : '❌ No'}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });
    console.log('💡 Use one of these emails to test the forgot password flow.');
  }
} catch (error) {
  console.error('❌ Error listing users:', error.message);
} finally {
  await prisma.$disconnect();
}

