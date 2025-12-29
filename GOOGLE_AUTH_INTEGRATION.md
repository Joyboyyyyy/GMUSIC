# Google OAuth Integration - Platform-Specific Client IDs

## ✅ What Was Done

### 1. Created Platform-Aware Google Auth Configuration
**File:** `src/config/googleAuth.ts`

- Created a centralized configuration file for Google OAuth client IDs
- Implemented platform detection to automatically select the correct client ID:
  - **iOS:** `600437075384-aper1boh2bmkknp3kt0301hpg353r8vt.apps.googleusercontent.com`
  - **Web:** `600437075384-kk1rfkb9jmmqgm3413iddam4hrhf717k.apps.googleusercontent.com`
  - **Android:** `600437075384-lgfb558gss2m0c7re7hrthlfpa65fru5.apps.googleusercontent.com`

### 2. Updated LoginScreen.tsx
**File:** `src/screens/auth/LoginScreen.tsx`

- Replaced hardcoded client ID with `getGoogleClientId()` function
- Added proper OAuth scopes: `['openid', 'profile', 'email']`
- Set response type to `'id_token'` for better compatibility
- Maintained all existing Google login functionality

### 3. Updated app.config.js
**File:** `app.config.js`

- Added Google Client IDs to `extra` section for reference
- Added iOS configuration with bundle identifier
- Added Android configuration
- Added web configuration section

## 🔧 How It Works

### Platform Detection
The `getGoogleClientId()` function automatically detects the platform and returns the appropriate client ID:

```typescript
if (Platform.OS === 'ios') {
  return GOOGLE_CLIENT_IDS.ios;
} else if (Platform.OS === 'android') {
  return GOOGLE_CLIENT_IDS.android;
} else if (Platform.OS === 'web') {
  return GOOGLE_CLIENT_IDS.web;
}
```

### Priority Order
1. **Environment Variable** - If `EXPO_PUBLIC_GOOGLE_CLIENT_ID` is set, it takes priority (for testing/override)
2. **Platform-Specific ID** - Automatically selected based on `Platform.OS`
3. **Fallback** - Web client ID for unknown platforms

## 📱 Platform-Specific Behavior

### iOS
- Uses iOS-specific client ID
- Works with native iOS Google Sign-In
- Requires proper bundle identifier: `com.gretexmusicroom.app`

### Android
- Uses Android-specific client ID
- Works with native Android Google Sign-In
- Requires proper package name: `com.rogerr6969.gretexmusicroom`

### Web
- Uses Web-specific client ID
- Works with browser-based OAuth flow
- Uses `expo-auth-session` for web OAuth

## 🔒 Security Notes

- Client IDs are stored in code (they're public by design)
- No sensitive credentials are exposed
- OAuth flow handles authentication securely
- Token exchange happens server-side (if implemented)

## 🧪 Testing

### To Test on Each Platform:

1. **iOS:**
   ```bash
   npx expo run:ios
   ```
   - Tap "Sign in with Google"
   - Should use iOS client ID

2. **Android:**
   ```bash
   npx expo run:android
   ```
   - Tap "Sign in with Google"
   - Should use Android client ID

3. **Web:**
   ```bash
   npm run web
   ```
   - Click "Sign in with Google"
   - Should use Web client ID
   - Opens browser OAuth flow

## 📝 Files Modified

1. ✅ `src/config/googleAuth.ts` - **NEW FILE** - Platform-aware Google Client ID configuration
2. ✅ `src/screens/auth/LoginScreen.tsx` - Updated to use platform-specific client IDs
3. ✅ `app.config.js` - Added Google Client IDs to extra config

## 🚀 No Breaking Changes

- ✅ All existing routes remain unchanged
- ✅ All existing functionality preserved
- ✅ Backward compatible with environment variable override
- ✅ No changes to navigation or other auth flows
- ✅ Apple Sign-In still works (iOS only)
- ✅ Email/Password login unchanged

## 🔍 Debugging

If Google Sign-In doesn't work:

1. **Check Console Logs:**
   - Look for `[Google Auth] Using [Platform] client ID`
   - Verify the correct client ID is being used

2. **Verify Client IDs:**
   - Ensure client IDs are correctly configured in Google Cloud Console
   - Check that redirect URIs are properly set

3. **Platform-Specific Issues:**
   - **iOS:** Verify bundle identifier matches Google Console
   - **Android:** Verify package name matches Google Console
   - **Web:** Verify authorized JavaScript origins in Google Console

## 📚 Additional Notes

- The configuration is centralized for easy maintenance
- Client IDs can be overridden via `EXPO_PUBLIC_GOOGLE_CLIENT_ID` env variable
- All platforms use the same OAuth flow, just with different client IDs
- The implementation follows Expo's best practices for multi-platform OAuth

