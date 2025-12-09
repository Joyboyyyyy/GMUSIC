import app from './app.js';
import prisma from './config/prismaClient.js';

const PORT = process.env.PORT || 3000;

// Test database connection
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  try {
    await testDatabaseConnection();

    app.listen(PORT, "0.0.0.0", () => {
      console.log('\n🚀 Gretex Music Room API Server');
      console.log(`📡 Server running on http://192.168.100.40:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📚 API Documentation: http://192.168.100.40:${PORT}/health`);
      console.log('\n✨ Ready to serve music education!\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n⏸️  SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n⏸️  SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();

