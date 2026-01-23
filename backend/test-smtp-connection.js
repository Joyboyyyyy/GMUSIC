import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

async function testSMTP() {
  console.log('🔍 Testing SMTP Connection...\n');
  
  // Display configuration (hide password)
  console.log('Configuration:');
  console.log('  SMTP_HOST:', process.env.SMTP_HOST);
  console.log('  SMTP_PORT:', process.env.SMTP_PORT);
  console.log('  SMTP_SECURE:', process.env.SMTP_SECURE);
  console.log('  SMTP_USER:', process.env.SMTP_USER);
  console.log('  SMTP_PASS:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET');
  console.log('  EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('');

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    debug: true, // Enable debug output
    logger: true, // Log to console
  });

  try {
    // Test 1: Verify connection
    console.log('Test 1: Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!\n');

    // Test 2: Send test email
    console.log('Test 2: Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Send to self for testing
      subject: 'SMTP Test Email - Gretex Music Room',
      text: 'This is a test email from your Gretex Music Room backend.',
      html: '<p>This is a test email from your <strong>Gretex Music Room</strong> backend.</p>',
    });

    console.log('✅ Test email sent successfully!');
    console.log('   Message ID:', info.messageId);
    console.log('   Response:', info.response);
    console.log('\n✅ All tests passed! SMTP is working correctly.');
    
  } catch (error) {
    console.error('\n❌ SMTP Test Failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Command:', error.command);
    
    // Provide helpful suggestions
    console.log('\n💡 Troubleshooting suggestions:');
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
      console.log('   - SMTP server might be blocking connections from Render');
      console.log('   - Try using port 587 with SMTP_SECURE=false instead of 465');
      console.log('   - Check if Hostinger requires whitelisting of IP addresses');
      console.log('   - Consider using a different email service (Resend, SendGrid, etc.)');
    } else if (error.code === 'EAUTH') {
      console.log('   - Check SMTP username and password are correct');
      console.log('   - Verify email account is active');
      console.log('   - Check if 2FA is enabled (may need app-specific password)');
    } else if (error.responseCode === 535) {
      console.log('   - Authentication failed - check credentials');
      console.log('   - May need to enable "Less secure app access" or use app password');
    }
    
    process.exit(1);
  }
}

testSMTP();
