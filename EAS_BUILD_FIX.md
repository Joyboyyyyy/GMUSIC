# EAS Android Build Fix

## Issue
Build failed with Gradle error during EAS build process.

## Root Cause
Missing `google-services.json` file required for Google Sign-In integration on Android.

## Solution Applied

### Complete Removal of Google Sign-In (Temporary)

To allow the build to succeed without Firebase configuration, we completely removed Google Sign-In:

1. **Removed Package from Dependencies**
   - Removed `@react-native-google-signin/google-signin` from `package.json`
   - Ran `npm install` to update `package-lock.json`

2. **Disabled Google Services Plugin**
   - Commented out `apply plugin: "com.google.gms.google-services"` in `android/app/build.gradle`
   - Commented out `classpath('com.google.gms:google-services:4.4.0')` in `android/build.gradle`

3. **Disabled Plugin in App Config**
   - Commented out Google Sign-In plugin in `app.config.js`

4. **Code Already Prepared**
   - Google Sign-In imports already commented out in `LoginScreen.tsx`

## IMPORTANT: To Re-enable Google Sign-In

When you want to add Google Sign-In back to your app:

### Steps to Re-enable:

1. **Install Firebase & Get Configuration**
   - Go to Firebase Console: https://console.firebase.google.com/
   - Create/select "Gretex Music Room" project
   - Add Android app with package: `com.gretexmusicroom.app`
   - Download real `google-services.json`

2. **Reinstall Package**
   ```bash
   npm install @react-native-google-signin/google-signin
   ```

3. **Replace google-services.json**
   - Copy downloaded file to `android/app/google-services.json`
   - Replace the placeholder file

4. **Uncomment Plugin Lines**
   
   In `android/build.gradle`:
   ```gradle
   classpath('com.google.gms:google-services:4.4.0')
   ```
   
   In `android/app/build.gradle`:
   ```gradle
   apply plugin: "com.google.gms.google-services"
   ```
   
   In `app.config.js`:
   ```javascript
   [
     "@react-native-google-signin/google-signin",
     {
       iosUrlScheme: "com.googleusercontent.apps.600437075384-kk1rfkb9jmmqgm3413iddam4hrhf717k"
     }
   ]
   ```

5. **Uncomment Code**
   - Uncomment Google Sign-In imports and code in `LoginScreen.tsx`

6. **Rebuild**
   ```bash
   git add .
   git commit -m "Re-enable Google Sign-In with Firebase"
   git push
   eas build --platform android --profile preview
   ```

### Get SHA-1 Certificate Fingerprint (for Release):

```bash
# For debug keystore
cd android
./gradlew signingReport

# Look for SHA1 under "Variant: debug"
```

Add this SHA-1 to Firebase Console → Project Settings → Your Apps → Android → Add fingerprint

## Alternative: Keep Google Sign-In Disabled

If you don't want to use Google Sign-In at all:
- The current setup is complete - no further action needed
- Users can still sign up/login with email and password
- All other features work normally

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
✅ **Google Sign-In Removed**: Package completely removed from project  
✅ **Build Should Succeed**: All Google dependencies eliminated  
⚠️ **Google Sign-In Disabled**: Users must use email/password authentication
