# Signup and Post-Signup Flow - Complete Documentation

## 📋 **Overview**

This document provides a complete overview of the user signup flow and what happens after signup, including email verification, profile creation, and navigation.

---

## 🏗️ **Architecture**

```
Frontend (React Native) → Backend (Express.js) → Database (PostgreSQL) → Email (SMTP)
```

---

## 📁 **File Structure**

### **Backend Files**

1. **`backend/src/routes/auth.routes.js`**
   - Route: `POST /api/auth/register`

2. **`backend/src/controllers/auth.controller.js`**
   - `register()` - Handles signup requests

3. **`backend/src/services/auth.service.js`**
   - `register()` - Business logic for user registration

4. **`backend/src/utils/email.js`**
   - `sendVerificationEmail()` - Sends email verification link

5. **`backend/src/controllers/verify.controller.js`**
   - `verifyEmail()` - Handles email verification from email link

### **Frontend Files**

1. **`src/screens/auth/SignupScreen.tsx`**
   - Signup UI and form validation
   - Calls signup API

2. **`src/store/authStore.ts`**
   - `signup()` - Frontend signup logic
   - Manages auth state

3. **`src/screens/auth/VerifyEmailScreen.tsx`**
   - Shows verification pending screen
   - Allows resending verification email

4. **`src/screens/EmailVerifiedScreen.tsx`**
   - Handles post-verification flow
   - Refreshes profile and navigates to Main

5. **`src/navigation/AuthNavigator.tsx`**
   - Navigation stack for auth screens

6. **`src/navigation/RootNavigator.tsx`**
   - Deep link handling for email verification

---

## 🔄 **Complete Signup Flow**

### **Step 1: User Fills Signup Form**

**Location:** `src/screens/auth/SignupScreen.tsx`

**User Input:**
- Full Name
- Email
- Password (with validation)
- Confirm Password

**Password Requirements:**
- Minimum 6 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@$!%*?&._-)

**Code:**
```typescript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._-])[A-Za-z\d@$!%*?&._-]{6,}$/;

const handleSignup = async () => {
  const result = await signup(name, email, password);
  
  if (!result.emailVerified) {
    navigation.navigate('VerifyEmail', { email: result.email });
  } else {
    // Email already verified, navigate to Main
    navigation.dispatch(CommonActions.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    }));
  }
};
```

---

### **Step 2: Frontend Calls Signup API**

**Location:** `src/store/authStore.ts`

**API Call:**
```typescript
signup: async (name: string, email: string, password: string) => {
  const response = await api.post('/api/auth/register', { 
    name, 
    email, 
    password 
  });
  
  const { user, token, emailVerified } = response.data.data;
  
  // Save token to SecureStore
  await SecureStore.setItemAsync('auth_token', token);
  
  // Save email for verification flow
  await SecureStore.setItemAsync('pendingEmail', email);
  
  // Set auth state (not fully authenticated until email verified)
  set({
    user,
    token,
    isAuthenticated: false, // Not authenticated until email verified
    loading: false,
  });
  
  return { token, email, emailVerified };
}
```

**Request:**
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

---

### **Step 3: Backend Processes Registration**

**Backend Route:** `backend/src/routes/auth.routes.js`
```javascript
router.post('/register', register);
```

**Backend Controller:** `backend/src/controllers/auth.controller.js`
```javascript
export const register = async (req, res) => {
  const { email, password, name } = req.body;
  
  // Validate input
  if (!email || !password || !name) {
    return errorResponse(res, 'All fields are required', 400);
  }
  
  const result = await authService.register({ email, password, name });
  return successResponse(res, result, 'Registration successful', 201);
};
```

**Backend Service:** `backend/src/services/auth.service.js`

**Process:**
1. **Check if User Exists**
   ```javascript
   const existingUser = await prisma.user.findUnique({
     where: { email },
   });
   
   if (existingUser) {
     throw new Error('User already exists with this email');
   }
   ```

2. **Hash Password**
   ```javascript
   const pepper = process.env.PASSWORD_PEPPER;
   const hashedPassword = await argon2.hash(password + (pepper || ''), {
     type: argon2.argon2id,
     memoryCost: 2 ** 16, // 64MB
     timeCost: 3,
     parallelism: 1,
   });
   ```

3. **Create User in Database**
   ```javascript
   const user = await prisma.user.create({
     data: {
       email,
       password: hashedPassword,
       name,
       avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff`,
     },
     select: {
       id: true,
       email: true,
       name: true,
       avatar: true,
       role: true,
       createdAt: true,
     },
   });
   ```

4. **Generate Verification Token**
   ```javascript
   const verificationToken = uuidv4();
   const expires = add(new Date(), { minutes: 30 });
   
   await prisma.user.update({
     where: { id: user.id },
     data: {
       verificationToken: verificationToken,
       verificationExpires: expires,
       isVerified: false,
     },
   });
   ```

5. **Send Verification Email**
   ```javascript
   try {
     await sendVerificationEmail(user.email, verificationToken, user.name);
   } catch (emailError) {
     // Don't fail registration if email fails, just log it
     console.error('Failed to send verification email:', emailError);
   }
   ```

6. **Generate JWT Token**
   ```javascript
   const authToken = generateToken({ 
     userId: user.id, 
     email: user.email, 
     role: user.role 
   });
   ```

7. **Return Response**
   ```javascript
   return {
     user: {
       ...user,
       isVerified: false,
       emailVerified: false,
     },
     token: authToken,
     emailVerified: false,
     isVerified: false,
   };
   ```

**Response Format:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "john@example.com",
      "name": "John Doe",
      "avatar": "https://ui-avatars.com/api/?name=John+Doe&background=7c3aed&color=fff",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "isVerified": false,
      "emailVerified": false
    },
    "token": "jwt-token-here",
    "emailVerified": false,
    "isVerified": false
  }
}
```

---

### **Step 4: Verification Email Sent**

**Location:** `backend/src/utils/email.js`

**Email Content:**
- Subject: "Verify your Gretex Music Room account"
- HTML email with verification button
- Verification link: `${BACKEND_URL}/api/auth/verify-email/${token}`

**Email Link Format:**
```
http://192.168.100.40:3000/api/auth/verify-email/647be311-035f-4e46-824b-8a482d49ec8c
```

**Email Button:**
- Clicking button opens web URL
- Web URL redirects to app deep link: `gretexmusicroom://email-verified`

---

### **Step 5: User Navigates to VerifyEmail Screen**

**Location:** `src/screens/auth/SignupScreen.tsx`

**Navigation:**
```typescript
if (!result.emailVerified) {
  navigation.navigate('VerifyEmail', { email: result.email });
}
```

**VerifyEmail Screen:**
- Shows "Check your email" message
- Displays user's email address
- "Resend Verification Email" button
- "Back to Login" link

---

### **Step 6: User Clicks Email Verification Link**

**User Action:**
- Opens email on phone
- Clicks "Verify Email" button
- Link opens: `http://BACKEND_URL/api/auth/verify-email/${token}`

**Backend Route:** `backend/src/routes/auth.routes.js`
```javascript
router.get('/verify-email/:token', verifyEmail);
```

**Backend Controller:** `backend/src/controllers/verify.controller.js`
```javascript
export async function verifyEmail(req, res) {
  const { token } = req.params;
  
  // Verify email token
  await verifyEmailToken(token);
  
  // Add buffer delay for database commit
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Redirect to app deep link
  const deepLink = 'gretexmusicroom://email-verified';
  res.redirect(302, deepLink);
}
```

**Backend Service:** `backend/src/services/auth.service.js`
```javascript
async verifyEmail(token) {
  // Find user by verification token
  const user = await prisma.user.findFirst({
    where: { verificationToken: token },
  });
  
  if (!user) {
    throw new Error('Invalid verification token');
  }
  
  // Check if token expired
  if (user.verificationExpires && now > user.verificationExpires) {
    throw new Error('Verification token has expired');
  }
  
  // Check if already verified
  if (user.isVerified) {
    return { message: 'Email already verified' };
  }
  
  // Update user: set isVerified = true, clear token fields
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verificationToken: null,
      verificationExpires: null,
    },
  });
  
  return { message: 'Email verified successfully' };
}
```

---

### **Step 7: Deep Link Opens EmailVerifiedScreen**

**Location:** `src/navigation/RootNavigator.tsx`

**Deep Link Handling:**
```typescript
useEffect(() => {
  const sub = Linking.addEventListener('url', ({ url }) => {
    if (url.includes('email-verified')) {
      const error = parsed?.queryParams?.error;
      navigation.navigate('EmailVerified', error ? { error } : undefined);
    }
  });
}, [navigation]);
```

**EmailVerifiedScreen:** `src/screens/EmailVerifiedScreen.tsx`

**Process:**
1. **Initial Buffer** (1.2 seconds)
   ```typescript
   await new Promise(resolve => setTimeout(resolve, 1200));
   ```
   - Ensures backend has completed verification and DB commit

2. **Reload Auth State**
   ```typescript
   const token = await SecureStore.getItemAsync('auth_token');
   if (token) {
     useAuthStore.getState().setAuthToken(token);
   }
   ```

3. **Refresh Profile with Retry**
   ```typescript
   const result = await refreshProfileWithRetry(fetchMe, 5, 1000, 5000);
   ```
   - Retries up to 5 times with exponential backoff
   - Handles eventual consistency

4. **Fetch Username (Non-blocking)**
   ```typescript
   const username = await fetchUsernameWithRetry(fetchMe, 3, 800, 3000);
   ```
   - Safely fetches username without blocking navigation
   - Updates app state when available

5. **Final Buffer** (300ms)
   ```typescript
   await new Promise(resolve => setTimeout(resolve, 300));
   ```
   - Ensures profile state is fully propagated

6. **Clear Pending Email**
   ```typescript
   await SecureStore.deleteItemAsync('pendingEmail');
   ```

7. **Navigate to Main**
   ```typescript
   navigation.dispatch(
     CommonActions.reset({
       index: 0,
       routes: [{ name: 'Main' }],
     })
   );
   ```

---

## 📊 **Database Schema**

### **User Model**

```prisma
model User {
  id                  String       @id @default(uuid())
  email               String       @unique
  password            String
  name                String
  avatar              String?
  role                String       @default("user")
  createdAt           DateTime     @default(now())
  
  // Email Verification
  isVerified          Boolean      @default(false)
  verificationToken   String?
  verificationExpires DateTime?
  
  // Other fields...
}
```

**Status After Signup:**
- `isVerified: false`
- `verificationToken: "uuid-token"`
- `verificationExpires: Date (30 minutes from now)`

**Status After Verification:**
- `isVerified: true`
- `verificationToken: null`
- `verificationExpires: null`

---

## 🔐 **Security Features**

### **1. Password Hashing**

**Algorithm:** Argon2id
- Memory cost: 64MB
- Time cost: 3
- Parallelism: 1
- Pepper: `PASSWORD_PEPPER` from environment

### **2. Email Verification**

- UUID v4 token (128 bits)
- Expires in 30 minutes
- Single-use (cleared after verification)
- Stored hashed in database (if needed)

### **3. JWT Token**

- Generated on signup
- Contains: `userId`, `email`, `role`
- Stored in SecureStore (encrypted)
- Used for authenticated requests

---

## 📧 **Email Verification Flow**

### **Email Template**

**Subject:** "Verify your Gretex Music Room account"

**Content:**
- Personalized greeting with user's name
- "Verify Email" button
- Fallback link text
- Expiry notice (30 minutes)

**Button Link:**
```
http://BACKEND_URL/api/auth/verify-email/${token}
```

**Deep Link Redirect:**
```
gretexmusicroom://email-verified
```

---

## 🛣️ **API Endpoints**

### **1. Register**

**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { ... },
    "token": "jwt-token",
    "emailVerified": false,
    "isVerified": false
  }
}
```

### **2. Verify Email**

**Endpoint:** `GET /api/auth/verify-email/:token`

**Response:**
- Redirects to: `gretexmusicroom://email-verified`
- Or with error: `gretexmusicroom://email-verified?error=...`

### **3. Get Profile**

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer jwt-token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "john@example.com",
      "name": "John Doe",
      "avatar": "...",
      "role": "user",
      "isVerified": true
    }
  }
}
```

---

## 🔄 **Complete Flow Diagram**

```
┌─────────────────┐
│  User fills     │
│  signup form    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ POST /api/auth/register     │
│ { name, email, password }  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Backend:                    │
│ 1. Check user exists        │
│ 2. Hash password (Argon2id) │
│ 3. Create user in DB        │
│ 4. Generate verification    │
│    token (UUID)             │
│ 5. Save token to DB         │
│ 6. Send verification email  │
│ 7. Generate JWT token       │
│ 8. Return {user, token}     │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Frontend:                    │
│ 1. Save token to SecureStore │
│ 2. Save email to SecureStore │
│ 3. Set auth state            │
│    (isAuthenticated: false)  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Navigate to VerifyEmail      │
│ Screen                       │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ User receives email          │
│ Clicks "Verify Email" button │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ GET /api/auth/verify-email/ │
│ {token}                     │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Backend:                    │
│ 1. Find user by token       │
│ 2. Validate token expiry    │
│ 3. Update isVerified = true │
│ 4. Clear token fields       │
│ 5. Redirect to deep link    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Deep link opens:            │
│ gretexmusicroom://email-    │
│ verified                    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ EmailVerifiedScreen:        │
│ 1. Initial buffer (1.2s)    │
│ 2. Reload auth state        │
│ 3. Refresh profile (retry)  │
│ 4. Fetch username (async)   │
│ 5. Final buffer (300ms)     │
│ 6. Clear pending email      │
│ 7. Navigate to Main         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ User is now in Main app     │
│ (Home, Browse, Library, etc)│
└─────────────────────────────┘
```

---

## 📝 **Key Code Sections**

### **Frontend: Signup**

**File:** `src/store/authStore.ts`

```typescript
signup: async (name: string, email: string, password: string) => {
  const response = await api.post('/api/auth/register', { name, email, password });
  const { user, token, emailVerified } = response.data.data;
  
  // Save token
  await SecureStore.setItemAsync('auth_token', token);
  
  // Save email for verification flow
  await SecureStore.setItemAsync('pendingEmail', email);
  
  // Set state (not authenticated until email verified)
  set({
    user,
    token,
    isAuthenticated: false, // Key: false until verified
    loading: false,
  });
  
  return { token, email, emailVerified };
}
```

### **Backend: Registration**

**File:** `backend/src/services/auth.service.js`

```javascript
async register(userData) {
  const { email, password, name } = userData;
  
  // 1. Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('User already exists with this email');
  }
  
  // 2. Hash password
  const hashedPassword = await argon2.hash(password + pepper, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });
  
  // 3. Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff`,
    },
  });
  
  // 4. Generate verification token
  const verificationToken = uuidv4();
  const expires = add(new Date(), { minutes: 30 });
  
  // 5. Save token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationToken,
      verificationExpires: expires,
      isVerified: false,
    },
  });
  
  // 6. Send email
  await sendVerificationEmail(user.email, verificationToken, user.name);
  
  // 7. Generate JWT
  const authToken = generateToken({ userId: user.id, email: user.email, role: user.role });
  
  return { user, token: authToken, emailVerified: false };
}
```

### **Frontend: Post-Verification**

**File:** `src/screens/EmailVerifiedScreen.tsx`

```typescript
const refreshProfile = async () => {
  // 1. Initial buffer
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // 2. Reload auth state
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) {
    useAuthStore.getState().setAuthToken(token);
  }
  
  // 3. Refresh profile with retry
  const result = await refreshProfileWithRetry(fetchMe, 5, 1000, 5000);
  
  // 4. Fetch username (non-blocking)
  (async () => {
    const username = await fetchUsernameWithRetry(fetchMe, 3, 800, 3000);
    if (username) {
      // Update app state with username
      useAuthStore.setState({
        user: { ...currentUser, name: username },
      });
    }
  })();
  
  // 5. Final buffer
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // 6. Clear pending email
  await SecureStore.deleteItemAsync('pendingEmail');
  
  // 7. Navigate to Main
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    })
  );
};
```

---

## 🔍 **State Management**

### **Auth Store State**

**After Signup (Before Verification):**
```typescript
{
  user: { id, email, name, avatar, isVerified: false },
  token: "jwt-token",
  isAuthenticated: false, // Not authenticated until email verified
  loading: false,
}
```

**After Verification:**
```typescript
{
  user: { id, email, name, avatar, isVerified: true },
  token: "jwt-token",
  isAuthenticated: true, // Now fully authenticated
  loading: false,
}
```

---

## ⚙️ **Configuration**

### **Backend Environment Variables**

```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key

# Password Hashing
PASSWORD_PEPPER=your-pepper-value

# Email (SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@gretexindustries.com
SMTP_PASS=your-password
EMAIL_FROM=info@gretexindustries.com

# Backend URL (for email links)
BACKEND_URL=http://192.168.100.40:3000

# App Deep Link Scheme
APP_SCHEME=gretexmusicroom://
```

---

## 🧪 **Testing**

### **Test Signup**

```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Test123!"
}
```

**Expected Response:**
- Status: 201 Created
- Contains: `user`, `token`, `emailVerified: false`
- Verification email sent

### **Test Email Verification**

```bash
GET http://localhost:3000/api/auth/verify-email/{token}
```

**Expected:**
- Redirects to: `gretexmusicroom://email-verified`
- User `isVerified` set to `true` in database

---

## ⚠️ **Error Handling**

### **Signup Errors**

1. **Duplicate Email**
   ```json
   {
     "success": false,
     "message": "User already exists with this email"
   }
   ```

2. **Missing Fields**
   ```json
   {
     "success": false,
     "message": "All fields are required"
   }
   ```

3. **Email Send Failure**
   - Registration still succeeds
   - Token is generated
   - User can request resend

### **Verification Errors**

1. **Invalid Token**
   - Redirects to: `gretexmusicroom://email-verified?error=Invalid verification token`

2. **Expired Token**
   - Redirects to: `gretexmusicroom://email-verified?error=Verification token has expired`

3. **Already Verified**
   - Returns: `{ message: 'Email already verified' }`

---

## 📚 **Summary**

### **Signup Flow**

1. ✅ User fills signup form
2. ✅ Frontend validates password
3. ✅ Backend creates user
4. ✅ Backend sends verification email
5. ✅ Frontend navigates to VerifyEmail screen
6. ✅ User clicks email link
7. ✅ Backend verifies email
8. ✅ Deep link opens EmailVerifiedScreen
9. ✅ Profile refreshed with retry
10. ✅ Navigate to Main app

### **Key Features**

- ✅ Strong password requirements
- ✅ Argon2id password hashing
- ✅ Email verification required
- ✅ JWT token generation
- ✅ Secure token storage (SecureStore)
- ✅ Retry logic for eventual consistency
- ✅ Deep link handling
- ✅ Error handling and user feedback

### **Files Involved**

**Backend:**
- `routes/auth.routes.js`
- `controllers/auth.controller.js`
- `services/auth.service.js`
- `utils/email.js`
- `controllers/verify.controller.js`

**Frontend:**
- `screens/auth/SignupScreen.tsx`
- `store/authStore.ts`
- `screens/auth/VerifyEmailScreen.tsx`
- `screens/EmailVerifiedScreen.tsx`
- `navigation/AuthNavigator.tsx`
- `navigation/RootNavigator.tsx`

---

**This completes the signup and post-signup flow documentation!** 🎉

