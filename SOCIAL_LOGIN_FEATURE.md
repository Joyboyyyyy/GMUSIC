# ✅ Social Login Feature - Google & Apple Authentication

## Overview

Complete Google and Apple login functionality has been added to Gretex Music Room with:
- Google OAuth integration
- Apple Sign In (iOS 13+)
- Beautiful UI with social buttons
- Zustand state management
- Automatic profile creation

## Files Modified/Created

### 1. ✅ package.json Updated

**Dependencies Added:**
```json
{
  "expo-apple-authentication": "~8.0.7",
  "expo-auth-session": "~7.0.9",
  "expo-web-browser": "~14.0.1"
}
```

### 2. ✅ authStore.ts Updated

**New Functions Added:**

```typescript
loginWithGoogle: (googleUser: any) => Promise<void>
loginWithApple: (appleUser: any) => Promise<void>
```

**Implementation:**
- Accepts user data from OAuth providers
- Creates User object with profile info
- Sets `isAuthenticated = true`
- Automatically navigates to Home (via RootNavigator)

### 3. ✅ LoginScreen.tsx Enhanced

**New Imports:**
```typescript
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
```

**New Features:**
- Google OAuth hook with `useAuthRequest`
- Apple authentication availability check
- Social login handlers
- Beautiful social login buttons

## UI Changes

### Login Screen Layout

```
┌─────────────────────────────────┐
│   🎵 Gretex Music Room          │
│   Learn music from the best     │
├─────────────────────────────────┤
│ Email: [____________]           │
│ Password: [____________]        │
│                                 │
│ [      Login      ]             │
│                                 │
│ ───── or continue with ─────    │
│                                 │
│ [🔴 Google]  [🍎 Apple]        │ ← NEW!
│                                 │
│ Don't have an account? Sign up  │
└─────────────────────────────────┘
```

**New UI Elements:**
- Divider with "or continue with" text
- Google button (white with Google logo)
- Apple button (black with Apple logo) - iOS only

## Google Login Flow

### 1. Configuration
```typescript
const [request, response, promptAsync] = Google.useAuthRequest({
  clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
});
```

### 2. User Clicks Google Button
```typescript
<TouchableOpacity onPress={() => promptAsync()}>
  <Ionicons name="logo-google" size={24} color="#DB4437" />
  <Text>Google</Text>
</TouchableOpacity>
```

### 3. OAuth Flow
```
User taps Google button
      ↓
Opens browser for Google login
      ↓
User signs in with Google
      ↓
Browser redirects back to app
      ↓
Access token received
      ↓
Fetch user info from Google API
      ↓
Call loginWithGoogle(googleUser)
      ↓
User stored in Zustand
      ↓
isAuthenticated = true
      ↓
Navigate to Home screen ✅
```

### 4. User Info Retrieved
```typescript
const userInfoResponse = await fetch(
  'https://www.googleapis.com/userinfo/v2/me',
  {
    headers: { Authorization: `Bearer ${accessToken}` },
  }
);
const googleUser = await userInfoResponse.json();
```

**Google User Object:**
```json
{
  "id": "google_user_id",
  "email": "user@gmail.com",
  "name": "John Doe",
  "picture": "https://..."
}
```

## Apple Login Flow

### 1. Availability Check
```typescript
useEffect(() => {
  AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
}, []);
```

### 2. User Clicks Apple Button (iOS only)
```typescript
const handleAppleLogin = async () => {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthenticationScope.FULL_NAME,
      AppleAuthenticationScope.EMAIL,
    ],
  });
  
  await loginWithApple(credential);
};
```

### 3. OAuth Flow
```
User taps Apple button (iOS)
      ↓
Native Apple Sign In dialog
      ↓
User authenticates with Face ID/Touch ID
      ↓
Credential received
      ↓
Call loginWithApple(credential)
      ↓
User stored in Zustand
      ↓
isAuthenticated = true
      ↓
Navigate to Home screen ✅
```

### 4. Apple Credential Object
```json
{
  "user": "apple_user_id",
  "email": "user@privaterelay.appleid.com",
  "fullName": {
    "givenName": "John",
    "familyName": "Doe"
  }
}
```

## Zustand Store Implementation

### loginWithGoogle
```typescript
loginWithGoogle: async (googleUser: any) => {
  const user: User = {
    id: googleUser.id,
    name: googleUser.name || googleUser.email.split('@')[0],
    email: googleUser.email,
    avatar: googleUser.picture || `https://i.pravatar.cc/150?u=${googleUser.email}`,
  };
  
  set({ user, isAuthenticated: true });
}
```

### loginWithApple
```typescript
loginWithApple: async (appleUser: any) => {
  const user: User = {
    id: appleUser.user,
    name: appleUser.fullName?.givenName 
      ? `${appleUser.fullName.givenName} ${appleUser.fullName.familyName || ''}`
      : 'Apple User',
    email: appleUser.email || `apple_${Date.now()}@example.com`,
    avatar: `https://i.pravatar.cc/150?u=${appleUser.user}`,
  };
  
  set({ user, isAuthenticated: true });
}
```

## Design System

### Social Buttons
```typescript
socialButton: {
  flex: 1,
  flexDirection: 'row',
  backgroundColor: '#fff',      // White for Google
  borderRadius: 12,
  padding: 14,
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
}

appleButton: {
  backgroundColor: '#000',      // Black for Apple
}
```

### Colors
- **Google Button**: White background, Google red logo (#DB4437)
- **Apple Button**: Black background, white logo & text
- **Divider**: Light purple (#e9d5ff)

## Setup Instructions

### Step 1: Install Dependencies
```bash
cd "Gretex music Room"
npm install
```

### Step 2: Configure Google OAuth (Required for Production)

**Get Google Client ID:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs

**Update LoginScreen.tsx:**
```typescript
const [request, response, promptAsync] = Google.useAuthRequest({
  clientId: 'YOUR_ACTUAL_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  // Or use different IDs for platforms:
  iosClientId: 'IOS_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: 'ANDROID_CLIENT_ID.apps.googleusercontent.com',
  webClientId: 'WEB_CLIENT_ID.apps.googleusercontent.com',
});
```

**Add to app.json:**
```json
{
  "expo": {
    "scheme": "gretex-music-room"
  }
}
```

### Step 3: Configure Apple Sign In (For iOS)

**Update app.json:**
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.gretexmusicroom.app",
      "usesAppleSignIn": true
    }
  }
}
```

**Apple Developer Setup:**
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Enable "Sign In with Apple" capability
3. Configure app identifier

## Features Implemented

✅ **Google Login Button**
- White button with Google logo
- Opens Google OAuth flow
- Fetches user profile automatically
- Stores user in Zustand

✅ **Apple Login Button**
- Black button with Apple logo
- Native iOS authentication
- Face ID / Touch ID support
- iOS 13+ only (auto-hidden on Android)

✅ **Automatic Navigation**
- After successful login → Home screen
- RootNavigator checks `isAuthenticated`
- Shows Main navigator automatically

✅ **Profile Storage**
- User data stored locally in Zustand
- No backend required (ready for integration)
- Persists during app session

✅ **Error Handling**
- Google login failures → Alert shown
- Apple login cancelled → Silent handling
- Network errors → User-friendly messages

✅ **Loading States**
- Google button disabled during auth
- Apple button disabled during auth
- Loading spinner on regular login

## Testing (Development Mode)

### Google Login (Requires Setup)
```bash
# 1. Get Google Client ID
# 2. Update LoginScreen.tsx with actual Client ID
# 3. Run app:
npx expo start

# 4. Test:
# - Tap Google button
# - Sign in with Google account
# - Verify auto-login to Home
```

### Apple Login (iOS Only)
```bash
# 1. Run on iOS device or simulator (iOS 13+)
npx expo run:ios

# 2. Test:
# - Tap Apple button
# - Authenticate with Face ID/Touch ID
# - Verify auto-login to Home
```

## Security Notes

### Google OAuth
- ✅ Uses standard OAuth 2.0 flow
- ✅ Access tokens handled securely
- ✅ User info fetched from Google API
- ⚠️ For production: Verify tokens on backend

### Apple Sign In
- ✅ Native iOS authentication
- ✅ Biometric security (Face ID/Touch ID)
- ✅ Privacy-focused (can hide email)
- ⚠️ For production: Verify identityToken on backend

## Backend Integration (When Ready)

### Google Login
```typescript
loginWithGoogle: async (googleUser: any) => {
  // Send Google token to your backend
  const response = await fetch('YOUR_API/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessToken: googleUser.accessToken,
      email: googleUser.email,
    }),
  });

  const { user, token } = await response.json();
  
  // Store auth token
  await SecureStore.setItemAsync('authToken', token);
  
  set({ user, isAuthenticated: true });
}
```

### Apple Login
```typescript
loginWithApple: async (credential: any) => {
  // Send Apple credential to your backend
  const response = await fetch('YOUR_API/auth/apple', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identityToken: credential.identityToken,
      user: credential.user,
    }),
  });

  const { user, token } = await response.json();
  
  // Store auth token
  await SecureStore.setItemAsync('authToken', token);
  
  set({ user, isAuthenticated: true });
}
```

## Troubleshooting

### Google Login Not Working
1. **Check Client ID**: Must match your Google Cloud project
2. **Check Redirect URIs**: Must be configured in Google Cloud Console
3. **Expo Development**: May need to use Expo's development URL
4. **Network**: Ensure internet connection

### Apple Login Button Not Showing
1. **iOS Version**: Requires iOS 13+
2. **Simulator**: Use iOS 13+ simulator
3. **Device**: Update to iOS 13+
4. **Check**: `AppleAuthentication.isAvailableAsync()` returns true

### Login Successful But Not Navigating
1. **Check**: `isAuthenticated` is set to `true`
2. **Check**: RootNavigator has `initialRouteName="Main"`
3. **Check**: User object is not null
4. **Reload**: Try reloading the app

## Summary

✅ **Google Login** - OAuth 2.0 flow implemented
✅ **Apple Login** - Native iOS authentication
✅ **UI Updated** - Beautiful social login buttons
✅ **Zustand Integration** - loginWithGoogle() & loginWithApple()
✅ **Auto Navigation** - Redirects to Home after login
✅ **Error Handling** - User-friendly error messages
✅ **Platform Detection** - Apple button iOS-only
✅ **Loading States** - Buttons disabled during auth
✅ **Profile Storage** - Stores user locally in Zustand

## Next Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Get Google Client ID** (for production):
   - Create project in Google Cloud Console
   - Get OAuth credentials
   - Update LoginScreen.tsx

3. **Configure Apple Sign In** (for iOS production):
   - Enable capability in Apple Developer
   - Update app.json

4. **Test the feature:**
   - Google: Requires valid Client ID
   - Apple: Works on iOS 13+ device/simulator

---

**Social login is ready! Configure OAuth credentials to enable in production! 🎉**

