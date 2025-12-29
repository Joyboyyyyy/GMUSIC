# Email Verification Flow - Complete File Analysis

## 🔴 1️⃣ Backend Route & Controller

### Route File: `backend/src/routes/auth.routes.js`
```javascript
import express from 'express';
import { register, login, googleLogin, getProfile, updateProfile, forgotPassword, resetPassword, resetPasswordGet, testEmail } from '../controllers/auth.controller.js';
import { verifyEmail, verifyEmailGet } from '../controllers/verify.controller.js';
import { checkVerification, resendVerification } from '../controllers/verification.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password', resetPasswordGet);
router.get('/reset-password/:token', resetPasswordGet);
router.post('/reset-password', resetPassword);
router.get('/verify-email', verifyEmailGet); // GET for email links (verifies and redirects to app)
router.post('/verify-email', verifyEmail); // POST for app API calls (returns JSON)
router.get('/check-verification', checkVerification);
router.post('/resend-verification', resendVerification);
router.post('/test-email', testEmail);

// Protected routes
router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);

export default router;
```

**Route Mounting**: `app.use('/api/auth', authRoutes)` in `app.js`
**Full Path**: `GET /api/auth/verify-email?token=...`

---

### Controller: `backend/src/controllers/verify.controller.js`
```javascript
import authService from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * GET /api/auth/verify-email?token=...
 * Verifies email token and redirects to app deep link
 * This endpoint is called from email links (HTTPS) and redirects to app
 */
export async function verifyEmailGet(req, res) {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      console.error('[Verify Controller] GET: No token provided');
      // Redirect to app with error
      const appScheme = (process.env.APP_SCHEME || 'gretexmusicroom').trim().split('://')[0].replace(/\/+$/, '').trim();
      const deepLink = `${appScheme}://verify-email?error=${encodeURIComponent('Verification token is required')}`;
      return res.redirect(302, deepLink);
    }
    
    console.log('[Verify Controller] GET: Email verification request received for token (length:', token.length, ')');
    
    try {
      // Verify the token (idempotent - if already verified, still succeeds)
      const result = await authService.verifyEmail(token);
      console.log('[Verify Controller] GET: Email verification result:', result.message);
      
      // Get app scheme for deep link
      const appScheme = (process.env.APP_SCHEME || 'gretexmusicroom').trim().split('://')[0].replace(/\/+$/, '').trim();
      
      // Redirect to email-verified (not verify-email) - backend already verified, app just needs to navigate
      // This prevents double verification and race conditions
      const deepLink = `${appScheme}://email-verified`;
      
      // Redirect to app deep link
      return res.redirect(302, deepLink);
      
    } catch (verifyError) {
      // Verification failed - redirect to app with error
      console.error('[Verify Controller] GET: Verification failed:', verifyError.message);
      const appScheme = (process.env.APP_SCHEME || 'gretexmusicroom').trim().split('://')[0].replace(/\/+$/, '').trim();
      const errorMessage = verifyError.message || 'Verification failed';
      const deepLink = `${appScheme}://email-verified?error=${encodeURIComponent(errorMessage)}`;
      
      return res.redirect(302, deepLink);
    }
    
  } catch (error) {
    console.error('[Verify Controller] GET: Unexpected error:', error);
    // On unexpected error, still redirect to app
    const appScheme = (process.env.APP_SCHEME || 'gretexmusicroom').trim().split('://')[0].replace(/\/+$/, '').trim();
    const deepLink = `${appScheme}://verify-email?error=${encodeURIComponent('Verification failed')}`;
    return res.redirect(302, deepLink);
  }
}

/**
 * POST /api/auth/verify-email
 * Verifies email token (called from app)
 * Returns JSON response for app to handle
 */
export async function verifyEmail(req, res) {
  try {
    // Extract token from request body (POST endpoint)
    const { token } = req.body;
    
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      console.error('[Verify Controller] POST: No token provided or invalid token');
      return errorResponse(res, 'Verification token is required', 400);
    }
    
    console.log('[Verify Controller] POST: Email verification request received for token (length:', token.length, ')');
    
    // Verify the token with the service
    const result = await authService.verifyEmail(token);
    console.log('[Verify Controller] POST: Email verified successfully');
    
    // Return JSON only - no redirects, no deep links
    return successResponse(res, result, result.message || 'Email verified successfully');
    
  } catch (error) {
    // Handle verification errors
    const errorMessage = error.message || 'Verification failed';
    console.error('[Verify Controller] POST: Email verification error:', errorMessage);
    
    // Return JSON error response
    return errorResponse(res, errorMessage, 400);
  }
}
```

**Key Points**:
- ✅ GET endpoint verifies token and redirects to `gretexmusicroom://email-verified`
- ✅ Idempotent: Already verified emails return success
- ✅ Error handling: Redirects to app with error parameter
- ⚠️ **ISSUE**: Line 52 redirects to `verify-email?error=...` instead of `email-verified?error=...` (inconsistent)

---

## 🔴 2️⃣ Backend Email Link Generation

### Email Utility: `backend/src/utils/email.js` (sendVerificationEmail function)
```javascript
export async function sendVerificationEmail(to, token, name) {
  try {
    // Use HTTPS link in email for reliable clickability in all email clients
    // Email clients (Gmail, Outlook, Apple Mail) block custom scheme links
    // HTTPS link will redirect to app deep link via GET /api/auth/verify-email endpoint
    const backendUrlRaw = getEnvVar('BACKEND_URL', '');
    
    if (!backendUrlRaw) {
      console.error('[Email] ❌ BACKEND_URL not configured - cannot send verification email');
      return;
    }
    
    const backendUrl = backendUrlRaw.trim().replace(/\/+$/, '');
    const verifyLink = `${backendUrl}/api/auth/verify-email?token=${encodeURIComponent(token || '')}`;
    
    console.log("📧 Verification email HTTPS link:", verifyLink);

    const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto; margin:0; padding:0; background:#f5f6f8; }
          .box { max-width:600px; margin:30px auto; background:white; border-radius:8px; padding:24px; }
          .title { font-size:22px; font-weight:600; margin-bottom:12px; }
          .text { color:#444; margin-bottom:20px; line-height:1.5; }
          .foot { margin-top:20px; color:#666; font-size:13px; word-break:break-all; }
        </style>
      </head>
      <body>
        <div class="box">
          <div class="title">Verify your email</div>
          <div class="text">
            ${name ? `Hi ${name},` : 'Hello,'}<br/>
            Please confirm your email to complete your Gretex Music Room signup.
          </div>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;">
            <tr>
              <td align="center" style="background:#5b21b6; border-radius:8px;">
                <a href="${verifyLink}" style="display:inline-block; padding:14px 22px; background:#5b21b6; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600; font-size:16px;">Verify Email</a>
              </td>
            </tr>
          </table>
          <div class="foot">
            <p>If the button does not work, copy and paste this link into your browser:</p>
            <p style="font-family:monospace; background:#f3f4f6; padding:8px; border-radius:4px; word-break:break-all;">${verifyLink}</p>
            <p style="margin-top:8px; font-size:12px; color:#9ca3af;">Clicking this link will open the Gretex Music Room app to verify your email.</p>
          </div>
        </div>
      </body>
    </html>
  `;
    // ... rest of email sending logic
  }
}
```

**Key Points**:
- ✅ Uses `BACKEND_URL` environment variable
- ✅ Generates HTTPS link: `${BACKEND_URL}/api/auth/verify-email?token=...`
- ✅ Link is clickable in all email clients
- ⚠️ **POTENTIAL ISSUE**: If `BACKEND_URL` is not set or is local IP (192.168.x.x), links won't work from external devices

---

## 🔴 3️⃣ Backend Environment Variables

### Required Environment Variables (from code analysis):

```env
# Required for email verification
BACKEND_URL=https://your-domain.com
# OR for local dev with ngrok:
# BACKEND_URL=https://your-ngrok-url.ngrok.io

# Required for deep link redirects
APP_SCHEME=gretexmusicroom

# Optional
NODE_ENV=development
# OR
NODE_ENV=production
```

**Key Points**:
- ⚠️ **CRITICAL**: `BACKEND_URL` must be publicly accessible (not localhost or 192.168.x.x)
- ✅ `APP_SCHEME` defaults to `gretexmusicroom` if not set
- ⚠️ If `BACKEND_URL` is missing, email sending fails silently

---

## 🟠 4️⃣ Frontend Deep Link Handling

### Root Navigator: `src/navigation/RootNavigator.tsx`
```javascript
const RootNavigator = () => {
  const navigation = useNavigation<RootNav>();
  const { user, status } = useAuthStore();

  // Centralized deep link handler
  const handleDeepLink = (url: string) => {
    const parsed = Linking.parse(url);
    
    // Handle verify-email deep link
    if (url.includes('verify-email') && parsed?.queryParams?.token) {
      const token = parsed.queryParams.token as string;
      console.log('[Deep Link] Verify email token received');
      navigation.navigate('EmailVerify', { token });
      return;
    }
    
    // Handle reset-password deep link - navigate to ResetPassword screen directly
    if (url.includes('reset-password') && parsed?.queryParams?.token) {
      const token = parsed.queryParams.token as string;
      console.log('[Deep Link] Reset password token received');
      navigation.navigate('Auth', { 
        screen: 'ResetPassword',
        params: { token }
      });
      return;
    }
    
    // Handle email-verified deep link (legacy, may not be used)
    if (url.includes('email-verified')) {
      const error = parsed?.queryParams?.error as string | undefined;
      navigation.navigate('EmailVerified', error ? { error } : undefined);
      return;
    }
  };

  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle initial URL (when app opens from deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => sub.remove();
  }, [navigation]);
  
  // ... rest of navigator
};
```

**Key Points**:
- ✅ Handles `email-verified` deep link (no token needed)
- ✅ Handles `verify-email?token=...` deep link (legacy, may not be used)
- ✅ Cold start handling with `Linking.getInitialURL()`
- ⚠️ **POTENTIAL ISSUE**: `verify-email?token=...` handler still exists but backend redirects to `email-verified` (mismatch)

---

## 🟠 5️⃣ Frontend Email Verification Screen

### EmailVerify Screen: `src/screens/EmailVerifyScreen.tsx`
```javascript
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import api from '../utils/api';

type EmailVerifyScreenRouteProp = RouteProp<{ EmailVerify: { token?: string } }, 'EmailVerify'>;

export default function EmailVerifyScreen() {
  const navigation = useNavigation();
  const route = useRoute<EmailVerifyScreenRouteProp>();
  const token = route?.params?.token;

  async function handleVerify(t: string) {
    try {
      console.log('[EmailVerifyScreen] Verifying token...');
      // POST to verify-email endpoint with token in body
      const response = await api.post('/api/auth/verify-email', { token: t });
      
      console.log('[EmailVerifyScreen] Verification successful:', response.data);
      
      // On success, redirect to Login screen without showing alert
      // This provides smoother UX - user can immediately login
      navigation.navigate('Auth' as never, { screen: 'Login' } as never);
    } catch (e: any) {
      console.error('[EmailVerifyScreen] Verification failed:', e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Verification failed. Please try again.';
      Alert.alert(
        'Verification Failed', 
        errorMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to Login screen so user can try again or resend email
              navigation.navigate('Auth' as never, { screen: 'Login' } as never);
            },
          },
        ]
      );
    }
  }

  useEffect(() => {
    if (token) {
      handleVerify(token);
      return;
    }

    Linking.getInitialURL().then((url) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      const t = parsed?.queryParams?.token as string;
      if (t) handleVerify(t);
    });
  }, [token]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.text}>Verifying...</Text>
    </View>
  );
}
```

**Key Points**:
- ⚠️ **ISSUE**: This screen calls POST `/api/auth/verify-email` which causes double verification
- ⚠️ **ISSUE**: Backend already verified in GET endpoint, but this screen tries to verify again
- ⚠️ **ISSUE**: Does NOT restore intended destination
- ⚠️ **ISSUE**: Always navigates to Login, ignoring stored redirect

---

## 🟠 6️⃣ Frontend - Where "Last Location" is Stored

### Signup Screen: `src/screens/auth/SignupScreen.tsx` (handleSignup function)
```javascript
const handleSignup = async () => {
  try {
    console.log('[SignupScreen] Starting signup process');
    
    // Store intended destination before signup (user wants to go to Main/Home after verification)
    // This ensures we can restore their navigation after email verification
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(
      'postAuthRedirect',
      JSON.stringify({
        route: 'Main',
        screen: 'Home', // Default to Home screen after verification
      })
    );
    console.log('[SignupScreen] Stored intended destination: Main/Home');
    
    const result = await signup(name, email, password);
    
    console.log('[SignupScreen] Signup result:', { 
      email: result.email
    });
    
    // After signup, always navigate to VerifyEmail screen
    // NO token is stored, status is 'pending_verification'
    console.log('[SignupScreen] Navigating to VerifyEmail');
    navigation.navigate('VerifyEmail', { email: result.email });
  } catch (e: any) {
    // Show clear error message
    const errorMessage = e.message || 'Signup failed. Please try again.';
    console.error('[SignupScreen] Signup error:', errorMessage, e);
    Alert.alert('Signup Failed', errorMessage);
  }
};
```

**Key Points**:
- ✅ Stores in AsyncStorage under key: `postAuthRedirect`
- ✅ Format: `{ route: 'Main', screen: 'Home' }`
- ✅ Stored BEFORE signup completes
- ✅ Persists across app restarts

### EmailVerified Screen: `src/screens/EmailVerifiedScreen.tsx` (restoration logic)
```javascript
// Restore user's intended destination (stored before signup/verification)
console.log('[EmailVerifiedScreen] Checking for intended destination');
const redirectData = await AsyncStorage.getItem(POST_AUTH_REDIRECT_KEY);

// If user is logged in, navigate to intended destination or Main
if (token) {
  if (redirectData) {
    try {
      const { route, screen } = JSON.parse(redirectData);
      console.log('[EmailVerifiedScreen] Restoring intended destination:', { route, screen });
      
      // Clear the stored redirect
      await AsyncStorage.removeItem(POST_AUTH_REDIRECT_KEY);
      
      // Navigate to intended destination
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: route,
              params: screen ? { screen } : undefined,
            },
          ],
        })
      );
      return;
    } catch (parseError) {
      console.error('[EmailVerifiedScreen] Failed to parse redirect data:', parseError);
      // Fall through to default navigation
    }
  }

  // Default: Navigate to Main (Home screen)
  console.log('[EmailVerifiedScreen] No intended destination, navigating to Main');
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    })
  );
} else {
  // User not logged in - navigate to Login
  // Store redirect so after login they go to intended destination
  console.log('[EmailVerifiedScreen] User not logged in, navigating to Login');
  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ 
        name: 'Auth',
        params: { screen: 'Login' },
      }],
    })
  );
}
```

**Key Points**:
- ✅ Reads from AsyncStorage key: `postAuthRedirect`
- ✅ Restores navigation if user is logged in
- ✅ Clears redirect after use
- ⚠️ **ISSUE**: Only works if user reaches `EmailVerifiedScreen`, but flow goes through `EmailVerifyScreen` first

---

## 🟡 7️⃣ Expo Configuration

### app.json
```json
{
  "expo": {
    "name": "Gretex Music Room",
    "slug": "gretex-music-room",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "gretexmusicroom",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#5b21b6"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.gretexmusicroom.app",
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["gretexmusicroom"]
          }
        ]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#5b21b6"
      },
      "package": "com.gretexmusicroom.app",
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "gretexmusicroom"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

**Key Points**:
- ✅ Scheme correctly configured: `gretexmusicroom`
- ✅ iOS and Android deep linking properly set up
- ✅ No issues detected

---

## 🔍 IDENTIFIED ISSUES

### Issue 1: Double Verification
- **Problem**: Backend GET endpoint verifies email, but `EmailVerifyScreen` tries to verify again via POST
- **Impact**: Unnecessary API call, potential race conditions
- **Fix**: `EmailVerifyScreen` should NOT be used for email-verified flow. Only `EmailVerifiedScreen` should handle it.

### Issue 2: Wrong Screen Navigation
- **Problem**: Backend redirects to `email-verified`, but `EmailVerifyScreen` is still in the flow
- **Impact**: User goes through wrong screen, doesn't restore intended destination
- **Fix**: Ensure `email-verified` deep link goes directly to `EmailVerifiedScreen`

### Issue 3: Inconsistent Error Redirect
- **Problem**: Line 52 in `verify.controller.js` redirects to `verify-email?error=...` instead of `email-verified?error=...`
- **Impact**: Error handling goes to wrong screen
- **Fix**: Change error redirect to use `email-verified?error=...`

### Issue 4: Missing BACKEND_URL Check
- **Problem**: If `BACKEND_URL` is not set or is local IP, emails won't work
- **Impact**: Email links fail silently
- **Fix**: Add validation and clear error messages

---

## ✅ RECOMMENDED FIXES

1. **Fix error redirect in verify.controller.js** (line 52)
2. **Remove EmailVerifyScreen from email-verified flow** (backend already verified)
3. **Ensure EmailVerifiedScreen is the only handler for email-verified deep link**
4. **Add BACKEND_URL validation in email service**

