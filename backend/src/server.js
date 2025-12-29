import app from './app.js';
import db from './lib/db.js';
import { verifySMTPConnection } from './utils/email.js';

// NEW: Auto-detect local network IPv4 address
import os from "os";
import dotenv from 'dotenv';
dotenv.config();

function getLocalIPv4() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost"; // fallback
}

const localIP = getLocalIPv4();
const PORT = process.env.PORT || 3000;

// Test database connection
// NOTE: prisma.$connect() and $queryRaw`SELECT 1` are health checks
// These queries are necessary for connection validation but generate log noise
// Prisma log configuration excludes 'query' to prevent these from appearing in logs
async function testDatabaseConnection() {
  try {
    // Connection check - verifies database connection
    await db.$connect();
    console.log('✅ Database connected successfully');
    
    // Query capability test - verifies database accepts queries (not just connection)
    // This SELECT 1 query is intentionally minimal to test query execution
    try {
      await db.$queryRaw`SELECT 1`;
      console.log('✅ Database query test passed');
    } catch (queryError) {
      console.error('❌ Database query test failed:', queryError);
      throw new Error('Database is connected but queries are failing');
    }
    
    // Verify User model fields to detect schema mismatches early
    try {
      // Try to access the model fields to verify schema is in sync
      const userFields = Object.keys(db.user.fields ?? {});
      if (userFields.length > 0) {
        console.log('🔍 User model fields detected:', userFields.length, 'fields');
        // Check for critical reset token fields
        const hasResetToken = userFields.includes('resetToken');
        const hasResetTokenExpiry = userFields.includes('resetTokenExpiry');
        if (hasResetToken && hasResetTokenExpiry) {
          console.log('✅ Reset token fields (resetToken, resetTokenExpiry) are available');
        } else {
          console.warn('⚠️  Reset token fields may not be available');
          console.warn('   Run: npx prisma generate');
        }
      } else {
        console.warn('⚠️  Could not detect User model fields - schema may be out of sync');
        console.warn('   Run: npx prisma generate');
      }
    } catch (schemaError) {
      console.warn('⚠️  Could not verify schema:', schemaError.message);
      console.warn('   This may indicate a schema mismatch. Run: npx prisma generate');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('   Error code:', error.code);
    console.error('   Error message:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check DATABASE_URL in .env file');
    console.error('   2. Ensure database server is running');
    console.error('   3. Verify network connectivity to database');
    console.error('   4. Check database credentials');
    process.exit(1);
  }
}

// Check required environment variables
function checkEnvironmentVariables() {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'BACKEND_URL'];
  const optional = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'EMAIL_FROM'];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('⚠️  Server will not start without these variables');
    process.exit(1);
  }
  
  // Warn about optional variables
  const missingOptional = optional.filter(key => !process.env[key]);
  if (missingOptional.length > 0) {
    console.warn('⚠️  Optional environment variables not set:', missingOptional.join(', '));
    console.warn('   Some features (e.g., payments) may not work without these');
  } else {
    console.log('✅ All required environment variables are set');
  }
}

// Start server
async function startServer() {
  try {
    // Check environment variables first
    checkEnvironmentVariables();
    
    await testDatabaseConnection();
    
    // Verify SMTP connection on startup
    await verifySMTPConnection();

    // Create server instance - explicitly bind to 0.0.0.0 for Android emulator access
    // 0.0.0.0 allows connections from all network interfaces (localhost, LAN, Android emulator)
    const server = app.listen(PORT, "0.0.0.0", () => {
      // ONE consolidated startup log
      console.log("\n🚀 Gretex API Server Started");
      console.log(`   Local URL:   http://localhost:${PORT}`);
      console.log(`   Network URL: http://${localIP}:${PORT}`);
      console.log(`   Listening on: 0.0.0.0:${PORT} (all interfaces)\n`);
    });

    // Handle EADDRINUSE error
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.error('   Another server instance may be running');
        console.error('   Solution: Stop the existing server or use a different port');
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n⏸️  SIGTERM received, shutting down gracefully...');
  await db.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⏸️  SIGINT received, shutting down gracefully...');
  await db.$disconnect();
  process.exit(0);
});

// Start the server
startServer();

