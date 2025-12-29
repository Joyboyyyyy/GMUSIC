# 🔌 How to Connect Your App Back to Expo

## Quick Start - Choose Your Method

You have **2 options** to connect your app to Expo for development:

---

## ✅ Option 1: Use Expo Go App (Easiest)

### Step 1: Install Expo Go on Your Phone
- **Android**: [Download from Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS**: [Download from App Store](https://apps.apple.com/app/expo-go/id982107779)

### Step 2: Start Expo Dev Server
```bash
# In your project root
npm start
# OR
expo start
```

### Step 3: Connect Your Phone
1. **Make sure phone and computer are on same WiFi**
2. **Scan QR code** that appears in terminal
   - Android: Use Expo Go app to scan
   - iOS: Use Camera app to scan
3. App will load in Expo Go

### ⚠️ Limitations:
- Some native modules may not work (like Razorpay)
- Limited to Expo SDK modules only

---

## ✅ Option 2: Use Development Build (Recommended)

This uses a custom dev client that supports all your native modules.

### Step 1: Build Development Client (First Time Only)

```bash
# Build development client APK
eas build --platform android --profile development
```

**Wait for build to complete** (takes 10-15 minutes)

### Step 2: Install Development Client
1. Download the APK from EAS build page
2. Install on your phone
3. You'll see a custom app icon (not Expo Go)

### Step 3: Start Dev Server with Dev Client Flag

```bash
# Start Expo with dev client
npx expo start --dev-client
# OR
npm start -- --dev-client
```

### Step 4: Connect Your Phone
1. **Make sure phone and computer are on same WiFi**
2. **Open the development client app** on your phone
3. **Scan QR code** from terminal
4. App will load in your custom dev client

### ✅ Advantages:
- Supports all native modules (Razorpay, etc.)
- Full access to your custom native code
- Hot reload works perfectly

---

## 🔧 Troubleshooting Connection Issues

### Problem: Can't Connect / "Unable to connect to Metro"

#### Solution 1: Check Network
```bash
# Make sure both devices are on same WiFi
# Check your computer's IP address
# Windows:
ipconfig
# Mac/Linux:
ifconfig
```

#### Solution 2: Use Tunnel Mode
```bash
# Start with tunnel (works across networks)
npx expo start --dev-client --tunnel
```

#### Solution 3: Use LAN Mode Explicitly
```bash
# Force LAN connection
npx expo start --dev-client --lan
```

#### Solution 4: Clear Cache
```bash
# Clear Metro bundler cache
npx expo start --dev-client --clear
```

---

## 📱 Quick Commands Reference

### Start Expo (Standard):
```bash
npm start
# OR
expo start
```

### Start with Dev Client:
```bash
npx expo start --dev-client
```

### Start with Tunnel (if same WiFi doesn't work):
```bash
npx expo start --dev-client --tunnel
```

### Clear Cache and Start:
```bash
npx expo start --dev-client --clear
```

---

## 🎯 Recommended Workflow

### For Quick Testing (Expo Go):
```bash
npm start
# Scan QR with Expo Go app
```

### For Full Development (Dev Client):
```bash
# First time: Build dev client
eas build --platform android --profile development

# Then every time:
npx expo start --dev-client
# Scan QR with your custom dev client app
```

---

## ⚡ Quick Fix: If You Already Have a Dev Client Installed

If you previously built a development client:

1. **Just start the dev server:**
   ```bash
   npx expo start --dev-client
   ```

2. **Open your dev client app** on phone

3. **Scan QR code** - it should connect immediately!

---

## 🔍 Verify Connection

Once connected, you should see:
- ✅ Metro bundler shows "Connected" status
- ✅ App loads on your phone
- ✅ Changes hot reload automatically
- ✅ Console logs appear in terminal

---

## 📝 Summary

**Easiest Way:**
1. Install Expo Go app
2. Run `npm start`
3. Scan QR code

**Best Way (Full Features):**
1. Build dev client: `eas build --platform android --profile development`
2. Install dev client APK
3. Run `npx expo start --dev-client`
4. Scan QR code with dev client app

**If Connection Fails:**
- Try `--tunnel` flag
- Check same WiFi network
- Clear cache with `--clear`
- Verify firewall isn't blocking

---

## 🚀 Start Now!

**Quick start command:**
```bash
npm start
```

Then scan the QR code with Expo Go or your dev client app!

