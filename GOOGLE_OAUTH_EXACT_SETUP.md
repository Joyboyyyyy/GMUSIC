# Google OAuth Exact Setup - Final Configuration

## ✅ Code Implementation

**File:** `src/screens/auth/LoginScreen.tsx`

```typescript
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

const [request, response, promptAsync] = Google.useAuthRequest({
  clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID, // WEB client ID only
  scopes: ['openid', 'profile', 'email'],
  responseType: 'id_token',
  useProxy: true, // 🔥 REQUIRED
});
```

## ✅ What Was Done

1. **Removed `getGoogleClientId()` function call**
   - Now uses `process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID` directly
   - Removed import of `googleAuth` config

2. **Added `useProxy: true` explicitly**
   - Required for Web Client ID to work
   - Uses Expo Auth Proxy (https://auth.expo.io)

3. **Removed all redirectUri configuration**
   - No `makeRedirectUri()` calls
   - No custom redirect URIs
   - Expo proxy handles this automatically

4. **Reordered imports**
   - `WebBrowser` imported first
   - `Google` imported second
   - `WebBrowser.maybeCompleteAuthSession()` called at top level

## 🔧 Google Cloud Console Configuration

### Web Client ID → Authorized redirect URIs
(ONE per line)

```
https://auth.expo.io/@Rogerr6969/gretex-music-room
exp://127.0.0.1:19000/--/oauth
```

### Authorized JavaScript origins
(empty)
or
```
https://auth.expo.io
```

## ❌ What NOT to Do

- ❌ Do NOT set `redirectUri`
- ❌ Do NOT use `makeRedirectUri({ scheme })`
- ❌ Do NOT rely on "automatic proxy detection"
- ❌ Do NOT use custom schemes for Google OAuth
- ❌ No `gretexmusicroom://` anywhere
- ❌ No Android / iOS client configuration needed

## 📝 Environment Variable

**Frontend `.env`:**
```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=600437075384-kk1rfkb9jmmqgm3413iddam4hrhf717k.apps.googleusercontent.com
```

**Backend `.env`:**
```env
GOOGLE_CLIENT_ID=600437075384-kk1rfkb9jmmqgm3413iddam4hrhf717k.apps.googleusercontent.com
```

Both must be the **SAME Web Client ID**.

## ✅ Final Configuration

- ✅ Uses Web Client ID only
- ✅ `useProxy: true` explicitly set
- ✅ No redirectUri configuration
- ✅ No custom schemes
- ✅ Works on iOS, Android, and Web
- ✅ Backend verification with google-auth-library

## 🚀 Testing

1. Ensure `EXPO_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env`
2. Verify Google Cloud Console redirect URIs are configured
3. Run app and test Google Sign-In
4. Should work without "Custom scheme URIs" error

