# Render Deployment - Complete Environment Variables Guide

## Required Environment Variables

### 1. Database Configuration (CRITICAL)

#### DATABASE_URL
**Required**: Yes  
**Description**: PostgreSQL connection string for Supabase  
**Format**: 
```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?pgbouncer=true&connection_limit=1
```

**How to Get**:
1. Go to Supabase Dashboard → Settings → Database
2. Copy "Connection Pooling" URL (Transaction mode)
3. Replace `[YOUR-PASSWORD]` with your actual password
4. URL-encode special characters in password

**Example**:
```
DATABASE_URL=postgresql://postgres.abcdefghijklmnop:MyP%40ssw0rd@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Special Character Encoding**:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `/` → `%2F`
- `:` → `%3A`
- `=` → `%3D`
- `?` → `%3F`

---

#### DIRECT_URL (Optional but Recommended)
**Required**: No (but needed for migrations)  
**Description**: Direct database connection for running migrations  
**Format**:
```
postgresql://[USER]:[PASSWORD]@[HOST]:5432/[DATABASE]
```

**How to Get**:
1. Go to Supabase Dashboard → Settings → Database
2. Copy "Direct Connection" URL
3. Replace `[YOUR-PASSWORD]` with your actual password
4. URL-encode special characters

**Example**:
```
DIRECT_URL=postgresql://postgres.abcdefghijklmnop:MyP%40ssw0rd@db.abcdefghijklmnop.supabase.co:5432/postgres
```

---

### 2. Application Configuration

#### NODE_ENV
**Required**: Yes  
**Description**: Application environment  
**Value**: `production`

```
NODE_ENV=production
```

---

#### PORT
**Required**: Yes (Render provides this automatically)  
**Description**: Port number for the server  
**Value**: `10000` (Render default)

```
PORT=10000
```

---

#### JWT_SECRET
**Required**: Yes  
**Description**: Secret key for JWT token generation  
**How to Generate**: Use a strong random string (32+ characters)

**Generate with Node.js**:
```javascript
require('crypto').randomBytes(64).toString('hex')
```

**Example**:
```
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

---

### 3. Payment Gateway (Razorpay)

#### RAZORPAY_KEY_ID
**Required**: Yes (for payments)  
**Description**: Razorpay API Key ID  
**How to Get**:
1. Go to Razorpay Dashboard → Settings → API Keys
2. Copy "Key Id"

**Example**:
```
RAZORPAY_KEY_ID=rzp_live_abcdefghijklmn
```

---

#### RAZORPAY_KEY_SECRET
**Required**: Yes (for payments)  
**Description**: Razorpay API Key Secret  
**How to Get**:
1. Go to Razorpay Dashboard → Settings → API Keys
2. Copy "Key Secret"

**Example**:
```
RAZORPAY_KEY_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

---

#### RAZORPAY_WEBHOOK_SECRET
**Required**: No (but recommended for webhooks)  
**Description**: Razorpay webhook secret for signature verification  
**How to Get**:
1. Go to Razorpay Dashboard → Settings → Webhooks
2. Create webhook with your Render URL
3. Copy "Secret"

**Example**:
```
RAZORPAY_WEBHOOK_SECRET=whsec_abcdefghijklmnopqrstuvwxyz
```

---

### 4. Email Configuration (Resend)

#### RESEND_API_KEY
**Required**: Yes (for emails)  
**Description**: Resend API key for sending emails  
**How to Get**:
1. Go to Resend Dashboard → API Keys
2. Create new API key
3. Copy the key

**Example**:
```
RESEND_API_KEY=re_abcdefghijklmnopqrstuvwxyz123456
```

---

#### EMAIL_FROM
**Required**: Yes (for emails)  
**Description**: Sender email address  
**Format**: `Name <email@domain.com>`

**Example**:
```
EMAIL_FROM=Gretex Music Room <noreply@gretexmusicroom.com>
```

---

### 5. Application-Specific Configuration

#### JAMMING_ROOM_PRICE_PER_HOUR
**Required**: Yes (for jamming room bookings)  
**Description**: Price per hour for jamming room bookings (in INR)  
**Value**: Numeric value (e.g., 500)

**Example**:
```
JAMMING_ROOM_PRICE_PER_HOUR=500
```

---

#### FRONTEND_URL
**Required**: No (but recommended)  
**Description**: Frontend application URL for CORS and redirects  

**Example**:
```
FRONTEND_URL=https://gretexmusicroom.com
```

---

#### BACKEND_URL
**Required**: No (but recommended)  
**Description**: Backend API URL for email links and webhooks  

**Example**:
```
BACKEND_URL=https://api.gretexmusicroom.com
```

---

## Complete Environment Variables Template

Copy this template to Render → Environment tab:

```bash
# Database (CRITICAL - Get from Supabase)
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.YOUR_PROJECT_REF:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres

# Application
NODE_ENV=production
PORT=10000
JWT_SECRET=YOUR_RANDOM_64_CHAR_STRING

# Razorpay (Get from Razorpay Dashboard)
RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Email (Get from Resend Dashboard)
RESEND_API_KEY=re_YOUR_API_KEY
EMAIL_FROM=Gretex Music Room <noreply@yourdomain.com>

# Application Config
JAMMING_ROOM_PRICE_PER_HOUR=500
FRONTEND_URL=https://yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

---

## Render Service Configuration

### Build Command
```bash
npm install && npx prisma generate && npx prisma migrate deploy
```

**Explanation**:
- `npm install` - Install dependencies
- `npx prisma generate` - Generate Prisma Client
- `npx prisma migrate deploy` - Run database migrations

---

### Start Command
```bash
npm start
```

**Explanation**: Runs `node src/server.js` as defined in package.json

---

### Health Check Path
```
/api/health
```

**Note**: Ensure your server has a health check endpoint

---

## Step-by-Step Setup on Render

### 1. Create New Web Service
1. Go to Render Dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository

### 2. Configure Service
- **Name**: `gretex-music-room-backend`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your production branch)
- **Root Directory**: `backend` (if backend is in subdirectory)
- **Runtime**: `Node`
- **Build Command**: See above
- **Start Command**: See above

### 3. Add Environment Variables
1. Go to "Environment" tab
2. Click "Add Environment Variable"
3. Add each variable from the template above
4. Click "Save Changes"

### 4. Deploy
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Check logs for any errors

---

## Verification Checklist

After deployment, verify:

- [ ] Service is running (check Render dashboard)
- [ ] Database connection successful (check logs)
- [ ] Health check endpoint responding
- [ ] API endpoints accessible
- [ ] Authentication working
- [ ] Payment gateway configured
- [ ] Email sending working
- [ ] No environment variable warnings in logs

---

## Testing Environment Variables

### Test Database Connection
```bash
curl https://your-app.onrender.com/api/health
```

### Test Authentication
```bash
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Check Logs
```bash
# In Render Dashboard
Go to Logs tab → View real-time logs
```

---

## Common Issues and Solutions

### Issue: "Tenant or user not found"
**Solution**: 
- Verify DATABASE_URL is correct
- Check password is URL-encoded
- Ensure using connection pooling URL (port 6543)
- Add `?pgbouncer=true&connection_limit=1`

### Issue: "JWT_SECRET is not defined"
**Solution**: Add JWT_SECRET environment variable

### Issue: "Razorpay is not configured"
**Solution**: Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET

### Issue: "Email sending failed"
**Solution**: 
- Add RESEND_API_KEY
- Add EMAIL_FROM
- Verify email domain in Resend

### Issue: "JAMMING_ROOM_PRICE_PER_HOUR is not configured"
**Solution**: Add JAMMING_ROOM_PRICE_PER_HOUR=500

---

## Security Best Practices

1. **Never commit .env files** to Git
2. **Use strong JWT_SECRET** (64+ characters)
3. **Rotate secrets regularly** (every 90 days)
4. **Use different keys** for development and production
5. **Enable Render's secret encryption**
6. **Limit database access** to Render IPs if possible
7. **Use HTTPS only** for all endpoints
8. **Enable Razorpay webhook signature verification**

---

## Environment Variables Priority

**Critical (Must Have)**:
1. DATABASE_URL
2. NODE_ENV
3. PORT
4. JWT_SECRET

**Important (For Core Features)**:
5. RAZORPAY_KEY_ID
6. RAZORPAY_KEY_SECRET
7. RESEND_API_KEY
8. EMAIL_FROM
9. JAMMING_ROOM_PRICE_PER_HOUR

**Optional (For Enhanced Features)**:
10. DIRECT_URL
11. RAZORPAY_WEBHOOK_SECRET
12. FRONTEND_URL
13. BACKEND_URL

---

## Quick Setup Script

Save this as `setup-render-env.sh`:

```bash
#!/bin/bash

echo "Render Environment Variables Setup"
echo "=================================="
echo ""
echo "Please provide the following values:"
echo ""

read -p "Supabase Project Ref (e.g., abcdefghijklmnop): " SUPABASE_REF
read -sp "Supabase Password: " SUPABASE_PASS
echo ""
read -p "Razorpay Key ID: " RAZORPAY_ID
read -sp "Razorpay Key Secret: " RAZORPAY_SECRET
echo ""
read -p "Resend API Key: " RESEND_KEY
read -p "Email From (e.g., noreply@domain.com): " EMAIL

# URL encode password (basic)
ENCODED_PASS=$(echo -n "$SUPABASE_PASS" | jq -sRr @uri)

echo ""
echo "Copy these to Render Environment Variables:"
echo "==========================================="
echo ""
echo "DATABASE_URL=postgresql://postgres.$SUPABASE_REF:$ENCODED_PASS@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
echo "NODE_ENV=production"
echo "PORT=10000"
echo "JWT_SECRET=$(openssl rand -hex 64)"
echo "RAZORPAY_KEY_ID=$RAZORPAY_ID"
echo "RAZORPAY_KEY_SECRET=$RAZORPAY_SECRET"
echo "RESEND_API_KEY=$RESEND_KEY"
echo "EMAIL_FROM=Gretex Music Room <$EMAIL>"
echo "JAMMING_ROOM_PRICE_PER_HOUR=500"
```

---

## Support

If you encounter issues:
1. Check Render logs for specific errors
2. Verify all environment variables are set correctly
3. Test database connection separately
4. Review the RENDER_DEPLOYMENT_DATABASE_FIX.md guide
5. Contact Render support: https://render.com/docs/support

---

## Status
✅ Complete environment variables list provided  
✅ Step-by-step setup instructions included  
✅ Verification checklist provided  
✅ Troubleshooting guide included
