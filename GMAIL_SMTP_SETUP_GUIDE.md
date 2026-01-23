# Gmail SMTP Setup Guide

**Date**: January 21, 2026  
**Status**: Ready to configure

## Why Gmail SMTP?

Gmail SMTP works for **ANY email address** without restrictions. No domain verification needed.

## Setup Steps

### Step 1: Enable 2-Factor Authentication

1. Go to: https://myaccount.google.com/security
2. Click "2-Step Verification"
3. Follow the setup process
4. Verify with your phone

### Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" as the app
3. Select "Other" as the device
4. Enter name: "Gretex Music Room"
5. Click "Generate"
6. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 3: Update Backend Configuration

Edit `backend/.env`:

```env
# Email Service - Using Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=abcdefghijklmnop
EMAIL_FROM=your-gmail@gmail.com
```

**Replace:**
- `your-gmail@gmail.com` with your Gmail address
- `abcdefghijklmnop` with the app password (remove spaces)

### Step 4: Restart Backend

```powershell
cd backend
npm start
```

## Configuration Example

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=pradhanrocky774@gmail.com
SMTP_PASS=abcdefghijklmnop
EMAIL_FROM=pradhanrocky774@gmail.com
```

## Testing

1. Try signup with ANY email address
2. Check backend logs for: `📨 VERIFICATION EMAIL SENT`
3. Check email inbox (should arrive in seconds)
4. Emails will come from your Gmail address

## Benefits

✅ **Works for ANY email** - No restrictions  
✅ **Free** - Gmail's free tier  
✅ **Reliable** - Google's infrastructure  
✅ **Fast** - Emails arrive in 1-3 seconds  
✅ **No domain verification** - Works immediately  
✅ **500 emails/day** - Gmail's sending limit  

## Troubleshooting

### Error: "Invalid login"
- Make sure 2-factor authentication is enabled
- Generate a new app password
- Remove spaces from app password

### Error: "Username and Password not accepted"
- Use app password, NOT your Gmail password
- Check SMTP_USER is your full Gmail address

### Emails Not Arriving
1. Check spam folder
2. Check backend logs for send confirmation
3. Verify app password is correct
4. Try generating a new app password

## Limits

- **500 emails per day** (Gmail's limit)
- Emails come from your Gmail address
- Recipients see your Gmail as sender

## Alternative: Use a Dedicated Email

For production, consider creating a dedicated Gmail account:
- Create: `noreply.gretexmusicroom@gmail.com`
- Use this for all app emails
- More professional than personal Gmail

## Security Notes

- ⚠️ Keep app password private
- ⚠️ Don't commit to Git (already in .gitignore)
- ⚠️ Can revoke anytime from Google account
- ⚠️ App password only works for this app

## Support

- Gmail Help: https://support.google.com/mail
- App Passwords: https://myaccount.google.com/apppasswords
- 2-Factor Auth: https://myaccount.google.com/security

---

**Status**: ✅ Ready to configure  
**Time to setup**: 5 minutes  
**Works for**: ANY email address
