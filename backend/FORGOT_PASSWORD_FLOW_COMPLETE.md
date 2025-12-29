# Forgot Password Flow - Complete File Details

This document provides a comprehensive overview of all files involved in the forgot password flow.

---

## 📋 **Flow Overview**

1. **User requests password reset** → Frontend calls `POST /api/auth/forgot-password`
2. **Backend generates reset token** → Saves hashed token to database
3. **Backend sends email** → Email contains reset link
4. **User clicks email link** → Opens HTML form served by backend
5. **User submits new password** → Backend validates token and updates password

---

## 📁 **File Structure**

```
backend/
├── src/
│   ├── routes/
│   │   └── auth.routes.js          # Route definitions
│   ├── controllers/
│   │   └── auth.controller.js       # Request handlers
│   ├── services/
│   │   └── auth.service.js          # Business logic
│   ├── utils/
│   │   └── email.js                 # Email sending utility
│   └── app.js                       # Express app setup
├── prisma/
│   └── schema.prisma                # Database schema
└── .env                             # Environment variables

frontend/
└── src/
    └── screens/
        └── auth/
            └── ForgotPasswordScreen.tsx  # Frontend UI
```

---

## 🔧 **1. Routes** (`backend/src/routes/auth.routes.js`)

**Purpose:** Defines API endpoints for forgot password flow

**Key Routes:**
```javascript
router.post('/forgot-password', forgotPassword);      // Step 1: Request reset
router.get('/reset-password', resetPasswordGet);      // Step 2: Show reset form
router.post('/reset-password', resetPassword);        // Step 3: Process reset
router.get('/test-email', testEmail);                 // Diagnostic route
```

**Full Code:**
```javascript
import express from 'express';
import { 
  forgotPassword, 
  resetPassword, 
  resetPasswordGet, 
  testEmail 
} from '../controllers/auth.controller.js';

const router = express.Router();

// Public routes
router.post('/forgot-password', forgotPassword);
router.get('/reset-password', resetPasswordGet);
router.post('/reset-password', resetPassword);
router.get('/test-email', testEmail);

export default router;
```

**Mounted in:** `backend/src/app.js` at `/api/auth`

---

## 🎮 **2. Controllers** (`backend/src/controllers/auth.controller.js`)

**Purpose:** Handle HTTP requests and responses

### **2.1. `forgotPassword` Controller** (Lines 80-101)

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If your email is registered, you will receive a reset link."
}
```

**Key Features:**
- ✅ Always returns success (email enumeration protection)
- ✅ Validates email is provided
- ✅ Delegates to `authService.forgotPassword()`
- ✅ Returns generic message even on error

**Code:**
```javascript
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('[Auth Controller] Forgot password requested');

    if (!email) {
      return errorResponse(res, 'Email is required', 400);
    }

    const result = await authService.forgotPassword(email);
    
    // Always return success to prevent email enumeration
    return successResponse(res, result, result.message);
  } catch (error) {
    // Return success even on error to prevent email enumeration
    return successResponse(res, {
      message: 'If your email is registered, you will receive a reset link.',
    });
  }
};
```

---

### **2.2. `resetPasswordGet` Controller** (Lines 103-239)

**Endpoint:** `GET /api/auth/reset-password?token=TOKEN`

**Purpose:** Serves HTML form when user clicks email link

**Response:** HTML page with password reset form

**Key Features:**
- ✅ Validates token is present in query string
- ✅ Serves embedded HTML form with JavaScript
- ✅ Form submits to `POST /api/auth/reset-password`
- ✅ Client-side password validation
- ✅ Shows success/error messages

**Code:**
```javascript
export const resetPasswordGet = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send(/* HTML error page */);
    }

    // Serve HTML form for password reset
    return res.send(/* HTML form with embedded JavaScript */);
  } catch (error) {
    return res.status(500).send(/* HTML error page */);
  }
};
```

**HTML Form Features:**
- Password input with validation
- Confirm password input
- Submit button with loading state
- Error/success message display
- Client-side password matching check

---

### **2.3. `resetPassword` Controller** (Lines 241-256)

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "token": "raw_reset_token_from_email",
  "password": "NewPassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

**Code:**
```javascript
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return errorResponse(res, 'Token and password are required', 400);
    }

    const result = await authService.resetPassword(token, password);
    
    return successResponse(res, result, result.message);
  } catch (error) {
    return errorResponse(res, error.message || 'Password reset failed', 400);
  }
};
```

---

### **2.4. `testEmail` Controller** (Lines 258-281)

**Endpoint:** `GET /api/auth/test-email`

**Purpose:** Diagnostic route to test SMTP independently

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "to": "test@example.com"
}
```

**Code:**
```javascript
export const testEmail = async (req, res) => {
  try {
    const { sendPasswordResetEmail } = await import('../utils/email.js');
    const testEmailAddress = process.env.TEST_EMAIL || process.env.SMTP_USER || 'your@email.com';
    
    console.log('[Test Email] Sending test password reset email to:', testEmailAddress);
    await sendPasswordResetEmail(testEmailAddress, 'TEST_TOKEN_123');
    
    return res.json({ 
      success: true, 
      message: 'Test email sent successfully',
      to: testEmailAddress
    });
  } catch (err) {
    console.error('❌ Test email failed', err);
    return res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};
```

---

## 🧠 **3. Services** (`backend/src/services/auth.service.js`)

**Purpose:** Contains business logic for password reset

### **3.1. `forgotPassword` Method** (Lines 268-336)

**Flow:**
1. Find user by email
2. If user not found → Return generic success (security)
3. Generate 32-byte random token
4. Hash token with SHA-256
5. Set expiry to 15 minutes from now
6. Save hashed token and expiry to database
7. Send email with raw token (for link)
8. Return generic success message

**Key Security Features:**
- ✅ Email enumeration protection (always returns success)
- ✅ Token hashed before storage (SHA-256)
- ✅ Token expires in 15 minutes
- ✅ Previous tokens invalidated

**Code:**
```javascript
async forgotPassword(email) {
  console.log(`[Auth Service] Forgot password flow started for email: ${email}`);
  
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  // Don't reveal if user exists or not (security best practice)
  if (!user) {
    console.log(`[Auth Service] User not found for email: ${email} (returning generic success)`);
    return { message: 'If your email is registered, you will receive a reset link.' };
  }

  console.log(`[Auth Service] User found`);
  
  // Generate random token (32 bytes = 256 bits)
  const rawToken = crypto.randomBytes(32).toString('hex');
  console.log(`[Auth Service] Reset token generated`);
  
  // Hash token with SHA-256 before storing
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  
  // Set expiry to 15 minutes from now
  const resetTokenExpiry = add(new Date(), { minutes: 15 });

  // Update user with reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: hashedToken,
      resetTokenExpiry: resetTokenExpiry,
    },
  });

  console.log(`[Auth Service] Reset token saved to database`);
  console.log(`[Auth Service] Sending reset email`);
  
  // Send password reset email with raw token (for the link)
  try {
    await sendPasswordResetEmail(user.email, rawToken);
    console.log(`[Auth Service] ✅ Password reset email sent successfully`);
  } catch (emailError) {
    console.error('❌ [Auth Service] FAILED TO SEND PASSWORD RESET EMAIL');
    // Don't fail the request if email fails, just log it
    // Still return success to prevent email enumeration
  }
  
  return { message: 'If your email is registered, you will receive a reset link.' };
}
```

---

### **3.2. `resetPassword` Method** (Lines 338-420)

**Flow:**
1. Hash provided token with SHA-256
2. Find user with matching hashed token
3. Validate token hasn't expired
4. Validate password strength (server-side)
5. Hash new password with Argon2id + pepper
6. Update password in database
7. Clear reset token and expiry
8. Reset failed login attempts

**Password Validation Rules:**
- Minimum 6 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Code:**
```javascript
async resetPassword(token, newPassword) {
  console.log(`[Auth Service] Reset password flow started, validating token`);
  
  // Hash the provided token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with matching reset token
  const user = await prisma.user.findFirst({
    where: { resetToken: hashedToken },
    select: { id: true, resetTokenExpiry: true },
  });

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }
  
  // Check if token has expired
  const now = new Date();
  if (!user.resetTokenExpiry || now > user.resetTokenExpiry) {
    // Clear expired token
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: null, resetTokenExpiry: null },
    });
    throw new Error('Reset token has expired. Please request a new one.');
  }

  // Validate password strength server-side
  if (newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  if (!/[A-Z]/.test(newPassword)) {
    throw new Error('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(newPassword)) {
    throw new Error('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(newPassword)) {
    throw new Error('Password must contain at least one number');
  }
  if (!/[^A-Za-z0-9]/.test(newPassword)) {
    throw new Error('Password must contain at least one special character');
  }

  // Hash new password with Argon2id
  const pepper = process.env.PASSWORD_PEPPER;
  const hashedPassword = await argon2.hash(newPassword + pepper, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64MB
    timeCost: 3,
    parallelism: 1,
  });

  // Update password and clear reset token fields
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
      failedLoginAttempts: 0,
      isLockedUntil: null,
      lastFailedLogin: null,
    },
  });

  console.log(`[Auth Service] Password reset successful for userId=${user.id}`);
  
  return { message: 'Password reset successfully' };
}
```

---

## 📧 **4. Email Utility** (`backend/src/utils/email.js`)

**Purpose:** Handles SMTP configuration and email sending

### **4.1. SMTP Configuration** (Lines 4-12)

**Configuration:**
```javascript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,        // e.g., smtp.hostinger.com
  port: Number(process.env.SMTP_PORT), // 465
  secure: true,                        // Hardcoded for port 465
  auth: {
    user: process.env.SMTP_USER,       // e.g., info@gretexindustries.com
    pass: process.env.SMTP_PASS,       // SMTP password
  },
});
```

**SMTP Verification on Startup:**
```javascript
(async () => {
  try {
    await transporter.verify();
    console.log("✅ SMTP transporter verified");
  } catch (error) {
    console.error("[Email] SMTP verification failed:", error);
  }
})();
```

---

### **4.2. `sendPasswordResetEmail` Function** (Lines 123-226)

**Purpose:** Sends password reset email with reset link

**Parameters:**
- `email` (string): Recipient email address
- `token` (string): Raw reset token (not hashed)

**Email Content:**
- Subject: "Reset your password"
- HTML template with styled button
- Reset link: `${BACKEND_URL}/api/auth/reset-password?token=${token}`
- Expiry notice: "This link will expire in 15 minutes"

**Flow:**
1. Log function call and token length
2. Check SMTP configuration
3. Verify SMTP connection
4. Validate `BACKEND_URL` is set
5. Build reset URL
6. Generate HTML email template
7. Send email via Nodemailer
8. Log success/failure

**Code:**
```javascript
export const sendPasswordResetEmail = async (email, token) => {
  console.log(`[Email] 📧 sendPasswordResetEmail called for: ${email}`);
  
  // Check SMTP configuration
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error(`Missing SMTP configuration`);
  }
  
  // Verify SMTP connection before sending
  try {
    await transporter.verify();
    console.log("[Email] ✅ SMTP transporter verified successfully");
  } catch (error) {
    throw new Error(`SMTP verification failed: ${error.message}`);
  }
  
  // Use BACKEND_URL from environment - must be set
  if (!process.env.BACKEND_URL) {
    throw new Error('BACKEND_URL environment variable is required');
  }
  
  const backendUrl = process.env.BACKEND_URL.trim().replace(/\/+$/, '');
  const resetUrl = `${backendUrl}/api/auth/reset-password?token=${encodeURIComponent(token)}`;
  
  // Generate HTML email template
  const html = `/* HTML email template with reset link */`;
  
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Reset your password",
      html,
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log("📨 RESET EMAIL SENT TO:", email, info.messageId);
    return info;
  } catch (err) {
    console.error("❌ RESET EMAIL FAILED");
    console.error("❌ Error message:", err.message);
    throw err;
  }
};
```

---

## 🗄️ **5. Database Schema** (`backend/prisma/schema.prisma`)

**Purpose:** Defines database structure for reset tokens

**User Model Fields:**
```prisma
model User {
  id                  String       @id @default(uuid())
  email               String       @unique
  password            String
  resetToken          String?      // Hashed reset token (SHA-256)
  resetTokenExpiry    DateTime?    // Token expiration time
  // ... other fields
}
```

**Key Points:**
- `resetToken`: Stores SHA-256 hash of the reset token (not raw token)
- `resetTokenExpiry`: Stores expiration datetime (15 minutes from generation)
- Both fields are nullable (optional)
- Token is cleared after successful password reset

---

## 🎨 **6. Frontend** (`src/screens/auth/ForgotPasswordScreen.tsx`)

**Purpose:** User interface for requesting password reset

**Features:**
- Email input field
- Submit button with loading state
- Success message (always shown, regardless of email existence)
- Error handling (shows success message even on error)

**Code:**
```typescript
const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      return Alert.alert("Error", "Please enter your email address.");
    }

    setLoading(true);
    setSuccess(false);

    try {
      await api.post("/api/auth/forgot-password", { email: email.trim() });
      setSuccess(true);
      Alert.alert(
        "Success",
        "If your email is registered, you will receive a reset link."
      );
    } catch (error: any) {
      // Always show success to prevent email enumeration
      setSuccess(true);
      Alert.alert(
        "Success",
        "If your email is registered, you will receive a reset link."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Email input and submit button */}
    </View>
  );
};
```

**API Call:**
- Endpoint: `POST /api/auth/forgot-password`
- Body: `{ "email": "user@example.com" }`
- Always shows success message (email enumeration protection)

---

## ⚙️ **7. Express App Setup** (`backend/src/app.js`)

**Purpose:** Mounts auth routes

**Code:**
```javascript
import authRoutes from './routes/auth.routes.js';

// Mount auth routes
app.use('/api/auth', authRoutes);
```

**Result:** All auth routes are accessible at `/api/auth/*`

---

## 🔐 **8. Environment Variables** (`.env`)

**Required Variables:**
```env
# SMTP Configuration
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@gretexindustries.com
SMTP_PASS=your_smtp_password
EMAIL_FROM=info@gretexindustries.com

# Backend URL (for email links)
BACKEND_URL=http://192.168.100.40:3000

# Optional: Test email address
TEST_EMAIL=your@email.com

# Password hashing
PASSWORD_PEPPER=your_pepper_value
```

---

## 🔄 **Complete Flow Diagram**

```
┌─────────────────┐
│  User enters    │
│  email in app   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ POST /api/auth/forgot-      │
│ password                    │
│ { email: "user@example.com" }│
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ auth.controller.js          │
│ forgotPassword()            │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ auth.service.js             │
│ forgotPassword()            │
│ 1. Find user                │
│ 2. Generate token           │
│ 3. Hash token (SHA-256)     │
│ 4. Save to DB               │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ email.js                    │
│ sendPasswordResetEmail()    │
│ 1. Verify SMTP              │
│ 2. Build reset URL          │
│ 3. Send email               │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ User receives email         │
│ Clicks reset link           │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ GET /api/auth/reset-        │
│ password?token=TOKEN        │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ auth.controller.js          │
│ resetPasswordGet()          │
│ Serves HTML form            │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ User enters new password    │
│ Submits form                │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ POST /api/auth/reset-       │
│ password                    │
│ { token, password }         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ auth.controller.js          │
│ resetPassword()             │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ auth.service.js             │
│ resetPassword()             │
│ 1. Hash token               │
│ 2. Find user                │
│ 3. Validate expiry          │
│ 4. Validate password        │
│ 5. Hash password (Argon2id) │
│ 6. Update DB                │
│ 7. Clear token              │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Password reset successful!  │
└─────────────────────────────┘
```

---

## 🔒 **Security Features**

1. **Email Enumeration Protection**
   - Always returns generic success message
   - Doesn't reveal if email exists in database

2. **Token Security**
   - 32-byte random token (256 bits)
   - Hashed with SHA-256 before storage
   - Expires in 15 minutes
   - Single-use (cleared after reset)

3. **Password Security**
   - Hashed with Argon2id + pepper
   - Server-side validation
   - Strong password requirements

4. **SMTP Security**
   - Secure connection (port 465, TLS)
   - SMTP verification before sending
   - Error logging for debugging

---

## 🧪 **Testing**

### **Test 1: SMTP Diagnostic**
```bash
GET http://localhost:3000/api/auth/test-email
```

### **Test 2: Forgot Password**
```bash
POST http://localhost:3000/api/auth/forgot-password
Content-Type: application/json

{
  "email": "amitg.gretex@gmail.com"
}
```

### **Test 3: Reset Password**
```bash
# 1. Get token from email link
# 2. Visit: http://localhost:3000/api/auth/reset-password?token=TOKEN
# 3. Submit form with new password
```

---

## 📝 **Summary**

**Files Involved:**
1. ✅ `backend/src/routes/auth.routes.js` - Route definitions
2. ✅ `backend/src/controllers/auth.controller.js` - Request handlers
3. ✅ `backend/src/services/auth.service.js` - Business logic
4. ✅ `backend/src/utils/email.js` - Email sending
5. ✅ `backend/prisma/schema.prisma` - Database schema
6. ✅ `backend/src/app.js` - Route mounting
7. ✅ `src/screens/auth/ForgotPasswordScreen.tsx` - Frontend UI

**Key Endpoints:**
- `POST /api/auth/forgot-password` - Request reset
- `GET /api/auth/reset-password?token=TOKEN` - Show form
- `POST /api/auth/reset-password` - Process reset
- `GET /api/auth/test-email` - Test SMTP

**Security:**
- Email enumeration protection
- Token hashing and expiration
- Strong password requirements
- Secure SMTP connection

