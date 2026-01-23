import db from './src/lib/db.js';

async function verifyUserManually() {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.log('Usage: node verify-user-manually.js <email>');
      console.log('Example: node verify-user-manually.js rockyprahan9820.rp@gmail.com');
      process.exit(1);
    }

    console.log('\n🔧 Manually verifying user:', email);
    console.log('='.repeat(60));

    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    });

    if (!user) {
      console.log('❌ User NOT FOUND');
      process.exit(1);
    }

    if (user.emailVerified) {
      console.log('✅ User is already verified!');
      process.exit(0);
    }

    // Update user to verified
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationExpiry: null,
      },
    });

    console.log('✅ User verified successfully!');
    console.log('\nUser can now login with:');
    console.log('- Email:', user.email);
    console.log('- Password: (the password they used during signup)');
    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyUserManually();
