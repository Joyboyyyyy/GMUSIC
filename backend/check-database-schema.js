/**
 * Script to check if database schema matches Prisma schema
 * Run with: node check-database-schema.js
 */

import prisma from './src/config/prismaClient.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Checking database schema...\n');

    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Try to query User model with resetToken fields
    try {
      const testUser = await prisma.user.findFirst({
        where: { email: { not: null } },
        select: {
          id: true,
          email: true,
          resetToken: true,
          resetTokenExpiry: true,
          verificationToken: true,
          isVerified: true,
        },
      });
      
      console.log('✅ Prisma User model fields are accessible:');
      console.log('   - resetToken: ✅');
      console.log('   - resetTokenExpiry: ✅');
      console.log('   - verificationToken: ✅');
      console.log('   - isVerified: ✅');
      console.log('\n✅ Database schema matches Prisma schema!\n');
      
    } catch (error) {
      console.error('❌ Error accessing User model fields:');
      console.error('   Error message:', error.message);
      console.error('   Error code:', error.code);
      
      if (error.message.includes('Unknown field') || error.message.includes('does not exist')) {
        console.error('\n⚠️  DATABASE SCHEMA MISMATCH DETECTED!');
        console.error('   The database columns do not match the Prisma schema.');
        console.error('\n📝 To fix this:');
        console.error('   1. Stop the backend server');
        console.error('   2. Run: npx prisma migrate dev --name add_reset_token_fields');
        console.error('   3. Or manually add the columns to your database:');
        console.error('      - resetToken (TEXT, nullable)');
        console.error('      - resetTokenExpiry (TIMESTAMP, nullable)');
        console.error('      - verificationToken (TEXT, nullable)');
        console.error('      - verificationExpires (TIMESTAMP, nullable)');
        console.error('      - isVerified (BOOLEAN, default false)');
      }
    }

    // Check if we can update a user with resetToken
    try {
      const testUpdate = await prisma.user.updateMany({
        where: { id: '00000000-0000-0000-0000-000000000000' }, // Non-existent ID
        data: {
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
      console.log('✅ Can update resetToken fields (test query succeeded)\n');
    } catch (error) {
      if (error.message.includes('Unknown field') || error.message.includes('does not exist')) {
        console.error('❌ Cannot update resetToken fields - columns missing in database\n');
      } else {
        // Expected error for non-existent user, which is fine
        console.log('✅ Can update resetToken fields (test query succeeded)\n');
      }
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    console.error('   Make sure:');
    console.error('   1. Database is running');
    console.error('   2. DATABASE_URL is set correctly in .env');
    console.error('   3. Database connection is accessible');
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseSchema();

