# Frontend Setup Checklist

Use this checklist to set up the Gretex Music Room frontend from scratch.

## ✅ Prerequisites

- [ ] Node.js v18+ installed (`node --version`)
- [ ] npm or yarn installed (`npm --version`)
- [ ] Expo CLI installed globally (`npm install -g expo-cli`)
- [ ] Git installed (if cloning from repository)
- [ ] Code editor (VS Code recommended)

## ✅ Project Setup

- [ ] Clone/navigate to project directory
- [ ] Install dependencies: `npm install`
- [ ] Verify `package.json` exists and has correct dependencies
- [ ] Check `tsconfig.json` exists for TypeScript configuration

## ✅ Environment Configuration

- [ ] Create `.env` file in root directory
- [ ] Add `EXPO_PUBLIC_API_URL` (e.g., `http://localhost:3000`)
- [ ] Add `EXPO_PUBLIC_GOOGLE_CLIENT_ID` (for Google Sign-In)
- [ ] Verify `.env` is in `.gitignore` (don't commit secrets)
- [ ] Restart Expo dev server after creating `.env`

## ✅ Backend Connection

- [ ] Backend server is running
- [ ] Backend URL matches `EXPO_PUBLIC_API_URL`
- [ ] Test backend health: `curl http://localhost:3000/health`
- [ ] Verify CORS is configured on backend (for local dev)
- [ ] For mobile device testing, use computer's IP address:
  - Windows: `ipconfig` → Use IPv4 address
  - Mac/Linux: `ifconfig` → Use inet address
  - Update `.env`: `EXPO_PUBLIC_API_URL=http://192.168.1.x:3000`

## ✅ Google OAuth Setup

- [ ] Google Cloud Console project created
- [ ] OAuth 2.0 credentials created
- [ ] **Web Client ID** obtained (not iOS/Android)
- [ ] Client ID added to `.env` as `EXPO_PUBLIC_GOOGLE_CLIENT_ID`
- [ ] Authorized redirect URIs configured:
  - `https://auth.expo.io/@your-username/gretex-music-room`
  - Or custom scheme if not using proxy

## ✅ Apple Sign-In Setup (iOS Only)

- [ ] Apple Developer account
- [ ] App ID configured with Sign in with Apple capability
- [ ] Service ID created (if needed)
- [ ] Apple Authentication configured in `app.json`

## ✅ Development Server

- [ ] Start Expo: `npm start` or `npx expo start`
- [ ] QR code displayed in terminal
- [ ] Expo Go app installed on device (for testing)
- [ ] OR Development build created (for custom native modules)

## ✅ Testing Authentication

- [ ] Signup flow works
- [ ] Email verification link received
- [ ] Email verification works (deep link)
- [ ] Login with email/password works
- [ ] Google Sign-In works (if configured)
- [ ] Apple Sign-In works on iOS (if configured)
- [ ] Forgot password flow works
- [ ] Password reset works (deep link)
- [ ] Logout works

## ✅ Testing Core Features

- [ ] Home screen loads
- [ ] Browse screen shows courses
- [ ] Course details page loads
- [ ] Shopping cart functionality works
- [ ] Checkout flow works
- [ ] Payment integration works (Razorpay)
- [ ] Library screen shows purchased items
- [ ] Profile screen loads and updates
- [ ] Audio playback works (if implemented)

## ✅ Navigation Testing

- [ ] All screens accessible
- [ ] Protected routes redirect to login
- [ ] Deep links work:
  - Email verification: `gretexmusicroom://verify-email?token=xxx`
  - Password reset: `gretexmusicroom://reset-password?token=xxx`
- [ ] Back navigation works
- [ ] Tab navigation works (Home, Browse, Library, Profile)

## ✅ State Management

- [ ] Auth state persists after app restart
- [ ] Cart state works correctly
- [ ] Library state loads user's courses
- [ ] Token stored securely (SecureStore)
- [ ] Token automatically added to API requests

## ✅ API Integration

- [ ] All API endpoints accessible
- [ ] Error handling works (network errors, 401, 500, etc.)
- [ ] Loading states display correctly
- [ ] Response data displays correctly
- [ ] Request/response logging works (check console)

## ✅ Build & Deploy

### Development Build
- [ ] Expo Dev Client installed: `npx expo install expo-dev-client`
- [ ] iOS build: `npx expo run:ios`
- [ ] Android build: `npx expo run:android`
- [ ] Development build works on device

### Production Build
- [ ] EAS CLI installed: `npm install -g eas-cli`
- [ ] EAS account created: `eas login`
- [ ] EAS configured: `eas build:configure`
- [ ] `eas.json` configured with build profiles
- [ ] Environment variables set in EAS (for production)
- [ ] Android build: `eas build --platform android`
- [ ] iOS build: `eas build --platform ios`
- [ ] Builds successful and downloadable

## ✅ Troubleshooting Checklist

If something doesn't work:

- [ ] Check console for errors
- [ ] Verify environment variables are loaded
- [ ] Restart Expo dev server: `npx expo start --clear`
- [ ] Clear node_modules: `rm -rf node_modules && npm install`
- [ ] Check backend is running and accessible
- [ ] Verify API URL is correct (check network tab)
- [ ] Check token is valid (not expired)
- [ ] Verify CORS settings on backend
- [ ] Check deep link configuration in `app.json`
- [ ] Review error messages in console/logs

## ✅ Code Quality

- [ ] TypeScript errors resolved
- [ ] Linter warnings addressed
- [ ] No console errors in production build
- [ ] Code follows project conventions
- [ ] Comments added for complex logic

## ✅ Documentation

- [ ] README.md updated (if exists)
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Setup instructions clear
- [ ] Known issues documented

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS
npm run ios
# OR
npx expo run:ios

# Run on Android
npm run android
# OR
npx expo run:android

# Clear cache and restart
npx expo start --clear

# Build for production (Android)
eas build --platform android

# Build for production (iOS)
eas build --platform ios
```

---

## 📝 Notes

- Always restart Expo dev server after changing `.env` file
- Use your computer's IP address for mobile device testing
- Google OAuth requires **Web Client ID**, not mobile client IDs
- Deep links require app to be installed (won't work in Expo Go for custom schemes)
- Production builds require EAS account and configuration

---

**Last Updated**: 2024

