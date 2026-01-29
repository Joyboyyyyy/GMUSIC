import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

// Create Prisma Client with optimized connection pooling
// Using connection pooler (pgbouncer) in TRANSACTION mode for better resource management
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['error', 'warn']  // Removed 'info' to reduce noise
    : ['error'],
});

// Query logging middleware - DISABLED by default to reduce log noise
// Only logs slow queries (>100ms) or when explicitly enabled via PRISMA_DEBUG=true
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  const duration = after - before;
  
  // Only log if explicitly enabled or if query is slow
  const shouldLog = process.env.PRISMA_DEBUG === 'true' || duration > 100;
  
  if (shouldLog && process.env.NODE_ENV === 'development') {
    console.log(`[Prisma] ${params.model}.${params.action} took ${duration}ms`);
  }
  
  return result;
});

// Graceful shutdown with connection cleanup
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

// Handle SIGTERM for graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[Prisma] SIGTERM received, disconnecting...");
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
