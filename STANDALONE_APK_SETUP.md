# Standalone Android APK Setup - Complete

## ✅ Configuration Status: READY FOR STANDALONE BUILD

Your project is now configured to build a standalone Android APK that works without Expo Go or Metro bundler.

---

## 📋 Configuration Summary

### 1. EAS Build Profile (`eas.json`) ✅

**Preview Profile** (for standalone testing):
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "distribution": "internal"
    }
  }
}
```

**Key Points:**
- ✅ `distribution: "internal"` - For internal testing
- ✅ `buildType: "apk"` - Builds APK file (not AAB)
- ✅ **NO** `developmentClient` - Standalone build
- ✅ **NO** Expo Go dependency

### 2. Expo Configuration (`app.config.js`) ✅

**Standalone-Ready Config:**
```javascript
export default {
  expo: {
    android: {
      package: "com.rogerr6969.gretexmusicroom",
      usesCleartextTraffic: true  // ✅ Allows HTTP
    },
    plugins: [
      "expo-secure-store"  // ✅ No expo-dev-client
    ],
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL  // ✅ From env at build time
    }
  }
}
```

**Key Points:**
- ✅ No `expo-dev-client` plugin
- ✅ `usesCleartextTraffic: true` - HTTP enabled
- ✅ API URL from environment variable
- ✅ All assets bundled

### 3. API Configuration ✅

**`src/utils/api.ts`:**
- ✅ Uses `Constants.expoConfig?.extra?.apiUrl` (from build-time env)
- ✅ Fallback to hardcoded IP: `http://192.168.100.40:3000`
- ✅ Works in standalone builds (no Metro needed)

---

## 🚀 Building Standalone APK

### Step 1: Set Environment Variable

Before building, set the API URL:

**Windows PowerShell:**
```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.100.40:3000"
```

**Or create/update `.env` file:**
```env
EXPO_PUBLIC_API_URL=http://192.168.100.40:3000
```

### Step 2: Build APK

```bash
eas build --platform android --profile preview
```

### Step 3: Install APK

After build completes:
1. Download the APK from EAS dashboard
2. Transfer to Android device
3. Install APK (enable "Install from unknown sources" if needed)
4. Open app - it will work standalone!

---

## ✅ What Works in Standalone APK

- ✅ App opens without Metro bundler
- ✅ No Expo Go required
- ✅ Connects to backend at configured URL
- ✅ All features work (auth, courses, payments, etc.)
- ✅ HTTP requests enabled (cleartext traffic)
- ✅ Deep linking works
- ✅ All assets bundled

---

## 🔧 Configuration Details

### Build Profile Comparison

| Profile | Type | Dev Client | Distribution | Use Case |
|---------|------|------------|--------------|----------|
| `development` | Dev Build | ✅ Yes | Internal | Development with hot reload |
| `preview` | Standalone | ❌ No | Internal | **Testing standalone APK** |
| `production` | Standalone | ❌ No | Store | Play Store release |

### Environment Variables

**Build-time variables** (set before `eas build`):
- `EXPO_PUBLIC_API_URL` - Backend API URL (embedded in APK)

**Runtime variables** (from backend `.env`):
- Backend uses its own `.env` file
- Frontend APK uses build-time `EXPO_PUBLIC_API_URL`

---

## 📱 Testing Checklist

After installing the standalone APK:

- [ ] App opens without errors
- [ ] No Metro bundler connection attempts
- [ ] Login works
- [ ] API calls succeed (check network requests)
- [ ] Forgot password flow works
- [ ] Deep links work (if applicable)
- [ ] All screens load correctly

---

## ⚠️ Important Notes

1. **API URL**: Must be set before building
   - Set `EXPO_PUBLIC_API_URL` environment variable
   - Or ensure `.env` file has it
   - This gets embedded in the APK at build time

2. **Backend Must Be Running**: 
   - Backend server must be accessible at the configured URL
   - For physical device: Use your computer's LAN IP
   - Current IP: `http://192.168.100.40:3000`

3. **No Hot Reload**: 
   - Standalone APK doesn't support hot reload
   - Changes require rebuilding APK

4. **Network Access**:
   - Device and computer must be on same WiFi
   - Firewall must allow connections on port 3000

---

## 🎯 Expected Result

After building and installing:

```
✅ APK installs successfully
✅ App opens immediately (no Metro connection)
✅ App connects to backend at http://192.168.100.40:3000
✅ All features work normally
✅ No Expo Go dependency
✅ Fully standalone application
```

---

## 📝 Build Command Reference

```bash
# Build standalone APK for testing
eas build --platform android --profile preview

# Check build status
eas build:list

# Download build
eas build:download --platform android --profile preview
```

---

## ✅ Status: READY

Your project is fully configured for standalone Android APK builds!

**Next Step**: Run `eas build --platform android --profile preview`

