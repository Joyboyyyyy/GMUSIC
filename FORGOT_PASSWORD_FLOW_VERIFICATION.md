# Forgot Password Flow - Complete Verification

## ✅ Flow Status: COMPLETE

All required files and functionality are in place for the forgot password flow.

---

## 📋 Complete File Checklist

### Backend Files ✅

1. **Routes** - `backend/src/routes/auth.routes.js`
   - ✅ `POST /api/auth/forgot-password` - Request reset
   - ✅ `POST /api/auth/reset-password` - Reset password

2. **Redirect Routes** - `backend/src/app.js`
   - ✅ `GET /auth/reset-password?token=...` - HTTPS redirect to app deep link
   - ✅ `GET /auth/verify-email?token=...` - HTTPS redirect to app deep link

3. **Controllers** - `backend/src/controllers/auth.controller.js`
   - ✅ `forgotPassword()` - Handles forgot password request
   - ✅ `resetPassword()` - Handles password reset

4. **Redirect Controllers** - `backend/src/controllers/redirect.controller.js`
   - ✅ `resetPasswordRedirect()` - Redirects HTTPS link to app deep link
   - ✅ `verifyEmailRedirect()` - Redirects HTTPS link to app deep link

3. **Services** - `backend/src/services/auth.service.js`
   - ✅ `forgotPassword(email)` - Generates token, saves to DB, sends email
   - ✅ `resetPassword(token, newPassword)` - Validates token, resets password

4. **Email Utility** - `backend/src/utils/email.js`
   - ✅ `sendPasswordResetEmail(email, token)` - Sends reset email with deep link

### Frontend Files ✅

1. **Screens**
   - ✅ `src/screens/auth/ForgotPasswordScreen.tsx` - Request reset screen
   - ✅ `src/screens/auth/ResetPasswordScreen.tsx` - Reset password screen

2. **Navigation**
   - ✅ `src/navigation/AuthNavigator.tsx` - Routes configured
   - ✅ `src/navigation/RootNavigator.tsx` - Deep link handling
   - ✅ `src/navigation/types.ts` - Type definitions

---

## 🔄 Complete Flow Diagram

```
1. User clicks "Forgot Password?" on Login Screen
   ↓
2. Navigate to ForgotPasswordScreen
   ↓
3. User enters email and submits
   ↓
4. Frontend: POST /api/auth/forgot-password { email }
   ↓
5. Backend Controller: forgotPassword()
   ↓
6. Backend Service: forgotPassword(email)
   - Find user by email
   - Generate random token (32 bytes)
   - Hash token with SHA-256
   - Save hashed token + expiry (15 min) to DB
   - Call sendPasswordResetEmail()
   ↓
7. Email Utility: sendPasswordResetEmail()
   - Creates HTML email with reset link
   - HTTPS redirect link: https://BACKEND_DOMAIN/auth/reset-password?token=xxx
   - Email clients can click HTTPS links reliably
   - Sends via SMTP
   ↓
8. User receives email and clicks HTTPS link
   ↓
9. Browser opens HTTPS link → Backend redirect endpoint
   ↓
10. Backend: GET /auth/reset-password?token=xxx
    - Validates token presence
    - Redirects (302) to: gretexmusicroom://reset-password?token=xxx
   ↓
11. Mobile OS opens app via deep link
   ↓
12. RootNavigator handles deep link
    - Parses token from URL
    - Navigates to ResetPasswordScreen with token
   ↓
11. User enters new password on ResetPasswordScreen
   ↓
12. Frontend: POST /api/auth/reset-password { token, password }
   ↓
13. Backend Controller: resetPassword()
   ↓
14. Backend Service: resetPassword(token, newPassword)
    - Hash provided token
    - Find user with matching hashed token
    - Check token expiry
    - Validate password strength
    - Hash new password with pepper
    - Update user password
    - Clear reset token
   ↓
15. Success! User redirected to Login
```

---

## 📧 Email Sending Verification

### Email Configuration Required:
```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@gretexindustries.com
SMTP_PASS=YOUR_SMTP_PASSWORD
EMAIL_FROM=info@gretexindustries.com
BACKEND_URL=https://your-backend-domain.com
APP_SCHEME=gretexmusicroom://
```

**Important Notes:**
- `SMTP_PORT=465` requires `secure: true` (hardcoded in code, not from env)
- `BACKEND_URL` should be HTTPS in production for email links to work in all clients
- Email links use HTTPS redirect endpoints for better email client compatibility

### Email Content:
- ✅ Subject: "Reset your password"
- ✅ HTML email with styled button (table-based for compatibility)
- ✅ HTTPS redirect link: `https://BACKEND_DOMAIN/auth/reset-password?token=xxx`
- ✅ Link redirects to app deep link: `gretexmusicroom://reset-password?token=xxx`
- ✅ Fallback text with full link for manual copy-paste
- ✅ Informative text: "This link will open the app to reset your password"

---

## 🔐 Security Features

1. **Token Security** ✅
   - Random 32-byte token generated
   - Token hashed with SHA-256 before storing
   - Token expires in 15 minutes
   - Token cleared after use

2. **Email Enumeration Prevention** ✅
   - Always returns success message
   - Doesn't reveal if email exists

3. **Password Validation** ✅
   - Minimum 6 characters
   - Requires uppercase, lowercase, number, special character
   - Validated on both frontend and backend

4. **Token Expiry** ✅
   - 15-minute expiry enforced
   - Expired tokens are cleared from database

---

## 🧪 Testing Checklist

### Test 1: Request Reset Email
- [ ] Navigate to ForgotPasswordScreen
- [ ] Enter valid email
- [ ] Submit form
- [ ] Verify success message shown
- [ ] Check email inbox for reset link

### Test 2: Email Link
- [ ] Click reset link in email
- [ ] Verify app opens (deep link) OR web redirects
- [ ] Verify ResetPasswordScreen opens with token

### Test 3: Reset Password
- [ ] Enter new password (meets requirements)
- [ ] Confirm password matches
- [ ] Submit form
- [ ] Verify success message
- [ ] Verify redirected to Login
- [ ] Test login with new password

### Test 4: Error Cases
- [ ] Invalid/expired token → Shows error
- [ ] Weak password → Shows validation error
- [ ] Mismatched passwords → Shows error
- [ ] Expired link (after 15 min) → Shows expiry error

---

## ⚠️ Important Notes

1. **SMTP Configuration**: 
   - Email sending requires valid SMTP credentials in `.env`
   - Port 465 requires `secure: true` (hardcoded in code)
   - SMTP connection is verified on server startup

2. **Email Links**:
   - Uses HTTPS redirect endpoints (`/auth/reset-password`) for better email client compatibility
   - Redirect endpoints forward to app deep links
   - `BACKEND_URL` should be HTTPS in production

3. **Deep Linking**: 
   - App must be configured to handle `gretexmusicroom://` scheme
   - RootNavigator handles deep link parsing and navigation

4. **Token Expiry**: Reset tokens expire after 15 minutes

5. **Email Delivery**: Check spam folder if email doesn't arrive

6. **Network**: Backend must be accessible for email links to work

7. **API Configuration**: Frontend uses `EXPO_PUBLIC_API_URL` from `.env` (no hardcoded IPs)

---

## 🐛 Potential Issues & Solutions

### Issue: Email not sending
**Solution**: 
- Verify SMTP credentials in `.env`
- Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
- Test SMTP connection separately

### Issue: Email link not clickable
**Solution**:
- Verify `BACKEND_URL` is HTTPS (not HTTP) in production
- Check redirect endpoint exists: `GET /auth/reset-password`
- Verify `APP_SCHEME=gretexmusicroom://` in `.env`
- Test redirect manually: `https://BACKEND_DOMAIN/auth/reset-password?token=test`

### Issue: Deep link not working
**Solution**:
- Verify `APP_SCHEME=gretexmusicroom://` in `.env`
- Check app.json/app.config.js has scheme configured
- Verify RootNavigator handles `reset-password` deep link
- Test deep link manually: `gretexmusicroom://reset-password?token=test`

### Issue: Token expired immediately
**Solution**:
- Check server time is correct
- Verify `resetTokenExpiry` is being set correctly
- Check database timezone settings

### Issue: Password reset not working
**Solution**:
- Verify token is being passed correctly
- Check token hashing matches (SHA-256)
- Verify database has resetToken and resetTokenExpiry fields

---

## ✅ Summary

**All files are present and correctly configured!**

- ✅ Backend routes configured
- ✅ Backend controllers implemented
- ✅ Backend services handle business logic
- ✅ Email sending configured
- ✅ Frontend screens implemented
- ✅ Navigation configured
- ✅ Deep linking handled
- ✅ Security measures in place
- ✅ Error handling implemented

**The forgot password flow is complete and ready to use!**

Just ensure:
1. SMTP credentials are configured in `.env`
2. `BACKEND_URL` is set (HTTPS in production)
3. `APP_SCHEME=gretexmusicroom://` is set in `.env`
4. Backend is running and accessible
5. Redirect endpoints (`/auth/reset-password`) are mounted in `app.js`
6. Email service is accessible
7. Frontend has `EXPO_PUBLIC_API_URL` set in `.env`

## 🔗 Current Implementation Details

### Email Link Flow:
1. Email contains: `https://BACKEND_DOMAIN/auth/reset-password?token=xxx`
2. User clicks link → Browser opens HTTPS URL
3. Backend redirect endpoint (`GET /auth/reset-password`) receives request
4. Backend redirects (302) to: `gretexmusicroom://reset-password?token=xxx`
5. Mobile OS opens app via deep link
6. RootNavigator parses token and navigates to ResetPasswordScreen

### Backend Routes:
- `POST /api/auth/forgot-password` - Request password reset
- `GET /auth/reset-password?token=xxx` - HTTPS redirect endpoint (NEW)
- `POST /api/auth/reset-password` - Process password reset

### Frontend Configuration:
- API Base URL: `EXPO_PUBLIC_API_URL` from `.env` (single source of truth)
- No hardcoded IPs or platform detection
- All API calls use centralized `api.ts` instance

