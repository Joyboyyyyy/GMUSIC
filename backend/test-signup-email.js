import 'dotenv/config';
import { sendVerificationEmail } from './src/utils/email.js';

async function testSignupEmail() {
  console.log('🧪 Testing signup verification email...\n');
  
  const testEmail = 'rocky.gretexindustries@gmail.com'; // Resend test mode recipient
  const testToken = 'test-token-12345';
  const testName = 'Test User';
  
  console.log(`📧 Sending verification email to: ${testEmail}`);
  console.log(`🔑 Token: ${testToken}`);
  console.log(`👤 Name: ${testName}\n`);
  
  try {
    await sendVerificationEmail(testEmail, testToken, testName);
    console.log('\n✅ Verification email sent successfully!');
    console.log('📬 Check your inbox at:', testEmail);
  } catch (error) {
    console.error('\n❌ Failed to send verification email:');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testSignupEmail();
