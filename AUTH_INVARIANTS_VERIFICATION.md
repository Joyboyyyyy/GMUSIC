# Authentication Invariants Verification

This document verifies that all authentication invariants are correctly implemented and maintained.

---

## ✅ Signup Invariants

### ✅ Signup does NOT return a JWT
**Location:** `backend/src/services/auth.service.js:register()`
- **Status:** VERIFIED
- **Implementation:** JWT generation removed. Returns only `{ message: 'Verification email sent' }`
- **Code:**
  ```javascript
  // NO JWT generation
  return { 
    message: 'Verification email sent'
  };
  ```

### ✅ Signup creates user with isVerified = false
**Location:** `backend/src/services/auth.service.js:register()`
- **Status:** VERIFIED
- **Implementation:** Explicitly sets `isVerified: false` when creating user
- **Code:**
  ```javascript
  user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      isVerified: false, // Explicitly set to false
    },
  });
  ```

### ✅ Signup sends verification email only
**Location:** `backend/src/services/auth.service.js:register()`
- **Status:** VERIFIED
- **Implementation:** Only sends verification email, no other emails
- **Code:**
  ```javascript
  await sendVerificationEmail(user.email, rawVerificationToken, user.name);
  ```

---

## ✅ Verification Invariants

### ✅ Email verification happens BEFORE authentication
**Location:** `backend/src/services/auth.service.js:login()`
- **Status:** VERIFIED
- **Implementation:** Login checks `isVerified` before password verification
- **Code:**
  ```javascript
  // b. If not verified → reject
  if (user.isVerified === false) {
    throw new Error(genericError);
  }
  ```

### ✅ Verification endpoint returns JSON only
**Location:** `backend/src/controllers/verify.controller.js:verifyEmail()`
- **Status:** VERIFIED
- **Implementation:** POST endpoint, returns JSON via `successResponse()` or `errorResponse()`
- **Code:**
  ```javascript
  // Return JSON only - no redirects, no deep links
  return successResponse(res, result, result.message || 'Email verified successfully');
  ```

### ✅ Verification does NOT log user in
**Location:** `src/screens/EmailVerifyScreen.tsx:handleVerify()`
- **Status:** VERIFIED
- **Implementation:** Shows alert and redirects to Login screen, does NOT call login or store token
- **Code:**
  ```javascript
  Alert.alert('Email Verified', '...', [
    {
      text: 'OK',
      onPress: () => {
        // Navigate to Auth stack Login screen - DO NOT auto-login
        navigation.navigate('Auth' as never, { screen: 'Login' } as never);
      },
    },
  ]);
  ```

---

## ✅ Login Invariants

### ✅ Login order is enforced
**Location:** `backend/src/services/auth.service.js:login()`
- **Status:** VERIFIED
- **Implementation:** Exact order enforced with comments
- **Code:**
  ```javascript
  // Enforce exact order: a. Find user, b. If not verified → reject, c. If locked → reject, d. Verify password, e. Generate JWT
  
  // a. Find user
  const user = await prisma.user.findUnique({...});
  
  // b. If not verified → reject
  if (user.isVerified === false) {
    throw new Error(genericError);
  }
  
  // c. If locked → reject
  if (user.isLockedUntil && now < user.isLockedUntil) {
    throw new Error(genericError);
  }
  
  // d. Verify password
  const isPasswordValid = await argon2.verify(...);
  
  // e. Generate JWT token (only after all checks pass)
  const authToken = generateToken({...});
  ```

### ✅ JWT is issued ONLY on successful login
**Location:** `backend/src/services/auth.service.js:login()`
- **Status:** VERIFIED
- **Implementation:** JWT generation is the last step, only after all validations pass
- **Code:**
  ```javascript
  // e. Generate JWT token (only after all checks pass)
  const authToken = generateToken({ userId: user.id, email: user.email, role: user.role });
  ```

---

## ✅ Auth State Invariants

### ✅ Auth state uses status enum
**Location:** `src/store/authStore.ts`
- **Status:** VERIFIED
- **Implementation:** Status type: `'unauthenticated' | 'pending_verification' | 'authenticated'`
- **Code:**
  ```typescript
  export type AuthStatus = 'unauthenticated' | 'pending_verification' | 'authenticated';
  
  interface AuthState {
    user: User | null;
    token: string | null;
    status: AuthStatus;
    // ...
  }
  ```

### ✅ NO state where token exists but status !== authenticated
**Location:** `src/store/authStore.ts`
- **Status:** VERIFIED
- **Implementation:** Token and status are ALWAYS set together in a single `set()` call
- **Verification Points:**
  
  **1. Signup:**
  ```typescript
  set({
    user: null,
    token: null,  // ✅ Token is null
    status: 'pending_verification',
  });
  ```
  
  **2. Login:**
  ```typescript
  set({
    user,
    token: tokenString,
    status: 'authenticated',  // ✅ Token and status set together
  });
  ```
  
  **3. Init (with valid token):**
  ```typescript
  set({
    user,
    token,
    status: 'authenticated',  // ✅ Token and status set together
  });
  ```
  
  **4. Logout/Error:**
  ```typescript
  set({
    user: null,
    token: null,  // ✅ Token is null
    status: 'unauthenticated',
  });
  ```
  
  **5. setAuthToken helper:**
  ```typescript
  setAuthToken: (token: string | null) => {
    setAxiosToken(token);
    // DO NOT set token in state here - it must be set together with status
  },
  ```
  ✅ `setAuthToken` only sets token in axios, NOT in state. State is set together with status.

---

## ✅ Password Reset Invariants

### ✅ Reset tokens are hashed in DB
**Location:** `backend/src/services/auth.service.js:forgotPassword()` and `resetPassword()`
- **Status:** VERIFIED
- **Implementation:** Tokens hashed with SHA-256 before storage
- **Code:**
  ```javascript
  // Hash token with SHA-256 before storing
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  
  // Save hashed token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: hashedToken,
      resetTokenExpiry: resetTokenExpiry,
    },
  });
  ```

### ✅ Reset invalidates previous reset tokens
**Location:** `backend/src/services/auth.service.js:forgotPassword()`
- **Status:** VERIFIED
- **Implementation:** Clears previous tokens before saving new one
- **Code:**
  ```javascript
  // Invalidate any previous reset tokens before saving new one
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: null,
      resetTokenExpiry: null,
    },
  });
  ```

### ✅ Reset does NOT auto-login user
**Location:** `src/screens/auth/ResetPasswordScreen.tsx:handleResetPassword()`
- **Status:** VERIFIED
- **Implementation:** Shows success alert and navigates to Login screen
- **Code:**
  ```typescript
  Alert.alert('Success', '...', [
    {
      text: 'OK',
      onPress: () => {
        // Navigate to Login screen
        navigation.navigate('Login');
      },
    },
  ]);
  ```

---

## ✅ Deep Linking Invariants

### ✅ Backend never redirects to app
**Location:** `backend/src/controllers/verify.controller.js`
- **Status:** VERIFIED
- **Implementation:** All endpoints return JSON only, no HTML redirects
- **Code:**
  ```javascript
  // Return JSON only - no redirects, no deep links
  return successResponse(res, result, result.message || 'Email verified successfully');
  ```

### ✅ Frontend owns all navigation
**Location:** `src/navigation/RootNavigator.tsx`
- **Status:** VERIFIED
- **Implementation:** Centralized deep link handler in frontend
- **Code:**
  ```typescript
  // Centralized deep link handler
  const handleDeepLink = (url: string) => {
    const parsed = Linking.parse(url);
    
    if (url.includes('verify-email') && parsed?.queryParams?.token) {
      navigation.navigate('EmailVerify', { token });
      return;
    }
    
    if (url.includes('reset-password') && parsed?.queryParams?.token) {
      navigation.navigate('Auth', { 
        screen: 'ResetPassword',
        params: { token }
      });
      return;
    }
  };
  ```

### ✅ Deep links only map URLs → screens
**Location:** `src/navigation/RootNavigator.tsx`
- **Status:** VERIFIED
- **Implementation:** Deep link handler only performs navigation, no business logic
- **Code:**
  ```typescript
  // Maps: verify-email?token=... → EmailVerify screen
  // Maps: reset-password?token=... → ResetPassword screen
  ```

---

## Summary

✅ **All 15 invariants are correctly implemented and maintained.**

### Key Safety Measures:

1. **Token-State Coupling:** Token and status are ALWAYS set together in a single `set()` call
2. **No Partial States:** `setAuthToken()` only sets token in axios, never in state alone
3. **Explicit Status:** Status enum prevents ambiguous states
4. **Backend JSON Only:** All endpoints return JSON, no redirects
5. **Frontend Navigation:** All navigation decisions made in frontend
6. **Verification First:** Login enforces verification check before password validation

### Files That Enforce Invariants:

- `backend/src/services/auth.service.js` - Business logic invariants
- `backend/src/controllers/auth.controller.js` - API response invariants
- `backend/src/controllers/verify.controller.js` - JSON-only responses
- `src/store/authStore.ts` - State management invariants
- `src/screens/EmailVerifyScreen.tsx` - No auto-login after verification
- `src/screens/auth/ResetPasswordScreen.tsx` - No auto-login after reset
- `src/navigation/RootNavigator.tsx` - Frontend navigation ownership

---

**Last Verified:** 2024  
**Status:** All Invariants Maintained ✅

