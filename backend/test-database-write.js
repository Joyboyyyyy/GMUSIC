/**
 * Test script to verify database write operations
 * Run with: node test-database-write.js
 */

import prisma from './src/config/prismaClient.js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

async function testDatabaseWrite() {
  try {
    console.log('🔍 Testing database write operations...\n');

    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Test 1: Find a user
    console.log('📝 Test 1: Finding a user...');
    const testUser = await prisma.user.findFirst({
      where: { email: { not: null } },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!testUser) {
      console.log('⚠️  No users found in database. Creating a test user...');
      const newUser = await prisma.user.create({
        data: {
          email: `test-${Date.now()}@example.com`,
          password: 'test-password-hash',
          name: 'Test User',
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
      console.log('✅ Test user created:', newUser.email);
      testUser = newUser;
    } else {
      console.log('✅ Found user:', testUser.email);
    }

    // Test 2: Update user with resetToken
    console.log('\n📝 Test 2: Updating user with resetToken...');
    const testToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(testToken).digest('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    try {
      const updated = await prisma.user.update({
        where: { id: testUser.id },
        data: {
          resetToken: hashedToken,
          resetTokenExpiry: expiry,
        },
        select: {
          id: true,
          email: true,
          resetToken: true,
          resetTokenExpiry: true,
        },
      });

      console.log('✅ User updated successfully!');
      console.log('   Email:', updated.email);
      console.log('   Has resetToken:', !!updated.resetToken);
      console.log('   ResetToken length:', updated.resetToken?.length || 0);
      console.log('   ResetTokenExpiry:', updated.resetTokenExpiry?.toISOString() || 'null');

      // Test 3: Verify the data was actually saved
      console.log('\n📝 Test 3: Verifying data was saved...');
      const verified = await prisma.user.findUnique({
        where: { id: testUser.id },
        select: {
          id: true,
          email: true,
          resetToken: true,
          resetTokenExpiry: true,
        },
      });

      if (verified && verified.resetToken === hashedToken) {
        console.log('✅ Data verification successful!');
        console.log('   ResetToken matches:', verified.resetToken === hashedToken);
        console.log('   ResetTokenExpiry matches:', verified.resetTokenExpiry?.getTime() === expiry.getTime());
      } else {
        console.error('❌ Data verification failed!');
        console.error('   Expected resetToken:', hashedToken.substring(0, 20) + '...');
        console.error('   Got resetToken:', verified?.resetToken?.substring(0, 20) + '...');
      }

      // Clean up: Clear the test token
      console.log('\n📝 Cleaning up test data...');
      await prisma.user.update({
        where: { id: testUser.id },
        data: {
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
      console.log('✅ Test data cleaned up');

    } catch (error) {
      console.error('❌ Update failed!');
      console.error('   Error message:', error.message);
      console.error('   Error code:', error.code);
      console.error('   Error meta:', error.meta);
      
      if (error.message.includes('Unknown field') || error.message.includes('does not exist')) {
        console.error('\n⚠️  SCHEMA MISMATCH DETECTED!');
        console.error('   The database columns do not match the Prisma schema.');
        console.error('   Fix: Run "npx prisma generate" and "npx prisma migrate dev"');
      }
    }

    console.log('\n✅ All database write tests completed');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('   Make sure:');
    console.error('   1. Database is running');
    console.error('   2. DATABASE_URL is set correctly in .env');
    console.error('   3. Prisma client is generated (npx prisma generate)');
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseWrite();

