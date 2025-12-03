# 🚀 Quick Setup Guide

Follow these steps to get your Gretex Music Room app running:

## Step 1: Install Node.js
Download and install Node.js from [nodejs.org](https://nodejs.org/) (v16 or higher)

## Step 2: Install Expo CLI
```bash
npm install -g expo-cli
```

## Step 3: Navigate to Project
```bash
cd "Gretex music Room"
```

## Step 4: Install Dependencies
```bash
npm install
```

> **Note**: The project includes a `.npmrc` file with `legacy-peer-deps=true` to handle React 19 peer dependencies. This is normal and safe.

## Step 5: Start the App
```bash
npm start
# or
npx expo start
```

## Step 6: Run on Device

### Option A: Physical Device
1. Install "Expo Go" app from App Store (iOS) or Play Store (Android)
2. Scan the QR code shown in terminal
3. App will load on your device

### Option B: iOS Simulator (Mac only)
1. Install Xcode from Mac App Store
2. Press `i` in the terminal after running `npm start`

### Option C: Android Emulator
1. Install Android Studio
2. Set up an Android Virtual Device (AVD)
3. Press `a` in the terminal after running `npm start`

## Troubleshooting

### Port Already in Use
```bash
npx expo start --port 19001
```

### Metro Bundler Issues
```bash
npx expo start -c
```

### Clear Cache
```bash
rm -rf node_modules
npm install
npx expo start -c
```

### iOS Specific Issues
```bash
cd ios
pod install
cd ..
```

## Testing the App

### Test Authentication Flow
1. Click "Don't have an account? Sign up"
2. Fill in any details (mock authentication)
3. You'll be logged in automatically

### Test Purchase Flow
1. Browse packs on Home or Browse screen
2. Click on any pack
3. Click "Buy Now"
4. If logged out, you'll be prompted to login
5. Complete mock checkout
6. Pack appears in Library

### Test Preview Tracks
1. Open any pack detail page
2. Click on tracks marked "Preview"
3. They should play without purchase
4. Locked tracks show lock icon

## Next Steps

1. **Replace Mock Data**: Connect to your backend API
2. **Payment Integration**: Integrate Stripe/Razorpay
3. **Video Streaming**: Implement actual video player
4. **Assets**: Add proper app icons and splash screens
5. **Backend**: Build Node.js + PostgreSQL backend as described in context.md

## Development Tips

- Use `console.log()` for debugging
- Use React Developer Tools for inspecting components
- Use Expo Go app for quick testing
- Use iOS Simulator for iOS-specific features
- Hot reloading is enabled by default

## Building for Production

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

### Web
```bash
npm run web
```

## Questions?

Check the main README.md for detailed documentation.

Happy coding! 🎉

