-- Complete Database Schema for Supabase
-- This file contains all tables and fields as defined in the Prisma schema

-- CreateTable: User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Add missing columns to User table (if they don't exist)
DO $$ 
BEGIN
    -- Add avatar column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'avatar') THEN
        ALTER TABLE "User" ADD COLUMN "avatar" TEXT;
    END IF;
    
    -- Add resetToken column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'resetToken') THEN
        ALTER TABLE "User" ADD COLUMN "resetToken" TEXT;
    END IF;
    
    -- Add resetTokenExpiry column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'resetTokenExpiry') THEN
        ALTER TABLE "User" ADD COLUMN "resetTokenExpiry" TIMESTAMP(3);
    END IF;
    
    -- Add failedLoginAttempts column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'failedLoginAttempts') THEN
        ALTER TABLE "User" ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
    END IF;
    
    -- Add isLockedUntil column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'isLockedUntil') THEN
        ALTER TABLE "User" ADD COLUMN "isLockedUntil" TIMESTAMP(3);
    END IF;
    
    -- Add lastFailedLogin column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'lastFailedLogin') THEN
        ALTER TABLE "User" ADD COLUMN "lastFailedLogin" TIMESTAMP(3);
    END IF;
    
    -- Add isVerified column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'isVerified') THEN
        ALTER TABLE "User" ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    -- Add verificationExpires column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'verificationExpires') THEN
        ALTER TABLE "User" ADD COLUMN "verificationExpires" TIMESTAMP(3);
    END IF;
    
    -- Add verificationToken column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'verificationToken') THEN
        ALTER TABLE "User" ADD COLUMN "verificationToken" TEXT;
    END IF;
    
    -- Add isActive column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'isActive') THEN
        ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
    END IF;
    
    -- Update role default if needed
    ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'user';
END $$;

-- CreateTable: Course
CREATE TABLE IF NOT EXISTS "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL,
    "zohoItemId" TEXT,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Enrollment
CREATE TABLE IF NOT EXISTS "Enrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "zohoInvoiceId" TEXT,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT IF EXISTS "Enrollment_userId_fkey";
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" DROP CONSTRAINT IF EXISTS "Enrollment_courseId_fkey";
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

