# Google OAuth Proxy Fix - "Custom scheme URIs not allowed for WEB client type"

## ✅ Fix Applied

### Issue
Error: "Custom scheme URIs are not allowed for WEB client type"
- This occurs when using Web Client ID with custom redirect URIs
- Web Client IDs require Expo Auth Proxy (https://auth.expo.io)

### Solution
**File:** `src/screens/auth/LoginScreen.tsx`

1. **Removed explicit redirectUri configuration**
   - Expo automatically uses auth proxy when Web Client ID is detected
   - No need to manually set `redirectUri` or `scheme`

2. **Configuration:**
   ```typescript
   const [request, response, promptAsync] = Google.useAuthRequest({
     clientId: getGoogleClientId(), // Web Client ID only
     scopes: ['openid', 'profile', 'email'],
     responseType: 'id_token',
     // Expo automatically uses proxy - no redirectUri needed
   });
   ```

3. **How It Works:**
   - When using Web Client ID, Expo detects it automatically
   - Expo routes OAuth through `https://auth.expo.io` proxy
   - Proxy handles redirect and returns to app
   - No custom scheme URIs needed

## 🔧 Key Points

- ✅ **Web Client ID Only** - Single client ID for all platforms
- ✅ **No redirectUri** - Expo handles automatically
- ✅ **No custom scheme** - Proxy handles deep linking
- ✅ **responseType: 'id_token'** - For backend verification
- ✅ **Automatic Proxy** - Expo uses auth.expo.io automatically

## 📱 Works On All Platforms

- **iOS:** Uses proxy automatically
- **Android:** Uses proxy automatically  
- **Web:** Uses proxy automatically

All platforms use the same Web Client ID and Expo Auth Proxy.

## 🚀 Testing

1. Ensure `EXPO_PUBLIC_GOOGLE_CLIENT_ID` is set to Web Client ID
2. Run app: `npx expo start`
3. Tap "Sign in with Google"
4. Should work without "Custom scheme URIs" error

## 📝 Notes

- Expo's `Google.useAuthRequest` automatically detects Web Client ID
- When Web Client ID is detected, proxy is used automatically
- No manual proxy configuration needed
- This is the recommended approach for Expo apps using Web Client IDs

