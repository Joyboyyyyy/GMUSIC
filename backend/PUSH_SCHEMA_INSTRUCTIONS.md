# Push Database Schema to Supabase

## Method 1: Using Supabase Dashboard (Recommended - Most Reliable)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the contents of `complete_schema.sql` file
5. Paste it into the SQL editor
6. Click **Run** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

The schema will be applied immediately to your database.

## Method 2: Using Connection Pooler (If IPv6 is not available)

The connection pooler typically has better IPv4 support. Try updating the connection string to use the pooler:

```
postgresql://postgres:Rasmalai9819@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

Note: You'll need to find your pooler URL from the Supabase dashboard:
1. Go to Project Settings → Database
2. Look for "Connection string" → "Connection pooling"
3. Use that URL instead

## Method 3: Using psql (If installed)

If you have PostgreSQL client tools installed:

```bash
psql "postgresql://postgres:Rasmalai9819@db.nucufuumpzqjpvlboski.supabase.co:5432/postgres?sslmode=require" -f complete_schema.sql
```

## Troubleshooting

### DNS Resolution Issues
If you're experiencing DNS resolution issues (like we encountered), it's likely due to:
- IPv6-only hostname resolution
- Windows DNS configuration
- Network firewall restrictions

**Solution**: Use Method 1 (Supabase Dashboard) - it's the most reliable and doesn't require local network configuration.

### Connection Issues
- Verify your Supabase project is active (not paused)
- Check that your IP address is allowed in Supabase network settings
- Ensure the password is correct
- Verify SSL is enabled (required for Supabase)

## Schema File Location

The complete schema SQL file is located at:
`Gretex music Room/backend/complete_schema.sql`

This file contains:
- User table with all fields (including resetToken, verificationToken, etc.)
- Course table
- Enrollment table
- All indexes and foreign key constraints
- Safe column additions (won't fail if columns already exist)

