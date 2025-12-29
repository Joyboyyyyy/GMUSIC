/**
 * Fix Prisma Client Sync Issue
 * 
 * This script helps diagnose and fix Prisma client sync issues
 * that cause "Unknown argument" errors for resetToken fields.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testResetTokenFields() {
  console.log('🔍 Testing Prisma client for resetToken fields...\n');

  try {
    // Test 1: Check if we can query a user
    console.log('1️⃣ Testing user query...');
    const users = await prisma.user.findMany({
      take: 1,
      select: {
        id: true,
        email: true,
      },
    });
    console.log('✅ User query works\n');

    // Test 2: Check if resetToken field exists in schema
    console.log('2️⃣ Testing resetToken field access...');
    const testUser = users[0];
    if (!testUser) {
      console.log('⚠️  No users found in database. Create a user first.\n');
      return;
    }

    // Test 3: Try to update with resetToken (this will fail if field doesn't exist)
    console.log('3️⃣ Testing resetToken update...');
    try {
      await prisma.user.update({
        where: { id: testUser.id },
        data: {
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
      console.log('✅ resetToken and resetTokenExpiry fields work!\n');
      console.log('✅ Prisma client is in sync with database schema\n');
    } catch (err) {
      if (err.message.includes('Unknown argument')) {
        console.error('❌ ERROR: Prisma client is OUT OF SYNC\n');
        console.error('❌ Error:', err.message);
        console.error('\n🔧 FIX STEPS:');
        console.error('1. Stop your backend server (CTRL + C)');
        console.error('2. Run: npx prisma generate');
        console.error('3. Clear node_modules cache: rm -rf node_modules/.prisma');
        console.error('4. Run: npx prisma generate');
        console.error('5. Restart your backend server');
        process.exit(1);
      } else {
        throw err;
      }
    }

    // Test 4: Try to set a reset token
    console.log('4️⃣ Testing resetToken assignment...');
    const crypto = await import('crypto');
    const testToken = 'test_token_' + Date.now();
    const hashedToken = crypto.createHash('sha256').update(testToken).digest('hex');
    
    await prisma.user.update({
      where: { id: testUser.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      },
    });
    console.log('✅ resetToken assignment works!\n');

    // Clean up test token
    await prisma.user.update({
      where: { id: testUser.id },
      data: {
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    console.log('✅ Cleanup complete\n');

    console.log('✅✅✅ ALL TESTS PASSED ✅✅✅\n');
    console.log('Prisma client is correctly synced with database schema.');
    console.log('The forgot-password flow should work now.\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED\n');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('\n🔧 FIX STEPS:');
    console.error('1. Stop your backend server (CTRL + C)');
    console.error('2. Run: npx prisma generate');
    console.error('3. If that doesn\'t work, run: npx prisma migrate dev');
    console.error('4. Restart your backend server');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testResetTokenFields();

