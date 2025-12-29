# Google Sign-In Verification Checklist

## ✅ Implementation Status

### Frontend (LoginScreen.tsx)
- ✅ Uses `expo-auth-session/providers/google`
- ✅ `useProxy: true` set (required for Web Client ID)
- ✅ `responseType: 'id_token'` configured
- ✅ Sends `idToken` to backend `/api/auth/google`
- ✅ Handles response and navigates user
- ✅ Removed conflicting `GoogleSignin.configure()` from App.tsx

### Backend
- ✅ Route: `POST /api/auth/google` exists
- ✅ Controller: `googleLogin` implemented
- ✅ Service: `googleLogin` method verifies ID token
- ✅ Uses `google-auth-library` for verification
- ✅ Creates/updates user in database
- ✅ Returns JWT token

## 🔧 Required Setup

### 1. Environment Variables

**Frontend `.env`:**
```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=600437075384-kk1rfkb9jmmqgm3413iddam4hrhf717k.apps.googleusercontent.com
```

**Backend `.env`:**
```env
GOOGLE_CLIENT_ID=600437075384-kk1rfkb9jmmqgm3413iddam4hrhf717k.apps.googleusercontent.com
```

**Both must be the SAME Web Client ID**

### 2. Google Cloud Console

**Authorized redirect URIs:**
```
https://auth.expo.io/@Rogerr6969/gretex-music-room
exp://127.0.0.1:19000/--/oauth
```

**Authorized JavaScript origins:**
```
https://auth.expo.io
```
(or leave empty)

### 3. Backend Dependency

Make sure `google-auth-library` is installed:
```bash
cd backend
npm install
```

## 🧪 Testing Steps

1. **Set environment variables** in both frontend and backend `.env` files
2. **Restart both servers** (frontend and backend)
3. **Open app** and navigate to Login screen
4. **Tap "Sign in with Google"** button
5. **Complete OAuth flow** in browser/app
6. **Verify** user is logged in and navigated to Main screen

## ✅ Expected Flow

1. User taps "Sign in with Google"
2. Expo opens OAuth flow via proxy (https://auth.expo.io)
3. User authenticates with Google
4. Google returns `idToken`
5. Frontend sends `idToken` to `POST /api/auth/google`
6. Backend verifies token with `google-auth-library`
7. Backend creates/updates user and returns JWT
8. Frontend stores JWT and navigates to app

## 🐛 Troubleshooting

### "EXPO_PUBLIC_GOOGLE_CLIENT_ID is not set"
- Add to frontend `.env` file
- Restart Expo dev server

### "GOOGLE_CLIENT_ID is not configured"
- Add to backend `.env` file
- Restart backend server

### "Invalid Google ID token"
- Verify both frontend and backend use same Web Client ID
- Check Google Cloud Console redirect URIs
- Ensure `useProxy: true` is set

### OAuth flow doesn't start
- Check console for errors
- Verify `EXPO_PUBLIC_GOOGLE_CLIENT_ID` is set
- Ensure backend is running

## ✨ Status: READY TO TEST

All code is in place. Just ensure:
1. Environment variables are set
2. Google Cloud Console is configured
3. Backend dependency is installed
4. Both servers are running

