# Login Failed - Email Not Verified

**Error**: `Invalid email or password`  
**Real Cause**: Email address not verified  
**Date**: January 22, 2026

## The Problem

Your login is failing with "Invalid email or password" but the **real reason** is that the user's email hasn't been verified yet.

The backend code intentionally returns a generic error message for security reasons (so attackers can't tell if an email exists or not).

## Why This Happens

Looking at `backend/src/services/auth.service.js` line 318:

```javascript
// b. If not verified → reject
if (user.emailVerified === false) {
  throw new Error(genericError); // Returns "Invalid email or password"
}
```

The login flow checks:
1. ✅ User exists in database
2. ✅ Account not locked
3. ✅ Password is correct
4. ❌ **Email is verified** ← FAILS HERE
5. Account is active
6. Generate JWT token

## How to Fix

### Option 1: Check User Status (Recommended)

Run this command to check why login is failing:

```powershell
cd backend
node check-user-login.js rockyprahan9820.rp@gmail.com
```

This will show you:
- ✅ If user exists
- ✅ If email is verified
- ✅ If account is active
- ✅ If account is locked
- ✅ Password hash type
- ✅ Exact reason login is failing

### Option 2: Manually Verify Email

If the user didn't receive the verification email or it expired:

```powershell
cd backend
node verify-user-manually.js rockyprahan9820.rp@gmail.com
```

This will:
- Mark the email as verified
- Allow the user to login immediately

### Option 3: Resend Verification Email

The user can request a new verification email from the app's "Resend Verification" button.

## Diagnosis Steps

### Step 1: Check if user exists
```powershell
cd backend
node check-user-login.js <email>
```

### Step 2: Check backend logs
Look for these log messages during login:
```
[Auth Service] Password comparison result: true
```

If you see `true` but login still fails, it's the email verification check.

### Step 3: Check database directly
```sql
SELECT id, email, name, "emailVerified", "isActive" 
FROM "User" 
WHERE email = 'rockyprahan9820.rp@gmail.com';
```

Expected result:
- `emailVerified` should be `true` for login to work
- `isActive` should be `true`

## Common Scenarios

### Scenario 1: User just signed up
**Problem**: Verification email not received  
**Solution**: 
1. Check spam folder
2. Or manually verify: `node verify-user-manually.js <email>`

### Scenario 2: Verification email expired
**Problem**: Token expired after 30 minutes  
**Solution**: 
1. Resend verification email from app
2. Or manually verify: `node verify-user-manually.js <email>`

### Scenario 3: Email service not working
**Problem**: Resend testing mode restriction  
**Solution**: 
1. Verify domain on Resend (see RESEND_DNS_SETUP_GUIDE.md)
2. Or manually verify users: `node verify-user-manually.js <email>`

## Testing Login

After verifying the email, test login:

### Test with curl:
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rockyprahan9820.rp@gmail.com","password":"YOUR_PASSWORD"}'
```

### Expected Success Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "rockyprahan9820.rp@gmail.com",
      "name": "Rocky",
      "role": "STUDENT"
    }
  },
  "message": "Login successful"
}
```

## Backend Logs to Check

During login, you should see:

```
[Auth Service] Password hash prefix: $2a$10$...
[Auth Service] Password comparison result: true
```

If you see `false` instead of `true`, the password is wrong.

If you see `true` but login still fails, check the email verification status.

## Quick Fix Commands

```powershell
# Check user status
cd backend
node check-user-login.js rockyprahan9820.rp@gmail.com

# Manually verify email
node verify-user-manually.js rockyprahan9820.rp@gmail.com

# List all unverified users
node list-users.js
```

## Prevention

To avoid this issue in the future:

1. **Fix email delivery** - Verify domain on Resend
2. **Add better error messages** - Show "Please verify your email" instead of generic error
3. **Auto-verify for testing** - Add a test mode that skips email verification

## Summary

✅ **Root Cause**: Email not verified  
✅ **Quick Fix**: Run `node verify-user-manually.js <email>`  
✅ **Long-term Fix**: Verify domain on Resend for reliable email delivery  

The database is working fine - it's just the email verification check that's blocking login!
