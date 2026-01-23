import db from './src/lib/db.js';
import bcrypt from 'bcryptjs';

async function checkUserLogin() {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.log('Usage: node check-user-login.js <email>');
      console.log('Example: node check-user-login.js rockyprahan9820.rp@gmail.com');
      process.exit(1);
    }

    console.log('\n🔍 Checking user:', email);
    console.log('='.repeat(60));

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        emailVerified: true,
        isActive: true,
        failedLoginAttempts: true,
        isLockedUntil: true,
        createdAt: true,
        verificationToken: true,
        verificationExpiry: true,
      },
    });

    if (!user) {
      console.log('❌ User NOT FOUND in database');
      console.log('\nPossible reasons:');
      console.log('1. Email address is incorrect');
      console.log('2. User never completed signup');
      console.log('3. User was deleted');
      process.exit(1);
    }

    console.log('\n✅ User FOUND in database');
    console.log('\nUser Details:');
    console.log('- ID:', user.id);
    console.log('- Name:', user.name);
    console.log('- Email:', user.email);
    console.log('- Created:', user.createdAt);
    console.log('\nAccount Status:');
    console.log('- Email Verified:', user.emailVerified ? '✅ YES' : '❌ NO');
    console.log('- Account Active:', user.isActive ? '✅ YES' : '❌ NO');
    console.log('- Failed Login Attempts:', user.failedLoginAttempts || 0);
    console.log('- Account Locked:', user.isLockedUntil ? `🔒 Until ${user.isLockedUntil}` : '✅ Not locked');
    
    console.log('\nPassword Hash:');
    console.log('- Hash Type:', user.password.startsWith('$2a$') || user.password.startsWith('$2b$') ? 'bcrypt ✅' : 'argon2 ⚠️');
    console.log('- Hash Preview:', user.password.substring(0, 20) + '...');

    if (user.verificationToken) {
      console.log('\nVerification Status:');
      console.log('- Has Token:', '✅ YES');
      console.log('- Token Expires:', user.verificationExpiry);
      console.log('- Expired:', new Date() > user.verificationExpiry ? '❌ YES' : '✅ NO');
    }

    console.log('\n' + '='.repeat(60));
    console.log('LOGIN DIAGNOSIS:');
    console.log('='.repeat(60));

    if (!user.emailVerified) {
      console.log('❌ LOGIN WILL FAIL: Email not verified');
      console.log('\nSolution:');
      console.log('1. Check email inbox for verification link');
      console.log('2. Or manually verify with:');
      console.log(`   node backend/verify-user-manually.js ${email}`);
    } else if (!user.isActive) {
      console.log('❌ LOGIN WILL FAIL: Account not active');
    } else if (user.isLockedUntil && new Date() < user.isLockedUntil) {
      console.log('❌ LOGIN WILL FAIL: Account locked due to failed attempts');
      console.log(`   Locked until: ${user.isLockedUntil}`);
    } else if (user.password.startsWith('$argon2')) {
      console.log('❌ LOGIN WILL FAIL: Password uses old argon2 hash');
      console.log('\nSolution: User must reset password');
    } else {
      console.log('✅ LOGIN SHOULD WORK (if password is correct)');
      console.log('\nTo test password:');
      console.log('   node backend/test-password.js', email, '<password>');
    }

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUserLogin();
