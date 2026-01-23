# Email Not Sending Fix - SMTP Configuration on Render

## The Problem

When users signup, they see "Signup Failed" but actually:
- ✅ User account IS created successfully
- ✅ Verification token IS generated
- ❌ Verification email FAILS to send (SMTP timeout)
- ❌ User never receives email to verify account

**Error in logs**:
```
[Email] SMTP verification failed: Connection timeout
```

## Root Cause

SMTP environment variables are configured in `backend/.env` (local development) but **NOT configured on Render** (production).

Render doesn't have access to your `.env` file - you need to add environment variables manually in Render dashboard.

## The Fix: Add SMTP Variables to Render

### Step 1: Go to Render Dashboard

1. Open: https://dashboard.render.com/
2. Find your service: "gmusic" or "gretex-music-room-backend"
3. Click on it

### Step 2: Go to Environment Variables

1. Click "Environment" tab in the left sidebar
2. You'll see existing variables like `DATABASE_URL`, `JWT_SECRET`, etc.

### Step 3: Add SMTP Variables

Click "Add Environment Variable" and add these **one by one**:

```
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@gretexindustries.com
SMTP_PASS=Gretex@2025
EMAIL_FROM=info@gretexindustries.com
```

**Important**: 
- Add each variable separately
- Click "Save Changes" after adding all variables
- Render will automatically redeploy your service

### Step 4: Wait for Redeploy

- Render will restart your service (takes 2-3 minutes)
- Watch the logs to see when it's ready
- Look for: "✅ SMTP connection verified"

## Verification

After Render redeploys, test signup:

1. Try to signup with a new email
2. Check backend logs on Render
3. Should see: "📨 VERIFICATION EMAIL SENT"
4. Check your email inbox
5. Should receive verification email!

## Current Workaround (Until SMTP is Fixed)

Since emails aren't sending, users can't verify their accounts. Here's what happens:

### Option 1: Manual Verification (Database)

You can manually verify users in the database:

```sql
UPDATE "User" 
SET "isEmailVerified" = true 
WHERE email = 'user@example.com';
```

### Option 2: Skip Email Verification (Temporary)

You could temporarily disable email verification requirement in the auth service, but this is **NOT recommended** for production.

### Option 3: Use Different Email Service

Instead of Hostinger SMTP, you could use:

**Resend** (Recommended - Free tier):
```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
EMAIL_FROM=onboarding@resend.dev
```

**Gmail** (For testing only):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your.email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=your.email@gmail.com
```

**SendGrid**:
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
EMAIL_FROM=noreply@yourdomain.com
```

## Why This Happened

1. **Local Development**: SMTP works because `.env` file has credentials
2. **Render Production**: `.env` file is NOT uploaded to Render
3. **Missing Config**: Render doesn't know SMTP credentials
4. **Email Fails**: SMTP connection times out

## Testing After Fix

### Test 1: Check SMTP Connection

Visit: https://gmusic-ivdh.onrender.com/health

Should show:
```json
{
  "success": true,
  "message": "Gretex API running",
  "database": "connected",
  "smtp": "connected"  ← Should say "connected"
}
```

### Test 2: Try Signup

1. Create new account in app
2. Should complete successfully
3. Check email inbox
4. Should receive verification email
5. Click link to verify

### Test 3: Check Logs

In Render dashboard, check logs:
```
✅ SMTP connection verified
📨 VERIFICATION EMAIL SENT
```

## Important Notes

### Security

- Never commit SMTP credentials to Git
- Keep them in Render environment variables only
- Use app-specific passwords (not main email password)

### Email Deliverability

If emails still don't arrive after fixing SMTP:

1. **Check Spam Folder**: Verification emails might be in spam
2. **Verify Domain**: Add SPF/DKIM records for better deliverability
3. **Use Transactional Email Service**: Resend, SendGrid, or Mailgun are more reliable than SMTP

### Hostinger SMTP Limits

- Free tier: Limited emails per day
- May have rate limits
- Consider upgrading or using dedicated email service

## Alternative: Use Resend (Recommended)

Resend is a modern email API that's more reliable than SMTP:

### Step 1: Sign up for Resend

1. Go to: https://resend.com/
2. Sign up (free tier: 3,000 emails/month)
3. Get API key

### Step 2: Update Environment Variables

On Render, change SMTP variables to:

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
EMAIL_FROM=onboarding@resend.dev
```

### Step 3: Verify Domain (Optional)

For production, verify your domain in Resend to send from your own email address.

## Summary

**Problem**: SMTP credentials not configured on Render  
**Solution**: Add SMTP environment variables in Render dashboard  
**Alternative**: Use Resend instead of Hostinger SMTP  
**Workaround**: Manually verify users in database until fixed  

---

**Next Steps**:
1. Add SMTP variables to Render
2. Wait for redeploy (2-3 minutes)
3. Test signup - should receive email
4. Consider switching to Resend for better reliability
