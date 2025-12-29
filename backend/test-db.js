import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  const result = await prisma.$queryRaw`SELECT 1 as ok`
  console.log('Database working:', result)
  await prisma.$disconnect()
}

test().catch(console.error)
