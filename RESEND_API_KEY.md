# Resend API Key - Gretex Music Room

## API Key
```
re_NJYjYq4i_5Ls3FF6JRVYv4NDWAnyYy6UV
```

## Where to Use This

### On Render (Production)
1. Go to: https://dashboard.render.com
2. Select service: **gmusic-ivdh**
3. Click **Environment** tab
4. Update these variables:

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_NJYjYq4i_5Ls3FF6JRVYv4NDWAnyYy6UV
EMAIL_FROM=onboarding@resend.dev
```

5. Click **Save Changes**
6. Wait for redeploy (2-3 minutes)

### For Local Development (Optional)
Update `backend/.env`:

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_NJYjYq4i_5Ls3FF6JRVYv4NDWAnyYy6UV
EMAIL_FROM=onboarding@resend.dev
```

## Account Details
- **Service**: Resend (https://resend.com)
- **Free Tier**: 3,000 emails/month, 100 emails/day
- **Dashboard**: https://resend.com/emails

## What This Fixes
- ✅ Verification emails now send successfully
- ✅ Password reset emails work
- ✅ Invoice emails deliver
- ✅ No more "Connection timeout" errors
- ✅ Emails arrive within seconds

## Testing After Setup
1. Try signup with new email
2. Check Render logs for: `📨 VERIFICATION EMAIL SENT`
3. Check email inbox (should arrive in seconds)
4. Check Resend dashboard for delivery confirmation

## Security Notes
- ⚠️ Keep this API key private
- ⚠️ Don't commit to Git (already in .gitignore)
- ⚠️ Only use in environment variables
- ⚠️ Can regenerate anytime from Resend dashboard

## Support
- Resend Docs: https://resend.com/docs
- Resend Dashboard: https://resend.com/emails
- Support: support@resend.com

---

**Status**: Ready to use
**Created**: January 21, 2026
**Purpose**: Replace Hostinger SMTP (which was timing out on Render)
