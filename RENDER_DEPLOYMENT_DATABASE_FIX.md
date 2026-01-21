# Render Deployment - Database Connection Fix

## Error
```
FATAL: Tenant or user not found
Error querying the database: FATAL: Tenant or user not found
```

## Root Cause
This is a **Supabase-specific error** that occurs when:
1. DATABASE_URL has incorrect credentials
2. Database user doesn't exist in Supabase
3. Connection pooling URL is used instead of direct connection URL
4. Database password contains special characters that aren't URL-encoded

## Solution Steps

### Step 1: Get Correct DATABASE_URL from Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Scroll to **Connection String** section
4. Copy the **Connection Pooling** URL (for production) or **Direct Connection** URL

**Important**: Use the correct URL format:
- **Transaction Mode** (recommended for Prisma): `postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Session Mode**: `postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres`

### Step 2: URL-Encode Special Characters in Password

If your password contains special characters, you MUST URL-encode them:

| Character | URL-Encoded |
|-----------|-------------|
| `@` | `%40` |
| `#` | `%23` |
| `$` | `%24` |
| `%` | `%25` |
| `&` | `%26` |
| `+` | `%2B` |
| `/` | `%2F` |
| `:` | `%3A` |
| `=` | `%3D` |
| `?` | `%3F` |

**Example**:
```
Original password: MyP@ss#123
Encoded password: MyP%40ss%23123

DATABASE_URL=postgresql://postgres.xxx:MyP%40ss%23123@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Step 3: Update Environment Variables on Render

1. Go to your Render dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Update `DATABASE_URL` with the correct value
5. Click **Save Changes**
6. Render will automatically redeploy

### Step 4: Add Connection Pooling Parameters

For Prisma with Supabase, add these parameters to your DATABASE_URL:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?pgbouncer=true&connection_limit=1
```

**Parameters**:
- `pgbouncer=true` - Required for Supabase connection pooling
- `connection_limit=1` - Limits connections per Prisma Client instance

### Step 5: Update Prisma Schema (if needed)

Ensure your `prisma/schema.prisma` has the correct configuration:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Optional: for migrations
}
```

If you need to run migrations on Render, add `DIRECT_URL`:
```
DIRECT_URL=postgresql://postgres.xxx:[PASSWORD]@db.xxx.supabase.co:5432/postgres
```

---

## Common Issues and Solutions

### Issue 1: "Tenant or user not found"
**Cause**: Wrong credentials or user doesn't exist
**Solution**: 
- Verify credentials in Supabase dashboard
- Ensure you're using the correct project
- Check if database user is active

### Issue 2: Password with Special Characters
**Cause**: Special characters not URL-encoded
**Solution**: URL-encode all special characters in password

### Issue 3: Wrong Port Number
**Cause**: Using wrong port (5432 vs 6543)
**Solution**: 
- Use port **6543** for connection pooling (recommended)
- Use port **5432** for direct connection

### Issue 4: Missing `pgbouncer=true`
**Cause**: Connection pooling parameter missing
**Solution**: Add `?pgbouncer=true` to DATABASE_URL

### Issue 5: Too Many Connections
**Cause**: Prisma opening too many connections
**Solution**: Add `connection_limit=1` parameter

---

## Verification Steps

### 1. Test Connection Locally

Create a test script `test-db-connection.js`:

```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    const result = await prisma.$queryRaw`SELECT current_database(), current_user`;
    console.log('Database info:', result);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
```

Run: `node test-db-connection.js`

### 2. Check Render Logs

```bash
# View real-time logs
render logs --tail

# Check for database errors
render logs | grep "database"
render logs | grep "FATAL"
```

### 3. Verify Environment Variables

On Render dashboard:
1. Go to Environment tab
2. Verify `DATABASE_URL` is set correctly
3. Check for any typos or missing characters
4. Ensure no extra spaces or newlines

---

## Complete DATABASE_URL Format

```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?[PARAMETERS]
```

**Example for Supabase**:
```
DATABASE_URL=postgresql://postgres.abcdefghijklmnop:MyP%40ssw0rd@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Breakdown**:
- `postgres.abcdefghijklmnop` - Supabase project reference
- `MyP%40ssw0rd` - URL-encoded password
- `aws-0-us-west-1.pooler.supabase.com` - Supabase pooler host
- `6543` - Connection pooling port
- `postgres` - Database name
- `pgbouncer=true` - Enable connection pooling
- `connection_limit=1` - Limit connections

---

## Render-Specific Configuration

### Build Command
```bash
npm install && npx prisma generate
```

### Start Command
```bash
npm start
```

### Environment Variables (Required)
```
DATABASE_URL=postgresql://...
NODE_ENV=production
PORT=10000
```

### Environment Variables (Optional)
```
DIRECT_URL=postgresql://...  # For migrations
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
JWT_SECRET=...
EMAIL_FROM=...
```

---

## Migration on Render

If you need to run migrations during deployment:

### Option 1: Add to Build Command
```bash
npm install && npx prisma generate && npx prisma migrate deploy
```

### Option 2: Use DIRECT_URL
Set both environment variables:
```
DATABASE_URL=postgresql://...pooler.supabase.com:6543/...?pgbouncer=true
DIRECT_URL=postgresql://...supabase.co:5432/...
```

Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

---

## Quick Fix Checklist

- [ ] Copy DATABASE_URL from Supabase dashboard
- [ ] URL-encode special characters in password
- [ ] Use port 6543 for connection pooling
- [ ] Add `?pgbouncer=true` parameter
- [ ] Add `&connection_limit=1` parameter
- [ ] Update environment variable on Render
- [ ] Save and wait for automatic redeploy
- [ ] Check Render logs for success
- [ ] Test API endpoints

---

## Still Not Working?

### 1. Reset Database Password
1. Go to Supabase → Settings → Database
2. Click "Reset database password"
3. Copy new password
4. URL-encode it
5. Update DATABASE_URL on Render

### 2. Check Supabase Status
Visit: https://status.supabase.com/

### 3. Verify Network Access
Supabase allows all IPs by default, but check:
- Supabase → Settings → Database → Connection Pooling
- Ensure "Restrict to trusted IPs" is disabled or Render IPs are whitelisted

### 4. Contact Support
- Render Support: https://render.com/docs/support
- Supabase Support: https://supabase.com/support

---

## Prevention

### Use Environment Variable Validation

Add to `server.js`:

```javascript
function validateEnvironment() {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    process.exit(1);
  }
  
  // Validate DATABASE_URL format
  if (!process.env.DATABASE_URL.startsWith('postgresql://')) {
    console.error('❌ Invalid DATABASE_URL format');
    process.exit(1);
  }
  
  console.log('✅ Environment variables validated');
}

validateEnvironment();
```

---

## Status
⚠️ **Deployment Issue** - Requires DATABASE_URL configuration fix on Render
