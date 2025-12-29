import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

// Create Prisma Client with proper connection handling
// Prisma will use DIRECT_URL for migrations and DATABASE_URL for queries
// 
// Log Configuration:
// - 'error': Always log errors (critical)
// - 'warn': Log warnings (schema mismatches, etc.)
// - 'info': Log connection events only
// - 'query': EXCLUDED to reduce noise (SELECT 1, health checks, etc.)
// 
// To enable query logging for debugging, set DEBUG=prisma:query in .env
// This will show all SQL queries but won't affect normal operation
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['error', 'warn', 'info']  // Removed 'query' to reduce noise
    : ['error'],
});

// Query logging middleware - DISABLED by default to reduce log noise
// Only logs slow queries (>100ms) or when explicitly enabled via PRISMA_DEBUG=true
// This prevents SELECT 1 and health check queries from cluttering logs
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  const duration = after - before;
  
  // Only log if explicitly enabled or if query is slow
  const shouldLog = process.env.PRISMA_DEBUG === 'true' || duration > 100;
  
  if (shouldLog && process.env.NODE_ENV === 'development') {
    console.log(`[Prisma] ${params.model}.${params.action} took ${duration}ms`);
    if (params.action === 'create' || params.action === 'update') {
      console.log(`[Prisma] Data:`, JSON.stringify(params.args.data, null, 2));
    }
  }
  
  return result;
});

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
