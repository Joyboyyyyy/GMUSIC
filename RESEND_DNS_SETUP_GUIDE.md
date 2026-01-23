# Resend Domain Verification - DNS Setup Guide

**Domain**: `gretexindustries.com`  
**Goal**: Send emails to ANY address (not just pradhanrocky774@gmail.com)  
**Time**: 10-15 minutes setup + 5-60 minutes DNS propagation

---

## Step 1: Add Domain to Resend

1. **Login to Resend**
   - Go to: https://resend.com/login
   - Login with your account

2. **Navigate to Domains**
   - Click "Domains" in the left sidebar
   - Or go directly to: https://resend.com/domains

3. **Add Your Domain**
   - Click the "Add Domain" button
   - Enter: `gretexindustries.com`
   - Click "Add Domain"

4. **Copy DNS Records**
   - Resend will show you 3 DNS records to add
   - Keep this page open - you'll need these values

---

## Step 2: Get Your DNS Records from Resend

After adding the domain, Resend will show you records like this:

### Record 1: Domain Verification (TXT)
```
Type: TXT
Name: @ (or leave blank, or use gretexindustries.com)
Value: resend-verification=abc123xyz456... (unique to your domain)
TTL: 3600 (or Auto)
```

### Record 2: DKIM Authentication (TXT)
```
Type: TXT
Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC... (long string)
TTL: 3600 (or Auto)
```

### Record 3: Bounce Feedback (MX) - OPTIONAL
```
Type: MX
Name: @ (or leave blank)
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10
TTL: 3600 (or Auto)
```

**IMPORTANT**: Copy these exact values from YOUR Resend dashboard - don't use the examples above!

---

## Step 3: Add DNS Records to Your Domain Registrar

You need to add these records where you manage your domain's DNS. Common registrars:

### Option A: GoDaddy

1. Go to: https://dnsmanagement.godaddy.com
2. Find `gretexindustries.com` in your domain list
3. Click "DNS" or "Manage DNS"
4. Click "Add" for each record:

**For TXT Record 1 (Verification):**
- Type: TXT
- Name: @ (or leave blank)
- Value: [paste from Resend]
- TTL: 1 Hour (or 3600)

**For TXT Record 2 (DKIM):**
- Type: TXT
- Name: resend._domainkey
- Value: [paste from Resend]
- TTL: 1 Hour

**For MX Record (Optional):**
- Type: MX
- Name: @ (or leave blank)
- Value: feedback-smtp.us-east-1.amazonses.com
- Priority: 10
- TTL: 1 Hour

5. Click "Save" for each record

### Option B: Namecheap

1. Go to: https://ap.www.namecheap.com
2. Find `gretexindustries.com`
3. Click "Manage" → "Advanced DNS"
4. Click "Add New Record" for each:

**For TXT Record 1:**
- Type: TXT Record
- Host: @ (or leave blank)
- Value: [paste from Resend]
- TTL: Automatic

**For TXT Record 2:**
- Type: TXT Record
- Host: resend._domainkey
- Value: [paste from Resend]
- TTL: Automatic

**For MX Record:**
- Type: MX Record
- Host: @
- Value: feedback-smtp.us-east-1.amazonses.com
- Priority: 10
- TTL: Automatic

5. Click the green checkmark to save each record

### Option C: Cloudflare

1. Go to: https://dash.cloudflare.com
2. Select `gretexindustries.com`
3. Click "DNS" → "Records"
4. Click "Add record" for each:

**For TXT Record 1:**
- Type: TXT
- Name: @ (or gretexindustries.com)
- Content: [paste from Resend]
- TTL: Auto
- Proxy status: DNS only (gray cloud)

**For TXT Record 2:**
- Type: TXT
- Name: resend._domainkey
- Content: [paste from Resend]
- TTL: Auto
- Proxy status: DNS only

**For MX Record:**
- Type: MX
- Name: @
- Mail server: feedback-smtp.us-east-1.amazonses.com
- Priority: 10
- TTL: Auto

5. Click "Save" for each record

### Option D: Other Registrars

If you use a different registrar:
1. Login to your domain registrar's control panel
2. Find DNS management or DNS settings
3. Add the 3 records (2 TXT + 1 MX) with the exact values from Resend
4. Save changes

---

## Step 4: Verify DNS Records

### Check if Records are Added Correctly

Use this online tool to verify your DNS records:
- Go to: https://dnschecker.org

**Check TXT Record 1:**
- Enter: `gretexindustries.com`
- Select: TXT
- Click "Search"
- Look for: `resend-verification=...`

**Check TXT Record 2:**
- Enter: `resend._domainkey.gretexindustries.com`
- Select: TXT
- Click "Search"
- Look for: `p=MIGfMA0GCSqGSIb...`

**Check MX Record:**
- Enter: `gretexindustries.com`
- Select: MX
- Click "Search"
- Look for: `feedback-smtp.us-east-1.amazonses.com`

### Wait for DNS Propagation

- **Minimum**: 5-10 minutes
- **Average**: 30 minutes
- **Maximum**: 24-48 hours (rare)

DNS changes take time to propagate globally. Be patient!

---

## Step 5: Verify Domain on Resend

1. **Go back to Resend Dashboard**
   - https://resend.com/domains

2. **Check Verification Status**
   - You should see `gretexindustries.com` in your domain list
   - Status will show:
     - ⏳ "Pending" - DNS records not detected yet
     - ✅ "Verified" - Domain is ready!
     - ❌ "Failed" - DNS records incorrect

3. **Click "Verify" Button**
   - If status is still "Pending" after 10 minutes
   - Click the "Verify" or "Check DNS" button
   - Resend will re-check your DNS records

4. **Wait for Green Checkmark**
   - Once verified, you'll see ✅ next to your domain
   - This means you can now send to ANY email address!

---

## Step 6: Update Backend Configuration

Once your domain shows "Verified" on Resend:

### Update `backend/.env`

Change this line:
```env
EMAIL_FROM=onboarding@resend.dev
```

To this:
```env
EMAIL_FROM=noreply@gretexindustries.com
```

### Restart Your Backend

**Local Development:**
```powershell
cd backend
npm start
```

**Production (Render):**
1. Go to: https://dashboard.render.com
2. Select your backend service: `gmusic-ivdh`
3. Go to "Environment" tab
4. Update `EMAIL_FROM=noreply@gretexindustries.com`
5. Click "Save Changes"
6. Service will auto-restart

---

## Step 7: Test Email Delivery

### Test with ANY Email Address

1. **Try Signup with Different Email**
   - Use any email address (not just pradhanrocky774@gmail.com)
   - Example: test@gmail.com, user@yahoo.com, etc.

2. **Check Backend Logs**
   - Look for: `📨 VERIFICATION EMAIL SENT to [email]`
   - Should NOT see: "You can only send testing emails to..."

3. **Check Email Inbox**
   - Email should arrive in 1-3 seconds
   - Sender should show: `noreply@gretexindustries.com`

4. **Check Resend Dashboard**
   - Go to: https://resend.com/emails
   - You should see all sent emails
   - Status should be "Delivered"

---

## Troubleshooting

### Domain Not Verifying

**Problem**: Domain shows "Pending" or "Failed" after 30 minutes

**Solutions**:
1. Double-check DNS records match EXACTLY what Resend shows
2. Make sure you didn't add extra spaces or characters
3. Wait longer (DNS can take up to 24 hours)
4. Use https://dnschecker.org to verify records are live
5. Contact your domain registrar support if records aren't showing

### Emails Still Not Sending

**Problem**: Still getting "testing emails" error after verification

**Solutions**:
1. Make sure domain shows "Verified" on Resend dashboard
2. Update `EMAIL_FROM` to use your verified domain
3. Restart backend server
4. Clear any cached SMTP connections
5. Check Resend dashboard for error messages

### Emails Going to Spam

**Problem**: Emails arrive but go to spam folder

**Solutions**:
1. Make sure all 3 DNS records are added (especially DKIM)
2. Wait 24-48 hours for DNS to fully propagate
3. Send a few test emails to "warm up" your domain
4. Ask recipients to mark as "Not Spam"
5. Consider adding SPF record (Resend will show this if needed)

### Wrong Sender Address

**Problem**: Emails show wrong sender address

**Solutions**:
1. Update `EMAIL_FROM` in `backend/.env`
2. Restart backend server
3. Make sure you're using the verified domain
4. Check Resend dashboard for allowed sender addresses

---

## Quick Reference

### Current Configuration (Testing Mode)
```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_NJYjYq4i_5Ls3FF6JRVYv4NDWAnyYy6UV
EMAIL_FROM=onboarding@resend.dev  ← Can only send to pradhanrocky774@gmail.com
```

### After Domain Verification (Production Mode)
```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_NJYjYq4i_5Ls3FF6JRVYv4NDWAnyYy6UV
EMAIL_FROM=noreply@gretexindustries.com  ← Can send to ANY email!
```

---

## Checklist

Use this checklist to track your progress:

- [ ] Login to Resend dashboard
- [ ] Add domain `gretexindustries.com` to Resend
- [ ] Copy all 3 DNS records from Resend
- [ ] Login to domain registrar (GoDaddy/Namecheap/etc)
- [ ] Add TXT record 1 (verification)
- [ ] Add TXT record 2 (DKIM)
- [ ] Add MX record (optional but recommended)
- [ ] Save all DNS changes
- [ ] Wait 10-30 minutes for DNS propagation
- [ ] Check DNS records on https://dnschecker.org
- [ ] Verify domain on Resend dashboard shows "Verified"
- [ ] Update `EMAIL_FROM=noreply@gretexindustries.com` in backend/.env
- [ ] Restart backend server
- [ ] Test signup with any email address
- [ ] Verify email arrives successfully
- [ ] Check Resend dashboard for delivery confirmation

---

## Support Resources

- **Resend Documentation**: https://resend.com/docs/dashboard/domains/introduction
- **Resend Dashboard**: https://resend.com/domains
- **DNS Checker**: https://dnschecker.org
- **Resend Support**: support@resend.com

---

## Summary

Once you complete these steps:
- ✅ Emails will work for ANY address (not just pradhanrocky774@gmail.com)
- ✅ Professional sender address (noreply@gretexindustries.com)
- ✅ Better deliverability (less likely to go to spam)
- ✅ App Store & Play Store ready
- ✅ 3,000 emails/month free tier

**Estimated Total Time**: 15-45 minutes (including DNS propagation wait)
