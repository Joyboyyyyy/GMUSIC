# Database Abstraction Layer

This backend now supports both **Prisma** (production) and **Supabase JS client** (local development) through a unified database abstraction layer.

## Overview

The abstraction layer allows the backend to switch between database adapters based on environment variables, without changing any service code.

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Database Adapter Selection
USE_PRISMA=false  # Set to 'true' or '1' for Prisma, 'false' for Supabase

# Supabase Configuration (for local development)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Prisma Configuration (for production)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

### Local Development (Supabase)

```env
USE_PRISMA=false
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Production (Prisma)

```env
USE_PRISMA=true
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

## Architecture

### Files Created

1. **`src/lib/db.js`** - Main abstraction layer that selects the appropriate adapter
2. **`src/lib/supabaseAdapter.js`** - Supabase client wrapper that mimics Prisma interface

### Files Updated

All services, middleware, and server files now import from `src/lib/db.js` instead of directly importing Prisma:

- `src/services/auth.service.js`
- `src/services/course.service.js`
- `src/services/payment.service.js`
- `src/services/razorpay.service.js`
- `src/services/zoho.service.js`
- `src/middleware/auth.js`
- `src/server.js`
- `src/app.js`

## Usage

### In Services

```javascript
// Old way (direct Prisma)
import prisma from '../config/prismaClient.js';
const user = await prisma.user.findUnique({ where: { id } });

// New way (abstraction layer)
import db from '../lib/db.js';
const user = await db.user.findUnique({ where: { id } });
```

### Supported Operations

The abstraction layer supports all common Prisma operations:

- `findUnique()` - Find single record by unique field
- `findFirst()` - Find first matching record
- `findMany()` - Find multiple records
- `create()` - Create new record
- `update()` - Update single record
- `updateMany()` - Update multiple records
- `upsert()` - Create or update record
- `delete()` - Delete single record
- `deleteMany()` - Delete multiple records
- `$connect()` - Connect to database
- `$disconnect()` - Disconnect from database

## Limitations

### Supabase Adapter Limitations

1. **`$queryRaw`** - Not supported in Supabase adapter (Supabase JS client doesn't support raw SQL)
2. **`include`** - Limited support. Supabase doesn't support native joins, so related data fetching may require separate queries
3. **Complex queries** - Some advanced Prisma features (like nested filters, complex OR conditions) may not work identically

### Workarounds

- For `$queryRaw`: Use Supabase dashboard SQL editor or Prisma for production
- For `include`: Fetch related data in separate queries if needed
- For complex queries: Simplify or use Prisma in production

## Testing

### Test Local Development (Supabase)

```bash
USE_PRISMA=false npm run dev
```

### Test Production Mode (Prisma)

```bash
USE_PRISMA=true npm run dev
```

## Migration Notes

- **No code changes needed** in services - they all use the abstraction layer
- **Environment variables** must be set correctly for the adapter you want to use
- **Prisma schema** remains unchanged and is still used for production
- **Supabase schema** should match Prisma schema (use the `complete_schema.sql` file)

## Troubleshooting

### Supabase adapter not working

1. Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
2. Verify the service role key has proper permissions
3. Check that tables exist in Supabase (run `complete_schema.sql`)

### Prisma still being used when it shouldn't

1. Check `USE_PRISMA` environment variable is set to `false` or `0`
2. Restart the server after changing environment variables

### Schema mismatches

1. Ensure Supabase schema matches Prisma schema
2. Run `complete_schema.sql` in Supabase dashboard
3. For Prisma, run `npx prisma generate` and `npx prisma migrate deploy`

## Best Practices

1. **Always use the abstraction layer** - Don't import Prisma directly in services
2. **Test both adapters** - Verify your code works with both Supabase and Prisma
3. **Keep schemas in sync** - Ensure Supabase schema matches Prisma schema
4. **Use environment variables** - Never hardcode adapter selection
5. **Handle errors gracefully** - Both adapters may have slightly different error formats

## Future Improvements

- [ ] Add better `include` support with separate queries
- [ ] Add query logging for Supabase adapter
- [ ] Add transaction support (if needed)
- [ ] Add connection pooling configuration
- [ ] Add adapter health checks

