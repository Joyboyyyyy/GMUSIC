# EAS Android Build Fix

## Issue
Build failed with Gradle error during EAS build process.

## Root Cause
Missing `google-services.json` file required for Google Sign-In integration on Android.

## Solution Applied

### 1. Added Google Services Plugin
Updated `android/build.gradle` to include Google Services classpath:
```gradle
classpath('com.google.gms:google-services:4.4.0')
```

### 2. Applied Plugin in App Build
Updated `android/app/build.gradle` to apply the plugin:
```gradle
apply plugin: "com.google.gms.google-services"
```

### 3. Created Placeholder google-services.json
Created `android/app/google-services.json` with placeholder values.

## IMPORTANT: Get Your Real google-services.json

The placeholder file will NOT work for production. You MUST replace it with your real file from Firebase:

### Steps to Get Real File:

1. **Go to Firebase Console:**
   https://console.firebase.google.com/

2. **Select Your Project:**
   - Find "Gretex Music Room" project
   - Or create a new project if you don't have one

3. **Add Android App (if not already added):**
   - Click "Add app" → Android
   - Package name: `com.gretexmusicroom.app`
   - App nickname: "Gretex Music Room"
   - SHA-1: (optional for now, needed for release)

4. **Download google-services.json:**
   - Go to Project Settings → Your Apps
   - Find your Android app
   - Click "Download google-services.json"

5. **Replace the Placeholder:**
   - Copy the downloaded file
   - Replace `android/app/google-services.json`
   - Commit to git

### Get SHA-1 Certificate Fingerprint (for Release):

```bash
# For debug keystore
cd android
./gradlew signingReport

# Look for SHA1 under "Variant: debug"
```

Add this SHA-1 to Firebase Console → Project Settings → Your Apps → Android → Add fingerprint

## Alternative: Remove Google Sign-In (Not Recommended)

If you don't want to use Google Sign-In, you need to:
1. Remove `@react-native-google-signin/google-signin` from dependencies
2. Remove Google Sign-In code from your app
3. Remove the plugin from `app.config.js`

## Retry Build

After adding the real `google-services.json`:

```bash
# Commit changes
git add .
git commit -m "Add google-services.json for Android build"
git push

# Retry build
eas build --platform android --profile preview
```

## Common Build Errors

### Error: "google-services.json is missing"
- Make sure file is at `android/app/google-services.json`
- Check file is committed to git
- Verify file is valid JSON

### Error: "No matching client found"
- Package name in google-services.json must match `com.gretexmusicroom.app`
- Recreate the Android app in Firebase with correct package name

### Error: "SHA-1 mismatch"
- Add your debug/release SHA-1 to Firebase Console
- Get SHA-1 using `./gradlew signingReport`

## Verification

After build succeeds:
1. Install APK on device
2. Test Google Sign-In functionality
3. Verify authentication works correctly

## Status
⚠️ **Action Required**: Replace placeholder google-services.json with real file from Firebase Console
