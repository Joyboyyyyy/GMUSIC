/**
 * Database Layer - Prisma Only
 * 
 * This module exports PrismaClient as the single source of truth for database operations.
 * Prisma connects to Supabase PostgreSQL using DATABASE_URL and DIRECT_URL from .env
 * 
 * Usage:
 *   import db from './lib/db.js';
 *   const user = await db.user.findUnique({ where: { id: '...' } });
 * 
 * Environment variables required:
 *   DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require
 *   DIRECT_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require
 */

import prisma from '../config/prismaClient.js';

// Export Prisma client directly
// Prisma will use DATABASE_URL for queries and DIRECT_URL for migrations
export default prisma;

