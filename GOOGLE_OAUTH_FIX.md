# Google OAuth Implementation - Fixed for Backend Verification

## ✅ What Was Fixed

### 1. **Removed Platform-Specific Client IDs**
   - **File:** `src/config/googleAuth.ts`
   - Removed all platform-specific logic (iOS, Android, Web)
   - Now uses **ONLY** `EXPO_PUBLIC_GOOGLE_CLIENT_ID` (Web OAuth Client ID)
   - Works on all platforms (iOS, Android, Web) with the same Web Client ID

### 2. **Updated LoginScreen.tsx**
   - Changed `responseType` from `'token'` to `'id_token'`
   - Extracts `idToken` from OAuth response
   - Sends `idToken` to backend endpoint: `POST /api/auth/google`
   - Backend verifies the ID token and returns `{ user, token }`
   - Proper error handling for OAuth failures

### 3. **Created Backend Google Auth Endpoint**
   - **New Route:** `POST /api/auth/google`
   - **Controller:** `googleLogin` in `auth.controller.js`
   - **Service:** `googleLogin` in `auth.service.js`
   - Uses `google-auth-library` to verify ID token
   - Verifies with `GOOGLE_CLIENT_ID` (Web OAuth Client ID)
   - Creates or updates user in database
   - Returns JWT token for authenticated session

### 4. **Updated Backend Dependencies**
   - Added `google-auth-library` to `package.json`
   - Install with: `npm install` in backend directory

### 5. **Cleaned Up Configuration**
   - Removed Google Client IDs from `app.config.js` extras
   - Configuration now only uses environment variables

## 🔧 How It Works

### Frontend Flow:
1. User taps "Sign in with Google"
2. `expo-auth-session` opens OAuth flow with Web Client ID
3. Google returns `idToken` (not accessToken)
4. Frontend sends `idToken` to `POST /api/auth/google`
5. Backend verifies token and returns `{ user, token }`
6. Frontend stores JWT token and navigates to app

### Backend Flow:
1. Receives `idToken` from frontend
2. Verifies token using `google-auth-library` with `GOOGLE_CLIENT_ID`
3. Extracts user info (email, name, picture) from token payload
4. Finds or creates user in database
5. Generates JWT token
6. Returns `{ user, token }`

## 📝 Required Environment Variables

### Frontend (.env):
```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=600437075384-kk1rfkb9jmmqgm3413iddam4hrhf717k.apps.googleusercontent.com
```

### Backend (.env):
```env
GOOGLE_CLIENT_ID=600437075384-kk1rfkb9jmmqgm3413iddam4hrhf717k.apps.googleusercontent.com
```

**IMPORTANT:** Both must be the **SAME Web OAuth Client ID**

## 🚀 Setup Instructions

### 1. Install Backend Dependency:
```bash
cd backend
npm install
```

### 2. Set Environment Variables:
- Frontend: Set `EXPO_PUBLIC_GOOGLE_CLIENT_ID` in `.env`
- Backend: Set `GOOGLE_CLIENT_ID` in `.env`

### 3. Verify Google Cloud Console:
- Ensure Web OAuth Client ID is configured
- Authorized JavaScript origins include your domains
- Authorized redirect URIs are set correctly

## ✅ Benefits

1. **Single Client ID** - No platform-specific configuration needed
2. **Backend Verification** - Secure token verification on server
3. **Works Everywhere** - Same flow on iOS, Android, and Web
4. **Production Safe** - No SHA-1, no random failures
5. **Standard OAuth** - Follows Expo's recommended pattern

## 🔒 Security

- ID tokens are verified server-side using Google's official library
- No client-side token validation (secure)
- JWT tokens issued by your backend (not Google tokens)
- User data stored in your database

## 📱 Testing

1. **iOS:** `npx expo run:ios` - Should use Web Client ID
2. **Android:** `npx expo run:android` - Should use Web Client ID  
3. **Web:** `npm run web` - Should use Web Client ID

All platforms use the same Web OAuth Client ID and backend verification.

## 🐛 Troubleshooting

### "EXPO_PUBLIC_GOOGLE_CLIENT_ID is not set"
- Add to `.env` file in project root
- Restart Expo dev server

### "GOOGLE_CLIENT_ID is not configured"
- Add to backend `.env` file
- Restart backend server

### "Invalid Google ID token"
- Verify both frontend and backend use the same Web Client ID
- Check Google Cloud Console configuration
- Ensure redirect URIs are correct

## 📚 Files Modified

1. ✅ `src/config/googleAuth.ts` - Simplified to use only Web Client ID
2. ✅ `src/screens/auth/LoginScreen.tsx` - Updated to use id_token and backend
3. ✅ `src/store/authStore.ts` - Updated loginWithGoogle comment
4. ✅ `backend/package.json` - Added google-auth-library
5. ✅ `backend/src/services/auth.service.js` - Added googleLogin method
6. ✅ `backend/src/controllers/auth.controller.js` - Added googleLogin controller
7. ✅ `backend/src/routes/auth.routes.js` - Added POST /api/auth/google route
8. ✅ `app.config.js` - Removed Google Client IDs from extras

## ✨ No Breaking Changes

- ✅ Email/Password login unchanged
- ✅ Apple Sign-In unchanged (iOS only)
- ✅ All existing routes work
- ✅ Navigation flows unchanged
- ✅ Backward compatible

