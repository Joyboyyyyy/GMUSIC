import express from "express";
import cors from "cors";
import authRoutes from './routes/auth.routes.js';
import courseRoutes from "./routes/course.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import razorpayRoutes from "./routes/razorpay.routes.js";
import zohoRoutes from "./routes/zoho.routes.js";
import buildingRoutes from "./routes/building.routes.js";
import slotRoutes from "./routes/slot.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import searchRoutes from "./routes/search.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import { verifyEmailRedirect, resetPasswordRedirect } from './controllers/redirect.controller.js';

const app = express();

// CORS configuration for Android emulator and local development
// Android emulator uses 10.0.2.2 to access host machine's localhost
const corsOptions = {
  // In development, allow all origins for easier testing (Android emulator, localhost, etc.)
  // In production, use specific allowed origins
  origin: process.env.NODE_ENV === 'development' 
    ? true  // Allow all origins in development
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://10.0.2.2:3000',        // Android emulator default host
        'http://192.168.2.122:3000',   // Local network IP
      ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
};

// CORS must be first
app.use(cors(corsOptions));

// Body parsing middleware - MUST be before routes
// Increased limit to 50mb for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Debug middleware to log all incoming requests
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth')) {
    console.log(`🔍 [DEBUG] Auth request: ${req.method} ${req.path}`);
  }
  next();
});

// Debug middleware to log all incoming requests to /api/payments/*
app.use("/api/payments", (req, res, next) => {
  console.log(`🔍 [DEBUG] Incoming request: ${req.method} ${req.path}`);
  next();
});

/* Health checks */
// Root route for Render health checks
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Gretex Music Room API",
    version: "1.0.0",
    docs: "/health for detailed status"
  });
});

app.get("/health", async (req, res) => {
  try {
    // Database health check - uses minimal SELECT 1 query to verify database is responsive
    // NOTE: This query is necessary for health monitoring but excluded from Prisma query logs
    // to reduce log noise. Prisma log configuration filters out these health check queries.
    const db = (await import('./lib/db.js')).default;
    await db.$queryRaw`SELECT 1`;
    
    res.json({
      success: true,
      message: "Gretex API running",
      database: "connected",
      adapter: "prisma",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Gretex API running but database connection failed",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Gretex API running",
    timestamp: new Date().toISOString(),
  });
});

/* Email redirect endpoints - HTTPS links for email clients */
// These endpoints redirect to app deep links, making email links clickable in all email clients
app.get('/auth/verify-email', verifyEmailRedirect);
app.get('/auth/reset-password', resetPasswordRedirect);

/* API routes */
console.log("🔧 Mounting auth routes at /api/auth...");
app.use('/api/auth', authRoutes);
console.log("✅ Auth routes mounted at /api/auth");

// Debug: Log registered auth routes (always log for debugging)
console.log('📋 Registered auth routes:');
authRoutes.stack.forEach((r) => {
  if (r.route) {
    const methods = Object.keys(r.route.methods).join(', ').toUpperCase();
    console.log(`  ${methods} /api/auth${r.route.path}`);
  } else if (r.name === 'router') {
    // Handle nested routers
    console.log(`  [Nested Router] ${r.regexp}`);
  }
});
console.log(`📋 Total auth route handlers: ${authRoutes.stack.length}`);

app.use("/api/courses", courseRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/payments/razorpay", razorpayRoutes);
app.use("/api/zoho", zohoRoutes);
app.use("/api/buildings", buildingRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/invoices", invoiceRoutes);

// Test email endpoint (for debugging SMTP)
app.get('/api/test-email', async (req, res) => {
  try {
    const { to } = req.query;
    if (!to) {
      return res.status(400).json({ success: false, error: 'Please provide ?to=your@email.com' });
    }

    const nodemailer = await import('nodemailer');
    
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '465');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const emailFrom = process.env.EMAIL_FROM || smtpUser;

    console.log('[Test Email] SMTP Config:');
    console.log(`  Host: ${smtpHost}`);
    console.log(`  Port: ${smtpPort}`);
    console.log(`  User: ${smtpUser}`);
    console.log(`  From: ${emailFrom}`);
    console.log(`  To: ${to}`);

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(500).json({ 
        success: false, 
        error: 'SMTP not configured',
        config: { smtpHost, smtpPort, smtpUser: smtpUser ? 'SET' : 'NOT SET', smtpPass: smtpPass ? 'SET' : 'NOT SET' }
      });
    }

    const transporter = nodemailer.default.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Verify connection
    console.log('[Test Email] Verifying SMTP connection...');
    await transporter.verify();
    console.log('[Test Email] ✅ SMTP connection verified');

    // Send test email
    const info = await transporter.sendMail({
      from: emailFrom,
      to: to,
      subject: 'Test Email from Gretex Music Room',
      html: `
        <h1>🎵 Test Email</h1>
        <p>This is a test email from Gretex Music Room backend.</p>
        <p>If you received this, your SMTP configuration is working!</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
    });

    console.log('[Test Email] ✅ Email sent:', info.messageId);
    
    res.json({ 
      success: true, 
      message: 'Test email sent!',
      messageId: info.messageId,
      to: to
    });
  } catch (error) {
    console.error('[Test Email] ❌ Error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Debug: Log all registered routes in development
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production') {
  console.log('📋 Registered payment routes:');
  paymentRoutes.stack.forEach((r) => {
    if (r.route) {
      const methods = Object.keys(r.route.methods).join(', ').toUpperCase();
      console.log(`  ${methods} /api/payments${r.route.path}`);
    }
  });
}

// Catch-all 404 handler for debugging
app.use((req, res, next) => {
  console.log(`❌ [404] Route not found: ${req.method} ${req.path}`);
  console.log(`   Original URL: ${req.originalUrl}`);
  console.log(`   Base URL: ${req.baseUrl}`);
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.path}`,
    message: 'Route not found',
    path: req.path,
    method: req.method
  });
});

export default app;
