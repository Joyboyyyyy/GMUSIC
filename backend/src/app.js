import express from "express";
import cors from "cors";
import authRoutes from './routes/auth.routes.js';
import courseRoutes from "./routes/course.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import razorpayRoutes from "./routes/razorpay.routes.js";
import zohoRoutes from "./routes/zoho.routes.js";
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
