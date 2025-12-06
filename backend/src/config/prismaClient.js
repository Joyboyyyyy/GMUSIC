import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

// Create Prisma Client (Prisma 5 version - no adapters)
const prisma = new PrismaClient();

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
