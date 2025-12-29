/**
 * Test script to diagnose forgot password email sending
 * Run: node test-forgot-password.js
 */

import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

console.log('🔍 Testing Forgot Password Email Flow\n');
console.log('=' .repeat(50));

// 1. Check environment variables
console.log('\n1️⃣ Checking Environment Variables:');
const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'BACKEND_URL'];
const missing = [];

required.forEach(key => {
  const value = process.env[key];
  if (value) {
    if (key === 'SMTP_PASS') {
      console.log(`   ✅ ${key}: SET (${value.length} characters)`);
    } else {
      console.log(`   ✅ ${key}: ${value}`);
    }
  } else {
    console.log(`   ❌ ${key}: NOT SET`);
    missing.push(key);
  }
});

if (missing.length > 0) {
  console.log(`\n   ⚠️  Missing required variables: ${missing.join(', ')}`);
  console.log('   Please set these in your .env file\n');
  process.exit(1);
}

// 2. Create transporter
console.log('\n2️⃣ Creating Nodemailer Transporter:');
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

console.log(`   Host: ${process.env.SMTP_HOST}`);
console.log(`   Port: ${process.env.SMTP_PORT}`);
console.log(`   Secure: true`);
console.log(`   User: ${process.env.SMTP_USER}`);

// 3. Verify SMTP connection
console.log('\n3️⃣ Verifying SMTP Connection:');
try {
  await transporter.verify();
  console.log('   ✅ SMTP connection verified successfully!');
} catch (error) {
  console.log('   ❌ SMTP verification failed!');
  console.log(`   Error: ${error.message}`);
  console.log(`   Code: ${error.code}`);
  if (error.response) {
    console.log(`   Response: ${error.response}`);
  }
  console.log('\n   Common issues:');
  console.log('   - Wrong SMTP credentials');
  console.log('   - Firewall blocking port 465');
  console.log('   - SMTP server not accessible');
  console.log('   - Wrong SMTP host/port\n');
  process.exit(1);
}

// 4. Test sending email
console.log('\n4️⃣ Testing Email Send:');
const testEmail = process.env.TEST_EMAIL || process.env.SMTP_USER;
console.log(`   Sending test email to: ${testEmail}`);

const testToken = 'TEST_TOKEN_' + Date.now();
const backendUrl = process.env.BACKEND_URL.trim().replace(/\/+$/, '');
const resetUrl = `${backendUrl}/api/auth/reset-password?token=${testToken}`;

const mailOptions = {
  from: process.env.EMAIL_FROM || process.env.SMTP_USER,
  to: testEmail,
  subject: 'Test Password Reset Email',
  html: `
    <h2>Test Password Reset</h2>
    <p>This is a test email to verify SMTP is working.</p>
    <p>Reset URL: ${resetUrl}</p>
    <p>If you receive this, SMTP is configured correctly!</p>
  `,
};

try {
  const info = await transporter.sendMail(mailOptions);
  console.log('   ✅ Email sent successfully!');
  console.log(`   Message ID: ${info.messageId}`);
  console.log(`   Response: ${info.response}`);
  console.log(`\n   📧 Check your inbox at: ${testEmail}`);
  console.log('   (Also check spam/junk folder)');
} catch (error) {
  console.log('   ❌ Failed to send email!');
  console.log(`   Error: ${error.message}`);
  console.log(`   Code: ${error.code}`);
  if (error.response) {
    console.log(`   Response: ${error.response}`);
  }
  if (error.command) {
    console.log(`   Command: ${error.command}`);
  }
  console.log('\n   Common issues:');
  console.log('   - Email address not valid');
  console.log('   - SMTP server rejected the email');
  console.log('   - Rate limiting');
  console.log('   - Authentication failed\n');
  process.exit(1);
}

console.log('\n' + '='.repeat(50));
console.log('✅ All tests passed! SMTP is working correctly.');
console.log('='.repeat(50) + '\n');

