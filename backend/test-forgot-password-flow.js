/**
 * Complete test of forgot password flow
 * This simulates what happens when a user requests password reset
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { add } from 'date-fns';
import { sendPasswordResetEmail } from './src/utils/email.js';

dotenv.config();

const prisma = new PrismaClient();
const testEmail = 'amitg.gretex@gmail.com';

console.log('🧪 Testing Complete Forgot Password Flow\n');
console.log('='.repeat(60));
console.log(`Testing with email: ${testEmail}`);
console.log('='.repeat(60) + '\n');

try {
  // Step 1: Check if user exists
  console.log('1️⃣ Checking if user exists...');
  const user = await prisma.user.findUnique({
    where: { email: testEmail },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    console.log('❌ User not found!');
    console.log('   Email will NOT be sent (security feature)');
    process.exit(1);
  }

  console.log('✅ User found:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Name: ${user.name}`);
  console.log(`   Email: ${user.email}\n`);

  // Step 2: Generate reset token
  console.log('2️⃣ Generating reset token...');
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const resetTokenExpiry = add(new Date(), { minutes: 15 });
  
  console.log(`   Raw token length: ${rawToken.length} characters`);
  console.log(`   Hashed token: ${hashedToken.substring(0, 20)}...`);
  console.log(`   Expires at: ${resetTokenExpiry}\n`);

  // Step 3: Save to database
  console.log('3️⃣ Saving reset token to database...');
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: resetTokenExpiry,
      },
    });
    console.log('✅ Reset token saved to database\n');
  } catch (dbError) {
    console.error('❌ Database update failed!');
    console.error('   Error:', dbError.message);
    console.error('\n   This might mean:');
    console.error('   - resetToken/resetTokenExpiry fields don\'t exist in database');
    console.error('   - Prisma client is out of sync');
    console.error('   - Database migration needed\n');
    throw dbError;
  }

  // Step 4: Send email
  console.log('4️⃣ Sending password reset email...');
  try {
    await sendPasswordResetEmail(user.email, rawToken);
    console.log('✅ Email sent successfully!\n');
  } catch (emailError) {
    console.error('❌ Email sending failed!');
    console.error('   Error:', emailError.message);
    console.error('   Code:', emailError.code);
    if (emailError.response) {
      console.error('   Response:', emailError.response);
    }
    throw emailError;
  }

  console.log('='.repeat(60));
  console.log('✅ ALL STEPS COMPLETED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log('\n📧 Check the inbox for:', testEmail);
  console.log('   (Also check spam/junk folder)');
  console.log('\n🔗 Reset link format:');
  console.log(`   ${process.env.BACKEND_URL}/api/auth/reset-password?token=${rawToken.substring(0, 20)}...`);

} catch (error) {
  console.error('\n❌ TEST FAILED');
  console.error('Error:', error.message);
  if (error.stack) {
    console.error('\nStack trace:');
    console.error(error.stack);
  }
  process.exit(1);
} finally {
  await prisma.$disconnect();
}

