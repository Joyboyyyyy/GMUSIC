# Android Crash Fix - React Context Error

## Issue
App crashed on Android with error:
```
java.lang.IllegalArgumentException: App react context shouldn't be created before.
```

## Root Cause
In `MainActivity.kt`, the `onCreate` method was passing `null` instead of `savedInstanceState` to the parent class:

```kotlin
super.onCreate(null)  // ❌ WRONG
```

This caused Expo Dev Launcher to fail because it expects the proper savedInstanceState to initialize the React context correctly.

## Fix Applied
Changed line 19 in `android/app/src/main/java/com/gretexmusicroom/app/MainActivity.kt`:

```kotlin
super.onCreate(savedInstanceState)  // ✅ CORRECT
```

## How to Apply the Fix

### Option 1: Clean and Rebuild (Recommended)
```powershell
# Navigate to android directory
cd android

# Clean the build
.\gradlew clean

# Go back to root
cd ..

# Rebuild the app
npx expo run:android
```

### Option 2: Quick Rebuild
```powershell
npx expo run:android
```

### Option 3: Full Cache Clear + Rebuild
```powershell
# Clear all caches
.\clear-all-caches.ps1

# Rebuild
npx expo run:android
```

## Why This Happened
The `null` parameter was likely added during troubleshooting or by mistake. The Android Activity lifecycle requires the `savedInstanceState` Bundle to properly restore the app's state and initialize React Native components.

When Expo Dev Launcher tries to wrap the React Activity Delegate, it checks if the React context has been properly initialized. Passing `null` causes the initialization to fail, resulting in the crash.

## Verification
After rebuilding, the app should:
1. ✅ Launch without crashing
2. ✅ Show the splash screen properly
3. ✅ Load the React Native bundle
4. ✅ Display the home screen

## Related Files
- `android/app/src/main/java/com/gretexmusicroom/app/MainActivity.kt` - Fixed
- `app.config.js` - Expo configuration (no changes needed)
- `App.tsx` - Main app component (no changes needed)

## Prevention
Always pass the `savedInstanceState` parameter to `super.onCreate()` in Android Activities. This is a standard Android best practice and required for proper lifecycle management.
