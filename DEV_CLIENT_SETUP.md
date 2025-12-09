# Expo Custom Development Build - Setup Instructions

## ✅ Configuration Complete

All files have been updated for Razorpay integration with custom development build:

1. ✅ `expo-dev-client` installed
2. ✅ `react-native-razorpay` installed  
3. ✅ `eas.json` created
4. ✅ `app.json` updated with dev client plugin
5. ✅ API config updated for auto device detection
6. ✅ Payment screen ready

---

## 📋 Prerequisites

1. **EAS CLI Installed**
   ```bash
   npm install -g eas-cli
   ```

2. **EAS Account**
   ```bash
   eas login
   ```
   (Create account if needed)

3. **Backend Server Running**
   ```bash
   cd backend
   npm run dev
   ```
   Should run on port 3000

---

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
cd "Gretex music Room"
npm install
```

### Step 2: Configure API URL (if needed)

Edit `src/config/api.ts`:
- Update `LAN_IP` constant with your computer's IP address
- Find your IP:
  - Windows: `ipconfig` → IPv4 Address
  - Mac/Linux: `ifconfig` → inet address
- Or change `USE_LAN_IP` flag for simulator testing

### Step 3: Run Prebuild (if native folders don't exist)

```bash
npx expo prebuild --clean
```

This generates/updates `android/` and `ios/` folders with native code.

### Step 4: Build Custom Development Client

**For Android:**
```bash
eas build --profile development --platform android
```

**For iOS (if needed):**
```bash
eas build --profile development --platform ios
```

**What this does:**
- Builds a custom development client with Razorpay native module included
- Uploads build to Expo servers
- Returns a download link/QR code

### Step 5: Install Development Client on Device

**Option A: Download from EAS**
- Check email or EAS dashboard for build link
- Download APK (Android) or use TestFlight (iOS)
- Install on your device

**Option B: Local Build (Faster for testing)**
```bash
# Android
npx expo run:android

# iOS
cd ios && pod install && cd ..
npx expo run:ios
```

### Step 6: Start Development Server

```bash
npm start
# or
npx expo start --dev-client
```

The `--dev-client` flag is important for custom development builds.

### Step 7: Connect to Dev Server

1. Open the development client app on your device
2. Scan the QR code from terminal
3. Or press `a` (Android) / `i` (iOS) to open on connected device

---

## 🧪 Testing on Real Device

### 1. Verify Custom Dev Client

**How to know you're in custom dev client:**
- App shows "Development Build" or "Dev Client" branding
- Metro bundler connects (check terminal)
- Hot reload works
- Native modules (Razorpay) are available

### 2. Test Payment Flow

1. Navigate to Payment Test Screen in your app
2. Click "Pay Now" button
3. Razorpay checkout should open
4. Use test card: `4111 1111 1111 1111`
5. Complete payment
6. Check console logs for responses

### 3. Verify API Connection

**Check API URL in app:**
- Payment screen shows current API URL
- Should be `http://YOUR_IP:3000` on real device
- Should be `http://localhost:3000` on simulator

**Troubleshooting:**
- If API calls fail, verify:
  - Backend is running
  - Device and computer on same Wi-Fi
  - IP address is correct in `src/config/api.ts`
  - Firewall allows connections

---

## 📱 Platform-Specific Notes

### Android

**Device Requirements:**
- Android 5.0+ (API 21+)
- USB debugging enabled (for local build)
- Same Wi-Fi network as computer

**Local Build:**
```bash
npx expo run:android
```

**EAS Build:**
```bash
eas build --profile development --platform android
```

### iOS

**Device Requirements:**
- iOS 13.0+
- Apple Developer account (for EAS builds)
- Same Wi-Fi network as computer

**Local Build:**
```bash
cd ios
pod install
cd ..
npx expo run:ios
```

**EAS Build:**
```bash
eas build --profile development --platform ios
```

---

## 🔍 Verification Checklist

Before testing payment:

- [ ] `expo-dev-client` installed
- [ ] `react-native-razorpay` installed
- [ ] `eas.json` created
- [ ] `app.json` has dev client plugin
- [ ] Backend server running
- [ ] API URL configured correctly
- [ ] Custom dev client built and installed
- [ ] App connects to Metro bundler
- [ ] Payment screen accessible
- [ ] Razorpay checkout opens

---

## 🐛 Troubleshooting

### Issue: "Module not found: react-native-razorpay"

**Solution:**
```bash
npm install react-native-razorpay
npx expo prebuild --clean
npx expo run:android  # or run:ios
```

### Issue: Razorpay checkout not opening

**Solutions:**
1. Verify custom dev client is installed (not Expo Go)
2. Check that native build includes Razorpay:
   ```bash
   npx expo prebuild --clean
   ```
3. Rebuild development client:
   ```bash
   eas build --profile development --platform android
   ```

### Issue: API requests fail on device

**Solutions:**
1. Check IP address in `src/config/api.ts`
2. Verify device and computer on same Wi-Fi
3. Test backend URL in device browser
4. Check firewall settings
5. Try changing `USE_LAN_IP` flag in API config

### Issue: Metro bundler doesn't connect

**Solutions:**
1. Ensure using `--dev-client` flag:
   ```bash
   npx expo start --dev-client
   ```
2. Check device and computer on same network
3. Try tunnel mode:
   ```bash
   npx expo start --dev-client --tunnel
   ```

### Issue: Build fails on EAS

**Solutions:**
1. Verify `eas.json` is correct
2. Check Expo account is logged in: `eas whoami`
3. Review build logs on EAS dashboard
4. Try local build first: `npx expo run:android`

---

## 📝 Key Differences: Dev Client vs Expo Go

| Feature | Expo Go | Custom Dev Client |
|---------|---------|-------------------|
| Native Modules | ❌ Limited | ✅ All supported |
| Razorpay SDK | ❌ Not available | ✅ Fully supported |
| Build Type | Standard | Custom build |
| Distribution | App stores | Internal/Development |

**Important:** Razorpay requires custom development build. Expo Go does NOT support `react-native-razorpay`.

---

## 🎯 Quick Commands Reference

```bash
# Install dependencies
npm install

# Run prebuild
npx expo prebuild --clean

# Build for Android (EAS)
eas build --profile development --platform android

# Build locally for Android
npx expo run:android

# Start dev server with dev client
npx expo start --dev-client

# Check API config
# Edit: src/config/api.ts
```

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Custom dev client installs on device
2. ✅ App opens and shows "Development Build" or dev branding
3. ✅ Metro bundler connects successfully
4. ✅ Hot reload works when you save files
5. ✅ Payment screen opens without errors
6. ✅ "Pay Now" button opens Razorpay checkout
7. ✅ Payment flow completes successfully

---

## 📞 Next Steps

After successful setup:

1. Test complete payment flow
2. Integrate payment screen into your navigation
3. Update user/course IDs dynamically
4. Add payment verification endpoint calls
5. Test on multiple devices
6. Prepare for production build

---

**Setup Complete!** 🎉

Follow the steps above to build and test Razorpay payments on your real device.

