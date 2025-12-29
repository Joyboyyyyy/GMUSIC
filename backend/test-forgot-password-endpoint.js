/**
 * Test the forgot password endpoint with detailed logging simulation
 * Usage: node test-forgot-password-endpoint.js YOUR_EMAIL@example.com
 */

import dotenv from 'dotenv';

dotenv.config();

const email = process.argv[2] || 'test@example.com';

console.log('🧪 Testing Forgot Password Endpoint\n');
console.log('='.repeat(60));
console.log(`Email: ${email}`);
console.log(`Endpoint: http://localhost:3000/api/auth/forgot-password`);
console.log('='.repeat(60) + '\n');

console.log('📋 Expected Server Logs (check your backend console):\n');
console.log('─'.repeat(60));
console.log(`[Auth Controller] Forgot password requested`);
console.log(`[Auth Service] Forgot password flow started for email: ${email}`);
console.log('─'.repeat(60));
console.log('\nIf user EXISTS, you should see:');
console.log('  ✅ [Auth Service] User found');
console.log('  ✅ [Auth Service] Reset token generated');
console.log('  ✅ [Auth Service] Sending reset email');
console.log('  ✅ [Email] 📧 sendPasswordResetEmail called for: ' + email);
console.log('  ✅ [Email] ✅ SMTP transporter verified successfully');
console.log('  ✅ 📨 RESET EMAIL SENT TO: ' + email);
console.log('\nIf user DOES NOT EXIST, you will see:');
console.log('  ⚠️  [Auth Service] User not found for email: ' + email);
console.log('  ⚠️  (No email will be sent)');
console.log('\n' + '='.repeat(60));
console.log('\n📧 Making request...\n');

try {
  const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  
  console.log('✅ Response received:');
  console.log(`   Status: ${response.status}`);
  console.log(`   Message: ${data.message || data.success?.message || 'N/A'}`);
  console.log('\n⚠️  Note: The response always shows success (security feature)');
  console.log('   Check your BACKEND SERVER LOGS to see if email was actually sent.');
  console.log('\n📧 Next steps:');
  console.log('   1. Check your backend server console for the logs above');
  console.log('   2. Check your email inbox (and spam folder)');
  console.log('   3. Verify the user exists: node check-user-email.js ' + email);
  
} catch (error) {
  console.error('❌ Request failed:', error.message);
  console.error('\nMake sure your backend server is running on port 3000');
}

