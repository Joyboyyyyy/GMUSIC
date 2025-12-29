# Complete Authentication Flows Documentation

**Complete Auth System: Signup → Email Verification → Login → Password Reset (All with SMTP)**

This document provides a comprehensive overview of the complete authentication system including signup, login, password reset, and all SMTP email flows. It covers both frontend (React Native/Expo) and backend (Express.js/Node.js) implementations.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Signup Flow](#signup-flow)
3. [Login Flow](#login-flow)
4. [Forgot Password Flow (SMTP)](#forgot-password-flow-smtp)
5. [Password Reset Flow (SMTP)](#password-reset-flow-smtp)
6. [Email Verification Flow](#email-verification-flow)
7. [Email Sending Flow (SMTP)](#email-sending-flow-smtp)
8. [SMTP Configuration](#smtp-configuration)
9. [Deep Linking](#deep-linking)
10. [API Endpoints Reference](#api-endpoints-reference)
11. [Security Features](#security-features)
12. [Testing & Troubleshooting](#testing--troubleshooting)

---

## Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   React Native  │         │   Express.js     │         │   PostgreSQL    │
│   (Frontend)    │────────▶│   (Backend API)  │────────▶│   (Database)    │
│   Expo Router   │         │   Node.js        │         │   Prisma ORM    │
└─────────────────┘         └─────────────────┘         └─────────────────┘
         │                            │
         │                            │
         │                            ▼
         │                   ┌─────────────────┐
         │                   │   Nodemailer    │
         │                   │   (SMTP)        │
         │                   └─────────────────┘
         │                            │
         │                            ▼
         │                   ┌─────────────────┐
         │                   │   Email Server │
         │                   │   (Hostinger)   │
         │                   └─────────────────┘
         │
         ▼
┌─────────────────┐
│   User Email    │
│   (Inbox)       │
└─────────────────┘
```

### Technology Stack

**Frontend:**
- React Native with TypeScript
- Expo Router for navigation
- React Native Paper (UI)
- Zustand (state management)
- Axios (HTTP client)

**Backend:**
- Node.js + Express.js
- PostgreSQL database
- Prisma ORM
- Nodemailer (SMTP)
- Argon2id (password hashing)
- JWT (authentication tokens)

---

## Signup Flow

### Overview
User creates a new account with name, email, and password. After signup, a verification email is sent. User must verify email before full access.

### Frontend Flow

**Screen:** `src/screens/auth/SignupScreen.tsx`

**Steps:**
1. User enters:
   - Name
   - Email
   - Password (must meet requirements)
   - Confirm Password
2. Password validation:
   - At least 6 characters
   - Contains uppercase letter
   - Contains lowercase letter
   - Contains number
   - Contains special character (`@$!%*?&._-`)
3. On submit, calls `authStore.signup(name, email, password)`

**State Management:** `src/store/authStore.ts`

```typescript
signup: async (name: string, email: string, password: string) => {
  // 1. POST /api/auth/register
  // 2. Store token in SecureStore
  // 3. Save email to pendingEmail storage
  // 4. If emailVerified === false:
  //    - Set isAuthenticated = false
  //    - Navigate to VerifyEmail screen
  // 5. If emailVerified === true:
  //    - Fetch complete user profile
  //    - Set isAuthenticated = true
  //    - Navigate to Main
}
```

**Navigation After Signup:**
- If email NOT verified → `VerifyEmail` screen
- If email verified → `Main` navigator

### Backend Flow

**Endpoint:** `POST /api/auth/register`

**Controller:** `backend/src/controllers/auth.controller.js`
```javascript
export const register = async (req, res) => {
  // 1. Validate: email, password, name required
  // 2. Call authService.register()
  // 3. Return: { success: true, data: { user, token, emailVerified } }
}
```

**Service:** `backend/src/services/auth.service.js`
```javascript
async register(userData) {
  // 1. Check if user exists (by email)
  // 2. Hash password with Argon2id + PASSWORD_PEPPER
  // 3. Create user in database:
  //    - email, password (hashed), name
  //    - avatar: auto-generated from name
  //    - isVerified: false
  // 4. Generate verification token (UUID v4)
  // 5. Set verificationExpires: 30 minutes from now
  // 6. Update user with verificationToken and verificationExpires
  // 7. Send verification email (sendVerificationEmail)
  // 8. Generate JWT token
  // 9. Return: { user, token, emailVerified: false }
}
```

**Database Fields Created:**
- `id` (UUID)
- `email` (unique)
- `password` (Argon2id hashed)
- `name`
- `avatar` (auto-generated URL)
- `verificationToken` (UUID)
- `verificationExpires` (DateTime, 30 min from now)
- `isVerified` (false)

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "avatar": "https://ui-avatars.com/api/?name=...",
      "isVerified": false
    },
    "token": "jwt_token_here",
    "emailVerified": false
  }
}
```

---

## Login Flow

### Overview
User logs in with email and password. Account must be verified. Supports Google OAuth and Apple Sign-In.

### Frontend Flow

**Screen:** `src/screens/auth/LoginScreen.tsx`

**Credential Login:**
1. User enters email and password
2. Calls `authStore.loginWithCredentials(email, password)`
3. On success:
   - Token stored in SecureStore
   - User data stored in Zustand state
   - `isAuthenticated = true`
   - Navigate to `Main` or redirect path

**Google OAuth Login:**
1. Uses `expo-auth-session/providers/google`
2. Configuration:
   - `clientId`: `EXPO_PUBLIC_GOOGLE_CLIENT_ID` (Web Client ID only)
   - `scopes`: `['openid', 'profile', 'email']`
   - `responseType`: `'id_token'`
   - `useProxy: true` (Expo Auth Proxy)
3. On success:
   - Extract `idToken` from response
   - Send to backend: `POST /api/auth/google`
   - Backend verifies and returns user + JWT token
   - Store token and user data
   - Navigate to Main

**Apple Sign-In (iOS only):**
1. Uses `expo-apple-authentication`
2. On success:
   - Extract user info
   - Store in auth state
   - Navigate to Main

**State Management:** `src/store/authStore.ts`

```typescript
loginWithCredentials: async (email: string, password: string) => {
  // 1. POST /api/auth/login
  // 2. Extract user and token from response
  // 3. Store token in SecureStore
  // 4. Update Zustand state:
  //    - user
  //    - token
  //    - isAuthenticated = true
  // 5. Return { user, token }
}
```

### Backend Flow

**Endpoint:** `POST /api/auth/login`

**Controller:** `backend/src/controllers/auth.controller.js`
```javascript
export const login = async (req, res) => {
  // 1. Validate: email and password required
  // 2. Call authService.login(email, password)
  // 3. Return: { success: true, data: { user, token } }
}
```

**Service:** `backend/src/services/auth.service.js`
```javascript
async login(email, password) {
  // 1. Find user by email
  // 2. Check if account is locked (isLockedUntil)
  // 3. Check if email is verified (isVerified must be true)
  // 4. Verify password with Argon2id
  // 5. If password invalid:
  //    - Increment failedLoginAttempts
  //    - If >= 5 attempts, lock account for 10 minutes
  //    - Throw error
  // 6. If password valid:
  //    - Reset failedLoginAttempts
  //    - Generate JWT token
  //    - Return: { user, token }
}
```

**Security Features:**
- Account locking after 5 failed attempts (10 minutes)
- Email verification required
- Password hashing with Argon2id + pepper

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "avatar": "url",
      "isVerified": true
    },
    "token": "jwt_token_here"
  }
}
```

**Error Responses:**
- `401`: Invalid email or password
- `401`: Email not verified
- `401`: Account temporarily locked

---

## Forgot Password Flow

### Overview
User requests password reset via email. Receives deep link with token. Opens app to reset password form.

### Frontend Flow

**Screen:** `src/screens/auth/ForgotPasswordScreen.tsx`

**Step 1: Request Reset Email**
1. User enters email address
2. Calls `POST /api/auth/forgot-password`
3. Shows success message (always, for security)

**Step 2: Receive Email & Click Link**
1. User receives email with deep link: `gretexmusicroom://reset-password?token=...`
2. Clicking link opens app
3. Deep link handler in `RootNavigator.tsx`:
   ```typescript
   if (url.includes('reset-password') && parsed?.queryParams?.token) {
     navigation.navigate('Auth', { 
       screen: 'ForgotPassword',
       params: { token }
     });
   }
   ```
4. `ForgotPasswordScreen` detects token in route params
5. Shows password reset form (not email input)

**Step 3: Reset Password**
1. User enters new password and confirm password
2. Calls `POST /api/auth/reset-password` with token and password
3. On success:
   - Shows success message
   - User can now login with new password

**State Management:**
```typescript
// ForgotPasswordScreen.tsx
const route = useRoute<ForgotPasswordRouteProp>();
const tokenFromLink = route.params?.token;
const [isResetting, setIsResetting] = useState(!!tokenFromLink);

// Conditional rendering:
// - If token exists: Show reset password form
// - If no token: Show email input form
```

### Backend Flow

**Endpoint 1:** `POST /api/auth/forgot-password`

**Controller:** `backend/src/controllers/auth.controller.js`
```javascript
export const forgotPassword = async (req, res) => {
  // 1. Validate: email required
  // 2. Call authService.forgotPassword(email)
  // 3. Return: { success: true, message: "..." }
  // 4. On error: Return 500 with "Email send failed"
}
```

**Service:** `backend/src/services/auth.service.js`
```javascript
async forgotPassword(email) {
  // 1. Find user by email
  // 2. If user not found: Return generic success (prevent email enumeration)
  // 3. Generate random token (32 bytes = 256 bits)
  // 4. Hash token with SHA-256
  // 5. Set expiry: 15 minutes from now
  // 6. Invalidate previous reset tokens (try/catch for schema safety)
  // 7. Save new resetToken and resetTokenExpiry to database
  // 8. Send password reset email with RAW token (for deep link)
  // 9. Return: { message: "If your email is registered..." }
}
```

**Endpoint 2:** `POST /api/auth/reset-password`

**Controller:** `backend/src/controllers/auth.controller.js`
```javascript
export const resetPassword = async (req, res) => {
  // 1. Validate: token and password required
  // 2. Call authService.resetPassword(token, password)
  // 3. Return: { success: true, message: "Password reset successfully" }
}
```

**Service:** `backend/src/services/auth.service.js`
```javascript
async resetPassword(token, newPassword) {
  // 1. Hash provided token (SHA-256)
  // 2. Find user with matching resetToken (hashed)
  // 3. Check if token expired (resetTokenExpiry)
  // 4. Hash new password with Argon2id + pepper
  // 5. Update user:
  //    - password = new hashed password
  //    - resetToken = null
  //    - resetTokenExpiry = null
  // 6. Return: { message: "Password reset successfully" }
}
```

**Security Features:**
- Token hashing (SHA-256) before database storage
- Token expiry (15 minutes)
- Email enumeration protection (always return success)
- Previous tokens invalidated

**Response (Forgot Password):**
```json
{
  "success": true,
  "message": "If your email is registered, you will receive a reset link.",
  "data": {
    "message": "If your email is registered, you will receive a reset link."
  }
}
```

**Response (Reset Password):**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "message": "Password reset successfully"
  }
}
```

---

## Email Verification Flow

### Overview
After signup, user receives verification email. Clicking link opens app and verifies email. User profile is updated.

### Frontend Flow

**Screen 1:** `src/screens/EmailVerifyScreen.tsx` (Verification Processing)
1. Receives token from deep link: `gretexmusicroom://verify-email?token=...`
2. Calls `GET /api/auth/verify-email/:token`
3. On success: Navigate to `EmailVerified` screen
4. On error: Show error alert

**Screen 2:** `src/screens/EmailVerifiedScreen.tsx` (Post-Verification)
1. Fetches fresh user profile: `GET /api/auth/me`
2. Updates auth state with backend data
3. Sets `isAuthenticated = true`
4. Navigates to `Main` navigator

**Deep Link Handling:** `src/navigation/RootNavigator.tsx`
```typescript
if (url.includes('verify-email') && parsed?.queryParams?.token) {
  const token = parsed.queryParams.token as string;
  navigation.navigate('EmailVerify', { token });
}
```

**State Management:**
```typescript
// EmailVerifiedScreen.tsx
const finalizeVerification = async () => {
  // 1. Get token from SecureStore
  // 2. Set token in axios
  // 3. Fetch fresh user: fetchMe()
  // 4. Replace entire auth state: setUserFromBackend(me.user)
  // 5. Clear pendingEmail from storage
  // 6. Navigate to Main
};
```

### Backend Flow

**Endpoint:** `GET /api/auth/verify-email/:token`

**Controller:** `backend/src/controllers/verify.controller.js`
```javascript
export const verifyEmail = async (req, res) => {
  // 1. Extract token from URL params
  // 2. Call authService.verifyEmail(token)
  // 3. Redirect to deep link: gretexmusicroom://email-verified
  //    Or return JSON if API call
}
```

**Service:** `backend/src/services/auth.service.js`
```javascript
async verifyEmail(token) {
  // 1. Find user by verificationToken
  // 2. Check if token expired (verificationExpires)
  // 3. Check if already verified
  // 4. Update user:
  //    - isVerified = true
  //    - verificationToken = null
  //    - verificationExpires = null
  // 5. Return: { message: "Email verified successfully" }
}
```

**Database Update:**
```sql
UPDATE User SET
  isVerified = true,
  verificationToken = NULL,
  verificationExpires = NULL
WHERE verificationToken = :token
```

**Response:**
- Success: Redirect to `gretexmusicroom://email-verified`
- Error: Redirect to `gretexmusicroom://email-verified?error=...`

---

## Email Sending Flow (SMTP)

### Overview
Emails are sent via Nodemailer using SMTP (Hostinger/Gmail). Three types: verification, password reset, and resend verification. All emails use deep links to open the mobile app directly.

### Email Configuration

**File:** `backend/src/utils/email.js`

**SMTP Setup:**
```javascript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,        // smtp.hostinger.com
  port: Number(process.env.SMTP_PORT), // 465
  secure: true,                        // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
```

**Environment Variables:**
- `SMTP_HOST`: SMTP server hostname
- `SMTP_PORT`: SMTP port (465 for SSL)
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password
- `EMAIL_FROM`: From email address (optional, defaults to SMTP_USER)
- `APP_SCHEME`: Deep link scheme (default: `gretexmusicroom://`)

**SMTP Verification:**
- Called on server startup: `verifySMTPConnection()`
- Verifies connection before sending emails
- Logs SMTP configuration

### Verification Email

**Function:** `sendVerificationEmail(to, token, name)`

**Flow:**
1. Generate deep link: `${APP_SCHEME}verify-email?token=${token}`
2. Create HTML email with:
   - Styled button (table-based for email client compatibility)
   - Fallback text with full link
3. Verify SMTP connection
4. Send email via Nodemailer
5. Log messageId on success

**Email Content:**
- Subject: "Verify your Gretex Music Room account"
- HTML: Styled card with button and fallback link
- Deep link: `gretexmusicroom://verify-email?token=...`

**Email Template:**
```html
<div class="box">
  <div class="title">Verify your email</div>
  <div class="text">
    Hi {name},<br/>
    Please confirm your email to complete your Gretex Music Room signup.
  </div>
  <table role="presentation">
    <tr>
      <td align="center">
        <a href="{verifyLink}">Verify Email</a>
      </td>
    </tr>
  </table>
  <div class="foot">
    <p>If the button does not work, copy and paste this link:</p>
    <p>{verifyLink}</p>
  </div>
</div>
```

### Password Reset Email

**Function:** `sendPasswordResetEmail(email, token)`

**Flow:**
1. Generate deep link: `${APP_SCHEME}reset-password?token=${token}`
2. Create HTML email with:
   - Styled button (table-based)
   - Fallback text with full link
3. Log SMTP details
4. Send email via Nodemailer
5. Log messageId on success
6. Throw error on failure (not silent)

**Email Content:**
- Subject: "Reset your password"
- HTML: Styled card with button and fallback link
- Deep link: `gretexmusicroom://reset-password?token=...`
- Expiry notice: "This link will expire in 15 minutes"

**Email Template:**
```html
<div class="box">
  <div class="title">Reset your password</div>
  <div class="text">
    Hello,<br/>
    You requested to reset your password for Gretex Music Room. 
    Tap the button below to reset your password in the app.
  </div>
  <table role="presentation">
    <tr>
      <td align="center">
        <a href="{resetLink}">Reset Password</a>
      </td>
    </tr>
  </table>
  <div class="foot">
    <p>If the button does not work, copy and paste this link:</p>
    <p>{resetLink}</p>
  </div>
</div>
```

**Error Handling:**
- Wrapped in try/catch
- Logs detailed error information
- Throws error (not swallowed)
- Controller catches and returns 500

**Logging:**
```javascript
console.log(`[Email] SMTP Host: ${SMTP_HOST}`);
console.log(`[Email] SMTP Port: ${SMTP_PORT}`);
console.log(`[Email] From: ${from}`);
console.log(`[Email] To: ${to}`);
console.log(`[Email] ✅ Email sent - MessageId: ${messageId}`);
```

---

## SMTP Configuration

### Complete SMTP Setup

**File:** `backend/src/utils/email.js`

**SMTP Transporter:**
```javascript
import nodemailer from 'nodemailer';

const smtpPort = Number(process.env.SMTP_PORT);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,        // e.g., 'smtp.hostinger.com' or 'smtp.gmail.com'
  port: smtpPort,                     // 465 (SSL) or 587 (TLS)
  secure: smtpPort === 465 ? true : false, // true for port 465, false for 587
  auth: {
    user: process.env.SMTP_USER,      // Your email address
    pass: process.env.SMTP_PASS,      // App password or account password
  },
});
```

### SMTP Connection Verification

**Function:** `verifySMTPConnection()`

Called on server startup to verify SMTP connection:

```javascript
export async function verifySMTPConnection() {
  try {
    await transporter.verify();
    console.log('[Email] ✅ SMTP connection verified');
    return true;
  } catch (error) {
    console.error('[Email] ❌ SMTP verification failed:', error.message);
    return false;
  }
}
```

### SMTP Providers Configuration

#### Gmail SMTP
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Generate from Google Account settings
EMAIL_FROM=your-email@gmail.com
```

**Note:** For Gmail, you need to:
1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use the App Password in `SMTP_PASS`

#### Hostinger SMTP
```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password
EMAIL_FROM=your-email@yourdomain.com
```

#### Other SMTP Providers
- **Outlook/Hotmail:** `smtp-mail.outlook.com:587`
- **Yahoo:** `smtp.mail.yahoo.com:587`
- **Custom:** Use your provider's SMTP settings

### Email Sending Process

**Step-by-Step:**
1. **Prepare Email Content:**
   - Generate deep link URL
   - Create HTML email template
   - Set subject and recipient

2. **Verify SMTP Connection** (optional, for verification emails):
   ```javascript
   await transporter.verify();
   ```

3. **Send Email:**
   ```javascript
   const info = await transporter.sendMail(mailOptions);
   console.log("📨 EMAIL SENT", info.messageId);
   ```

4. **Error Handling:**
   ```javascript
   try {
     const info = await transporter.sendMail(mailOptions);
     return info;
   } catch (err) {
     console.error(`[Email] ❌ Email send failed: ${err.message}`);
     throw err; // Re-throw for controller to handle
   }
   ```

### Email Template Structure

All emails follow this structure:
```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      /* Inline CSS for email client compatibility */
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto; 
             margin:0; padding:0; background:#f5f6f8; }
      .box { max-width:600px; margin:30px auto; background:white; 
             border-radius:8px; padding:24px; }
      .title { font-size:22px; font-weight:600; margin-bottom:12px; }
      .text { color:#444; margin-bottom:20px; line-height:1.5; }
      .foot { margin-top:20px; color:#666; font-size:13px; word-break:break-all; }
    </style>
  </head>
  <body>
    <div class="box">
      <div class="title">Email Title</div>
      <div class="text">Email body content</div>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="center" style="background:#5b21b6; border-radius:8px;">
            <a href="{deepLink}" style="display:inline-block; padding:14px 22px; 
               background:#5b21b6; color:#ffffff; text-decoration:none; 
               border-radius:8px; font-weight:600; font-size:16px;">
              Action Button
            </a>
          </td>
        </tr>
      </table>
      <div class="foot">
        <p>If the button does not work, copy and paste this link:</p>
        <p style="font-family:monospace; background:#f3f4f6; padding:8px; 
           border-radius:4px; word-break:break-all;">{deepLink}</p>
      </div>
    </div>
  </body>
</html>
```

**Key Design Principles:**
- Table-based buttons (better email client support)
- Inline CSS (required for email clients)
- Fallback text links
- Mobile-responsive viewport
- Accessible color contrast

---

## Deep Linking

### Overview
App uses deep links for email verification and password reset. Links open app directly, no HTTP backend URLs.

### Configuration

**File:** `App.tsx`
```typescript
const linking: LinkingOptions = {
  prefixes: [
    'gretexmusicroom://',
    ...(Platform.OS === 'web' ? ['https://', 'http://'] : []),
  ],
  config: {
    screens: {
      EmailVerify: 'verify-email',
      ForgotPassword: 'reset-password',
      EmailVerified: 'email-verified',
    },
  },
};
```

### Deep Link Handlers

**File:** `src/navigation/RootNavigator.tsx`

**Verify Email:**
```typescript
if (url.includes('verify-email') && parsed?.queryParams?.token) {
  const token = parsed.queryParams.token as string;
  navigation.navigate('EmailVerify', { token });
}
```

**Reset Password:**
```typescript
if (url.includes('reset-password') && parsed?.queryParams?.token) {
  const token = parsed.queryParams.token as string;
  navigation.navigate('Auth', { 
    screen: 'ForgotPassword',
    params: { token }
  });
}
```

**Email Verified:**
```typescript
if (url.includes('email-verified')) {
  const error = parsed?.queryParams?.error;
  navigation.navigate('EmailVerified', error ? { error } : undefined);
}
```

### Deep Link Formats

1. **Email Verification:**
   - Format: `gretexmusicroom://verify-email?token={uuid}`
   - Opens: `EmailVerifyScreen`
   - Action: Verifies email via `GET /api/auth/verify-email/:token`

2. **Password Reset:**
   - Format: `gretexmusicroom://reset-password?token={hex_token}`
   - Opens: `ForgotPasswordScreen` (with token param)
   - Action: Shows password reset form

3. **Email Verified (Redirect):**
   - Format: `gretexmusicroom://email-verified` or `gretexmusicroom://email-verified?error={message}`
   - Opens: `EmailVerifiedScreen`
   - Action: Fetches user profile and navigates to Main

---

## API Endpoints Reference

### Public Endpoints

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/api/auth/register` | Sign up new user | `{ name, email, password }` | `{ success, data: { user, token, emailVerified } }` |
| POST | `/api/auth/login` | Login with credentials | `{ email, password }` | `{ success, data: { user, token } }` |
| POST | `/api/auth/google` | Google OAuth login | `{ idToken }` | `{ success, data: { user, token } }` |
| POST | `/api/auth/forgot-password` | Request password reset | `{ email }` | `{ success, message }` |
| POST | `/api/auth/reset-password` | Reset password with token | `{ token, password }` | `{ success, message }` |
| GET | `/api/auth/verify-email/:token` | Verify email with token | - | Redirect to deep link |
| GET | `/api/auth/check-verification` | Check verification status | - | `{ isVerified }` |
| POST | `/api/auth/resend-verification` | Resend verification email | `{ email }` | `{ success, message }` |
| POST | `/api/auth/test-email` | Test email sending (temp) | - | `{ success, messageId }` |

### Protected Endpoints

| Method | Endpoint | Description | Headers | Response |
|--------|----------|-------------|---------|----------|
| GET | `/api/auth/me` | Get current user profile | `Authorization: Bearer {token}` | `{ success, data: { user } }` |
| PUT | `/api/auth/me` | Update user profile | `Authorization: Bearer {token}` | `{ success, data: { user } }` |

### Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

---

## Security Features

### Password Security
- **Hashing:** Argon2id (memory cost: 64MB, time cost: 3, parallelism: 1)
- **Pepper:** `PASSWORD_PEPPER` environment variable (added before hashing)
- **Requirements:** Min 6 chars, uppercase, lowercase, number, special char

### Token Security
- **JWT:** Signed with secret, contains userId, email, role
- **Verification Token:** UUID v4, expires in 30 minutes
- **Reset Token:** 32 bytes (256 bits), hashed with SHA-256, expires in 15 minutes

### Account Security
- **Email Verification:** Required before login
- **Account Locking:** 5 failed login attempts → 10 minute lock
- **Email Enumeration Protection:** Always return success for forgot password

### Email Security
- **SMTP:** SSL/TLS encrypted (port 465)
- **Deep Links:** No HTTP backend URLs exposed
- **Token Hashing:** Reset tokens hashed before database storage

---

## State Management

### Auth Store (`src/store/authStore.ts`)

**State:**
```typescript
{
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  initialized: boolean;
  redirectPath: RedirectPath | null;
}
```

**Key Methods:**
- `login(user, token)`: Store token and user, set authenticated
- `loginWithCredentials(email, password)`: API call + login
- `signup(name, email, password)`: API call + store token
- `logout()`: Clear token and user
- `fetchMe()`: Get fresh user from backend
- `setUserFromBackend(user)`: Replace user with backend data
- `init()`: Initialize auth state on app start

**Storage:**
- Token: `SecureStore` (native) or `AsyncStorage` (web)
- Key: `auth_token`
- Pending email: `pendingEmail` (for verification flow)

---

## Error Handling

### Frontend
- Network errors: Detailed logging with API URL
- Validation errors: Clear user-facing messages
- Auth errors: Redirect to login if token invalid

### Backend
- Prisma errors: Detailed logging with schema mismatch detection
- Email errors: Logged loudly, thrown (not swallowed)
- Validation errors: 400 with clear message
- Auth errors: 401 with generic message (security)

---

## Testing

### Test Email Endpoint
**Endpoint:** `POST /api/auth/test-email`

**Purpose:** Test SMTP configuration without full flow

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "to": "test@example.com",
  "messageId": "smtp_message_id"
}
```

**Note:** Remove this endpoint after confirming SMTP works.

---

## Troubleshooting

### Email Not Sending
1. Check SMTP configuration in `.env`
2. Verify SMTP connection on server startup
3. Check server logs for email errors
4. Test with `/api/auth/test-email` endpoint

### Deep Links Not Opening
1. Verify `APP_SCHEME` in `.env`
2. Check `app.json` scheme configuration
3. Test deep link format: `gretexmusicroom://verify-email?token=...`
4. Check `RootNavigator.tsx` deep link handlers

### Prisma Errors
1. Run `npx prisma generate`
2. Run `npx prisma migrate dev`
3. Restart backend server
4. Check schema matches database

### Token Expired
- Verification token: 30 minutes
- Reset token: 15 minutes
- User must request new token if expired

---

## Environment Variables

### Required
```env
# SMTP Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=your_email@domain.com
SMTP_PASS=your_password
EMAIL_FROM=your_email@domain.com

# App Configuration
APP_SCHEME=gretexmusicroom://
BACKEND_URL=http://192.168.x.x:3000

# Security
PASSWORD_PEPPER=your_random_pepper_string
JWT_SECRET=your_jwt_secret

# Google OAuth (Frontend)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_web_client_id
```

### Optional
```env
PORT=3000
NODE_ENV=development
```

---

## Flow Diagrams

### Signup Flow
```
User → SignupScreen → POST /api/auth/register
  → Create User (DB)
  → Generate Verification Token
  → Send Verification Email
  → Return { user, token, emailVerified: false }
  → Navigate to VerifyEmail Screen
  → User clicks email link
  → GET /api/auth/verify-email/:token
  → Update isVerified = true
  → Navigate to EmailVerified Screen
  → Fetch fresh user profile
  → Navigate to Main
```

### Login Flow
```
User → LoginScreen → POST /api/auth/login
  → Verify Email (must be true)
  → Verify Password (Argon2id)
  → Generate JWT Token
  → Return { user, token }
  → Store token in SecureStore
  → Update auth state
  → Navigate to Main
```

### Forgot Password Flow
```
User → ForgotPasswordScreen → POST /api/auth/forgot-password
  → Find User
  → Generate Reset Token (32 bytes)
  → Hash Token (SHA-256)
  → Save to Database
  → Send Reset Email (with raw token)
  → User clicks email link
  → Deep link opens app
  → ForgotPasswordScreen (with token)
  → User enters new password
  → POST /api/auth/reset-password
  → Verify Token
  → Hash New Password
  → Update User
  → Success message
```

---

## Complete Flow Summary

### 1. Signup → Email Verification → Login
```
User Signup → Create Account → Send Verification Email (SMTP) → 
User Clicks Email Link → Verify Email → User Can Now Login
```

### 2. Login Flow
```
User Login → Check Email Verified → Verify Password → 
Check Account Lock → Generate JWT → Redirect to Dashboard
```

### 3. Forgot Password → Reset → Login
```
User Forgot Password → Request Reset → Send Reset Email (SMTP) → 
User Clicks Email Link → Reset Password Form → Update Password → 
User Can Login with New Password
```

### SMTP Email Types

| Email Type | Trigger | Token Type | Expiry | SMTP Function |
|------------|---------|-----------|--------|---------------|
| Verification | Signup | UUID v4 | 30 min | `sendVerificationEmail()` |
| Password Reset | Forgot Password | 32-byte (SHA-256 hashed) | 15 min | `sendPasswordResetEmail()` |
| Resend Verification | User Request | UUID v4 (new) | 30 min | `sendVerificationEmail()` |

---

## Summary

This documentation covers:
- ✅ **Complete signup flow** with email verification via SMTP
- ✅ **Complete login flow** with security checks and account locking
- ✅ **Forgot password flow** with SMTP email delivery
- ✅ **Password reset flow** with secure token validation
- ✅ **Email sending flow** with SMTP configuration (Nodemailer)
- ✅ **Deep linking** for mobile app integration
- ✅ **Security features** and best practices (Argon2id, token hashing, account locking)
- ✅ **API endpoints reference** with request/response examples
- ✅ **Error handling** and troubleshooting guides
- ✅ **SMTP configuration** and email templates

### Key Features

**Security:**
- Password hashing: Argon2id + pepper
- Token security: UUID for verification, SHA-256 hashed for reset
- Account locking: 5 failed attempts = 10 minute lock
- Email verification required before login
- Email enumeration protection

**SMTP Integration:**
- Nodemailer with SSL/TLS (port 465)
- HTML email templates with deep links
- SMTP connection verification on startup
- Comprehensive error logging
- Support for multiple email providers (Gmail, Hostinger, etc.)

**User Experience:**
- Deep links open app directly from email
- Clear error messages
- Generic responses for security
- Automatic token expiry handling

All flows are **production-ready** with proper error handling, security measures, and user experience considerations.

