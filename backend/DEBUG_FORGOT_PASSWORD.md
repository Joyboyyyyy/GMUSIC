# Debugging Forgot Password Email Issues

## ✅ SMTP Test Results
- SMTP connection: **WORKING** ✅
- Email sending: **WORKING** ✅
- Test email sent successfully to: `info@gretexindustries.com`

## 🔍 How to Debug

### Step 1: Check Server Logs
When you click "Forgot Password" and enter an email, you should see these logs in your backend server console:

```
[Auth Controller] Forgot password requested
[Auth Service] Forgot password flow started for email: YOUR_EMAIL
```

**If user exists:**
```
[Auth Service] User found
[Auth Service] Reset token generated
[Auth Service] Invalidating previous reset tokens for userId: XXX
[Auth Service] Reset token saved to database
[Auth Service] Sending reset email
[Auth Service] About to call sendPasswordResetEmail for: YOUR_EMAIL
[Email] 📧 sendPasswordResetEmail called for: YOUR_EMAIL
[Email] Checking SMTP configuration...
[Email] ✅ SMTP transporter verified successfully
[Email] Preparing to send password reset email to YOUR_EMAIL
[Email] Attempting to send email...
✅ 📨 RESET EMAIL SENT TO: YOUR_EMAIL
[Auth Service] ✅ Password reset email sent successfully
```

**If user does NOT exist:**
```
[Auth Service] User not found for email: YOUR_EMAIL (returning generic success)
```

### Step 2: Check if User Exists
The email is only sent if the user exists in the database. Check your database:

```sql
SELECT id, email, name FROM "User" WHERE email = 'YOUR_EMAIL';
```

### Step 3: Check Email Inbox
1. Check the **inbox** of the email you entered
2. Check the **spam/junk folder**
3. Check if the email address is correct (typos?)

### Step 4: Test with Known User
Try the forgot password flow with an email that you know exists in your database.

### Step 5: Check for Errors
If you see any of these in the logs, there's an issue:

```
❌ [Email] SMTP verification failed
❌ RESET EMAIL FAILED
❌ [Auth Service] FAILED TO SEND PASSWORD RESET EMAIL
```

## 🛠️ Quick Test

Run this to test the forgot password endpoint:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/forgot-password" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"YOUR_EMAIL_HERE"}'
```

Replace `YOUR_EMAIL_HERE` with an email that exists in your database.

## 📧 Email Delivery Notes

- **Hostinger SMTP** is working correctly
- Emails are being **queued** by the SMTP server (Response: `250 2.0.0 Ok: queued`)
- Delivery can take a few seconds to a few minutes
- Check spam folder if email doesn't arrive immediately

## 🔧 Common Issues

1. **User doesn't exist**: Email won't be sent (security feature)
2. **Email in spam**: Check spam/junk folder
3. **Wrong email address**: Typo in email entry
4. **Server not running**: Backend must be running
5. **Database connection issue**: User lookup fails

## ✅ Next Steps

1. **Check your backend server console logs** when you submit the forgot password form
2. **Verify the email exists in your database**
3. **Check spam folder** for the reset email
4. **Share the server logs** if email still doesn't arrive

