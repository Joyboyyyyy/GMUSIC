# Resend Email Service Setup Guide

## Problem Solved
Hostinger SMTP was timing out on Render due to IP blocking. Resend provides reliable transactional email delivery with better infrastructure.

## Step-by-Step Setup

### 1. Create Resend Account

1. Go to https://resend.com
2. Click "Sign Up" or "Get Started"
3. Create account with your email
4. Verify your email address

### 2. Generate API Key

1. Log in to Resend dashboard
2. Navigate to "API Keys" section (left sidebar)
3. Click "Create API Key"
4. Give it a name (e.g., "Gretex Music Room Production")
5. Select permissions: "Sending access"
6. Click "Create"
7. **IMPORTANT**: Copy the API key immediately (starts with `re_`)
   - You won't be able to see it again
   - Store it securely

### 3. Update Render Environment Variables

1. Go to https://dashboard.render.com
2. Find your backend service: "gmusic-ivdh" or "gretex-music-room-backend"
3. Click on the service
4. Go to "Environment" tab in left sidebar
5. Update/Add these variables:

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_your_api_key_here
EMAIL_FROM=onboarding@resend.dev
```

**Important Notes:**
- `SMTP_USER` must be exactly `resend` (lowercase)
- `SMTP_PASS` is your Resend API key (starts with `re_`)
- `EMAIL_FROM` can be `onboarding@resend.dev` for testing
- For production, verify your own domain (see below)

6. Click "Save Changes"
7. Render will automatically redeploy (takes 2-3 minutes)

### 4. Verify Deployment

1. Wait for Render to finish redeploying
2. Check logs in Render dashboard
3. Look for: `[Email] ✅ SMTP connection verified`
4. If you see connection errors, double-check the environment variables

### 5. Test Email Delivery

#### Test Signup Email
1. Open your app
2. Try to sign up with a new email address
3. Check Render logs for: `📨 VERIFICATION EMAIL SENT`
4. Check your email inbox
5. You should receive the verification email within seconds

#### Test Password Reset Email
1. Go to forgot password screen
2. Enter your email
3. Check Render logs for: `[Email] ✅ Email sent`
4. Check your email inbox
5. You should receive the password reset email

### 6. Monitor in Resend Dashboard

1. Go back to Resend dashboard
2. Navigate to "Emails" section
3. You'll see all sent emails with:
   - Delivery status
   - Timestamps
   - Recipient
   - Subject
   - Opens/clicks (if tracking enabled)

## Free Tier Limits

Resend free tier includes:
- **3,000 emails per month**
- **100 emails per day**
- Unlimited domains
- Email tracking
- Webhooks

This is more than enough for most applications. If you need more, upgrade to paid plan.

## Production Setup (Optional)

For production, you should verify your own domain to send from your own email address (e.g., `noreply@gretexindustries.com`).

### Verify Custom Domain

1. In Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter your domain: `gretexindustries.com`
4. Resend will provide DNS records to add:
   - SPF record
   - DKIM record
   - DMARC record (optional)
5. Add these records to your domain's DNS settings (in Hostinger or wherever your domain is hosted)
6. Wait for DNS propagation (can take up to 48 hours, usually faster)
7. Resend will verify the records automatically
8. Once verified, update `EMAIL_FROM` on Render:
   ```
   EMAIL_FROM=noreply@gretexindustries.com
   ```

## Troubleshooting

### Emails Not Arriving

1. **Check Spam Folder**: Verification emails might be in spam
2. **Check Resend Dashboard**: See if email was sent successfully
3. **Check Render Logs**: Look for error messages
4. **Verify Environment Variables**: Make sure all variables are correct

### Authentication Failed

- Double-check `SMTP_PASS` is your Resend API key
- Make sure `SMTP_USER` is exactly `resend` (lowercase)
- Regenerate API key if needed

### Connection Timeout

- This shouldn't happen with Resend (that's why we switched!)
- If it does, check if Render is having issues
- Try port 587 instead of 465:
  ```
  SMTP_PORT=587
  ```
  And update email.js to use `secure: false` for port 587

## Comparison: Hostinger vs Resend

| Feature | Hostinger SMTP | Resend |
|---------|---------------|--------|
| Reliability | ❌ IP blocking issues | ✅ Reliable infrastructure |
| Setup | Complex | Simple |
| Deliverability | Medium | High |
| Monitoring | None | Dashboard with analytics |
| Free Tier | Limited | 3,000 emails/month |
| Support | Email only | Email + docs |

## Code Changes Made

### 1. Added Timeout Configuration
File: `backend/src/utils/email.js`

```javascript
transporter = nodemailer.createTransport({
  host: smtpHost || 'localhost',
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,   // 10 seconds
  socketTimeout: 30000,     // 30 seconds
});
```

### 2. No Other Code Changes Needed!
The beauty of Resend is that it works with standard SMTP, so we just change environment variables.

## Next Steps

1. ✅ Sign up for Resend
2. ✅ Get API key
3. ✅ Update Render environment variables
4. ✅ Wait for redeploy
5. ✅ Test email delivery
6. ⏳ (Optional) Verify custom domain for production

## Support

- Resend Documentation: https://resend.com/docs
- Resend Support: support@resend.com
- Render Support: https://render.com/docs

---

**Status**: Ready to implement
**Estimated Time**: 15 minutes
**Difficulty**: Easy
