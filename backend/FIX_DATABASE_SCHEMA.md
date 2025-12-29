# Fix Database Schema Issues

## 🔍 Current Status

The Prisma schema defines these fields for password reset:
- `resetToken` (String?)
- `resetTokenExpiry` (DateTime?)
- `verificationToken` (String?)
- `verificationExpires` (DateTime?)
- `isVerified` (Boolean)

## ⚠️ Common Issues

### Issue 1: Prisma Client Not Generated
**Error:** `Unknown field resetToken for select statement on model User`

**Fix:**
1. Stop the backend server (Ctrl+C)
2. Run: `npx prisma generate`
3. Restart the server

### Issue 2: Database Schema Mismatch
**Error:** `column "resetToken" does not exist`

**Fix:**
1. Stop the backend server
2. Run: `npx prisma migrate dev --name add_reset_token_fields`
3. Or manually add columns to database (see below)

### Issue 3: File Lock Error
**Error:** `EPERM: operation not permitted, unlink 'query_engine-windows.dll.node'`

**Fix:**
1. Stop the backend server completely
2. Close any other processes using Prisma
3. Run: `npx prisma generate`
4. Restart the server

## 📝 Manual Database Fix (If Migrations Don't Work)

If you're using Supabase or direct PostgreSQL access, run these SQL commands:

```sql
-- Add resetToken fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP;

-- Add verification fields (if not already present)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationExpires" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN DEFAULT false;

-- Verify columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('resetToken', 'resetTokenExpiry', 'verificationToken', 'isVerified');
```

## ✅ Verification Steps

1. **Check Prisma Client:**
   ```bash
   node check-database-schema.js
   ```

2. **Verify in Code:**
   - Backend logs should show: `✅ Reset token fields (resetToken, resetTokenExpiry) are available`
   - No errors when accessing `prisma.user.update()` with resetToken

3. **Test Forgot Password:**
   - Request password reset
   - Check backend logs for successful token save
   - Email should be sent

## 🚀 Quick Fix Commands

```bash
# 1. Stop server (Ctrl+C)

# 2. Generate Prisma client
cd backend
npx prisma generate

# 3. If schema mismatch, create migration
npx prisma migrate dev --name add_reset_token_fields

# 4. Restart server
npm run dev
```

## 📋 Expected Schema

The `User` table should have:
- `id` (UUID, primary key)
- `email` (TEXT, unique)
- `password` (TEXT)
- `resetToken` (TEXT, nullable) ✅
- `resetTokenExpiry` (TIMESTAMP, nullable) ✅
- `verificationToken` (TEXT, nullable) ✅
- `verificationExpires` (TIMESTAMP, nullable) ✅
- `isVerified` (BOOLEAN, default false) ✅
- Other fields (name, role, createdAt, etc.)

## 🔧 Troubleshooting

### If Prisma Generate Fails:
1. Delete `node_modules/.prisma` folder
2. Run `npm install` again
3. Run `npx prisma generate`

### If Migration Fails:
1. Check database connection
2. Verify `DATABASE_URL` and `DIRECT_URL` in `.env`
3. Check database permissions
4. Try manual SQL fix (see above)

### If Still Not Working:
1. Check backend logs for specific error
2. Run `node check-database-schema.js` to diagnose
3. Verify database columns exist using SQL query

