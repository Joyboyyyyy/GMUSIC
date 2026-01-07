# Supabase + Prisma Configuration Fix

## Problem
The backend was crashing with:
```
PrismaClientInitializationError: Error querying the database: unexpected message from server
```

This happened because Supabase uses PgBouncer for connection pooling, which doesn't support all Prisma operations (like migrations and certain queries).

## Solution
Configured Prisma to use both pooled and direct connections:
- **DATABASE_URL**: Pooled connection (PgBouncer) for regular queries
- **DIRECT_URL**: Direct connection for migrations and operations that require it

## Changes Made

### 1. Updated `prisma/schema.prisma`
Added `directUrl` to the datasource:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 2. Updated `src/config/prismaClient.js`
Added proper logging configuration for better debugging.

### 3. Updated Environment Variables
Both `ENV_TEMPLATE.txt` and `ENV_COMPLETE.txt` now include:
- `DATABASE_URL`: Pooler connection with `pgbouncer=true&sslmode=require`
- `DIRECT_URL`: Direct connection with `sslmode=require`

## Supabase Connection Strings

### DATABASE_URL (Pooled - for queries)
```
postgresql://user:password@pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

### DIRECT_URL (Direct - for migrations)
```
postgresql://user:password@db.supabase.com:5432/postgres?sslmode=require
```

## How It Works

1. **Regular Queries**: Prisma uses `DATABASE_URL` (pooled connection via PgBouncer)
2. **Migrations**: Prisma automatically uses `DIRECT_URL` (direct connection)
3. **Operations requiring transactions**: Prisma uses `DIRECT_URL` when needed

## Next Steps

### 1. Update your `.env` file:
```env
DATABASE_URL="postgresql://user:password@pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://user:password@db.supabase.com:5432/postgres?sslmode=require"
```

Replace `user`, `password`, and database name with your actual Supabase credentials.

### 2. Regenerate Prisma Client:
```bash
cd backend
npx prisma generate
```

### 3. Run migrations (if needed):
```bash
npx prisma migrate deploy
# or for development:
npx prisma migrate dev
```

### 4. Start the server:
```bash
npm run dev
```

## Finding Your Supabase Connection Strings

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Find **Connection string** section
4. Copy:
   - **Connection pooling** → Use for `DATABASE_URL`
   - **Direct connection** → Use for `DIRECT_URL`

Make sure to:
- Replace `[YOUR-PASSWORD]` with your actual database password
- Add `?pgbouncer=true&sslmode=require` to the pooled connection
- Add `?sslmode=require` to the direct connection

## Verification

After updating `.env` and regenerating Prisma Client, test the connection:

```bash
# Test Prisma connection
npx prisma db pull

# Or start the server
npm run dev
```

You should see:
```
✅ Database connected successfully
🚀 Gretex API running on:
- Local:   http://localhost:3000
- Network: http://192.168.100.40:3000
```

## Important Notes

- **SSL is required**: Both connections must include `sslmode=require`
- **Different ports**: Pooler uses port `6543`, direct uses port `5432`
- **Different hosts**: Pooler uses `pooler.supabase.com`, direct uses `db.supabase.com`
- **Prisma handles switching**: You don't need to manually switch connections - Prisma does it automatically

## Troubleshooting

If you still get connection errors:

1. **Verify credentials**: Make sure your Supabase password is correct
2. **Check SSL**: Ensure `sslmode=require` is in both URLs
3. **Regenerate Prisma Client**: Run `npx prisma generate`
4. **Check Supabase status**: Ensure your Supabase project is active
5. **Verify network access**: Make sure your IP is allowed in Supabase settings

## Status

✅ Prisma schema updated
✅ Environment templates updated
✅ Prisma client configuration updated
✅ Ready for Supabase connection

