# 🧹 Complete Cache Clearing Guide

## Quick Cache Clear (Use This First!)

```bash
# Run the existing script
.\clear-all-caches.ps1

# Then start with cleared cache
npx expo start --clear
```

## Manual Cache Clearing Steps

### 1. 🛑 Stop All Processes
```bash
# Kill Metro bundler
taskkill /f /im node.exe

# Kill Expo CLI
taskkill /f /im expo.exe
```

### 2. 🗂️ Clear Project Caches
```bash
# Metro cache
rm -rf .metro-cache
rm -rf node_modules/.cache

# Expo cache
rm -rf .expo
rm -rf .expo-cache

# Temporary files
rm -rf tmp/
```

### 3. 🌐 Clear Global Caches
```bash
# NPM cache
npm cache clean --force

# Expo global cache
npx expo install --fix

# Clear Windows temp
rm -rf $env:TEMP/metro-*
rm -rf $env:TEMP/expo-*
```

### 4. 📱 Clear Device/Emulator
```bash
# Uninstall app from device
adb uninstall com.gretexmusicroom.app

# Clear app data
adb shell pm clear com.gretexmusicroom.app

# For iOS Simulator
xcrun simctl erase all
```

### 5. 🏗️ Clear Build Caches
```bash
# Android
rm -rf android/.gradle
rm -rf android/app/build
rm -rf android/build

# iOS (if using)
rm -rf ios/build
rm -rf ios/Pods
```

## 🚀 Restart Development

### Option 1: Expo Go (Recommended for Testing)
```bash
npx expo start --clear
# Scan QR code with Expo Go app
```

### Option 2: Development Build
```bash
npx expo run:android --clear-cache
# Or for iOS
npx expo run:ios --clear-cache
```

### Option 3: Complete Rebuild
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Start fresh
npx expo start --clear
```

## 🔧 Advanced Cache Clearing

### Clear React Native Packager Cache
```bash
npx react-native start --reset-cache
```

### Clear Watchman (if installed)
```bash
watchman watch-del-all
```

### Clear Yarn Cache (if using Yarn)
```bash
yarn cache clean
```

### Clear Flipper Cache (if using)
```bash
rm -rf ~/.flipper
```

## 📱 Device-Specific Issues

### Android Emulator
```bash
# Cold boot emulator
emulator -avd YOUR_AVD_NAME -cold-boot

# Wipe emulator data
emulator -avd YOUR_AVD_NAME -wipe-data
```

### Physical Android Device
```bash
# Enable USB Debugging
# Go to Settings > Developer Options > USB Debugging

# Clear app data manually
# Settings > Apps > Gretex Music Room > Storage > Clear Data
```

### iOS Simulator
```bash
# Reset simulator
xcrun simctl erase all

# Reset specific simulator
xcrun simctl erase "iPhone 15 Pro"
```

## 🎯 Performance Optimization Cache Clear

Since we just implemented performance optimizations, you might need to:

### Clear AsyncStorage (Our Offline Cache)
```bash
# Add this to your app temporarily to clear offline cache
import { clearCache } from './src/utils/offlineCache';

// In your app component
useEffect(() => {
  clearCache(); // Clear all offline cache
}, []);
```

### Force Re-render Components
```bash
# In React DevTools or add to component:
// Force re-mount by changing key
<YourComponent key={Date.now()} />
```

## 🚨 Nuclear Option (Last Resort)

If nothing works, complete project reset:

```bash
# 1. Backup your code
git add .
git commit -m "Backup before reset"

# 2. Delete everything
rm -rf node_modules
rm -rf .expo
rm -rf .metro-cache
rm -rf android/.gradle
rm -rf android/app/build

# 3. Fresh install
npm install
npx expo install --fix

# 4. Start completely fresh
npx expo start --clear --tunnel
```

## ✅ Verification Steps

After clearing cache, verify changes are applied:

1. **Check Metro logs** - Should show "Loading dependency graph, done."
2. **Check app reload** - Shake device → Reload
3. **Check performance** - Scroll should be smoother with OptimizedHorizontalList
4. **Check offline banner** - Turn off WiFi to see offline banner
5. **Check image optimization** - Images should load with optimization parameters

## 🔍 Troubleshooting

### Changes Not Appearing?
- Try **Fast Refresh**: Shake device → "Fast Refresh"
- Try **Reload**: Shake device → "Reload"
- Try **Hard Reload**: Close app completely and reopen

### Still Not Working?
- Check if you're using **Expo Go** vs **Development Build**
- Expo Go has limitations with native modules
- Development build shows all changes immediately

### Performance Changes Not Visible?
- Performance improvements are subtle
- Use React DevTools Profiler to measure
- Check memory usage in device settings

## 📝 Notes

- The `clear-all-caches.ps1` script is comprehensive and should handle most cases
- Performance optimizations (OptimizedHorizontalList, useMemo) work behind the scenes
- Offline features only show when network is disconnected
- Image optimizations are most visible on slower networks

## 🎉 Success Indicators

You'll know cache clearing worked when:
- ✅ App starts faster
- ✅ Scrolling is smoother (OptimizedHorizontalList)
- ✅ Images load with optimization parameters
- ✅ Offline banner appears when disconnected
- ✅ Memory usage is more stable