# Resend Domain Verification Guide

**Date**: January 21, 2026  
**Issue**: Can only send emails to `pradhanrocky774@gmail.com` (testing mode)  
**Solution**: Verify your domain `gretexindustries.com`

## Current Limitation

Resend free tier in **testing mode**:
- ✅ Can send to: `pradhanrocky774@gmail.com` (your verified email)
- ❌ Cannot send to: Any other email address
- ⚠️ Error: `450 You can only send testing emails to your own email address`

## Solution: Verify Your Domain

Once you verify `gretexindustries.com`, you can:
- ✅ Send to ANY email address
- ✅ Send from `noreply@gretexindustries.com`
- ✅ Better deliverability
- ✅ Professional appearance

## Step-by-Step Domain Verification

### 1. Log in to Resend Dashboard
Go to: https://resend.com/domains

### 2. Add Your Domain
1. Click "Add Domain"
2. Enter: `gretexindustries.com`
3. Click "Add"

### 3. Get DNS Records
Resend will provide 3 DNS records to add:

**SPF Record (TXT)**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

**DKIM Record (TXT)**
```
Type: TXT
Name: resend._domainkey
Value: [Resend will provide this - copy exactly]
```

**DMARC Record (TXT)** (Optional but recommended)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@gretexindustries.com
```

### 4. Add DNS Records to Hostinger

Since your domain is hosted on Hostinger:

1. Log in to Hostinger: https://hpanel.hostinger.com
2. Go to "Domains" → Select `gretexindustries.com`
3. Click "DNS / Name Servers"
4. Click "Add Record" for each DNS record
5. Add all 3 records (SPF, DKIM, DMARC)
6. Save changes

### 5. Wait for DNS Propagation
- Usually takes: 15 minutes to 1 hour
- Can take up to: 48 hours (rare)
- Check status in Resend dashboard

### 6. Verify in Resend
1. Go back to Resend dashboard
2. Click "Verify" next to your domain
3. Resend will check DNS records
4. Status should change to "Verified" ✅

### 7. Update Backend Configuration

Once verified, update `backend/.env`:

```env
EMAIL_FROM=noreply@gretexindustries.com
```

And update on Render too!

## Quick Testing (While Waiting for Domain)

For immediate testing, use your own email:

**Test Signup:**
```
Email: pradhanrocky774@gmail.com
Password: Test@123
Name: Test User
```

This will work immediately since it's your verified email.

## Alternative: Use Render's Configuration

Since Render is already working with Resend, check if the domain is verified there:

1. Check Render environment variables
2. If `EMAIL_FROM=onboarding@resend.dev`, it's using Resend's test domain
3. This works on Render but has the same limitation locally

## Temporary Workaround

**Option 1: Test with Your Email Only**
- Use `pradhanrocky774@gmail.com` for all testing
- Works immediately
- Limited to one email

**Option 2: Use Render for Email Testing**
- Keep `BACKEND_URL=https://gmusic-ivdh.onrender.com` in local `.env`
- Emails go through Render (which might have domain verified)
- You can test with any email

**Option 3: Verify Domain (Recommended)**
- Follow steps above
- Takes 15-60 minutes
- Unlocks full email sending

## Checking Domain Verification Status

### In Resend Dashboard
```
https://resend.com/domains
```

Look for:
- ✅ Green checkmark = Verified
- ⏳ Yellow warning = Pending
- ❌ Red X = Failed

### Test DNS Records
```powershell
# Check SPF
nslookup -type=TXT gretexindustries.com

# Check DKIM
nslookup -type=TXT resend._domainkey.gretexindustries.com

# Check DMARC
nslookup -type=TXT _dmarc.gretexindustries.com
```

## After Domain Verification

### Update Local Backend
`backend/.env`:
```env
EMAIL_FROM=noreply@gretexindustries.com
```

### Update Render Backend
Render environment variables:
```env
EMAIL_FROM=noreply@gretexindustries.com
```

### Restart Services
```powershell
# Local backend
cd backend
npm start

# Render will auto-restart after env var change
```

## Benefits of Domain Verification

| Feature | Before (Testing Mode) | After (Verified Domain) |
|---------|----------------------|-------------------------|
| Send to any email | ❌ | ✅ |
| Professional sender | ❌ onboarding@resend.dev | ✅ noreply@gretexindustries.com |
| Deliverability | Medium | High |
| Spam score | Higher | Lower |
| Brand trust | Low | High |

## Troubleshooting

### DNS Records Not Propagating
- Wait longer (up to 48 hours)
- Clear DNS cache: `ipconfig /flushdns`
- Check with online tools: https://dnschecker.org

### Verification Failing
- Double-check DNS records (exact match)
- Ensure no typos in values
- Check TTL is set correctly (usually 3600)
- Contact Resend support if stuck

### Still Can't Send to Other Emails
- Verify domain status is "Verified" in Resend
- Update `EMAIL_FROM` to use verified domain
- Restart backend server
- Check Resend dashboard for errors

## Support Resources

- **Resend Docs**: https://resend.com/docs/dashboard/domains/introduction
- **Resend Support**: support@resend.com
- **DNS Checker**: https://dnschecker.org
- **Hostinger Support**: https://www.hostinger.com/tutorials/how-to-manage-dns-records

---

**Current Status**: Testing mode (only pradhanrocky774@gmail.com)  
**Next Step**: Verify domain at resend.com/domains  
**Estimated Time**: 15-60 minutes after adding DNS records
