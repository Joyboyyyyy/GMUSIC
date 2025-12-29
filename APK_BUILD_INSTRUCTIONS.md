# 📱 APK Build Instructions - Backend Connection Fix

## 🔍 Understanding the Issue

### Why APK Doesn't Connect to Expo:
- **Development Build**: Uses Expo Go/dev client → connects to `exp://192.168.100.40:8082`
- **Production APK**: Standalone app → **NO Expo connection** (this is normal!)
- **Problem**: APK is still pointing to local IP `192.168.100.40:3000` which may not be accessible

---

## ✅ Solution: Ensure Local Backend is Accessible

### Requirements for Local Backend:
1. **Backend must be running** on `192.168.100.40:3000`
2. **Phone and computer must be on same WiFi network**
3. **Firewall must allow connections** on port 3000

### Build APK:
```bash
# Build with local backend URL (already configured)
eas build --platform android --profile preview
```

### Test Connection:
1. Install APK on phone
2. Ensure phone is on same WiFi as your computer
3. Ensure backend is running: `cd backend && npm start`
4. Test login/signup in the app

---

## 🔧 Quick Fix for Current APK

If you already built an APK and it's not connecting:

### Check 1: Is Backend Running?
```bash
cd backend
npm start
# Should see: Server running on port 3000
```

### Check 2: Can Phone Reach Backend?
On your phone's browser, try:
```
http://192.168.100.40:3000/health
```
Should return: `{"status":"OK",...}`

### Check 3: Same Network?
- Phone and computer must be on same WiFi
- Check computer IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Update `app.config.js` if IP changed

### Check 4: Firewall?
- Allow port 3000 in Windows Firewall
- Or temporarily disable firewall for testing

---

## 📋 Build Profiles Explained

### Development Profile:
- **Purpose**: Active development with hot reload
- **Connection**: Expo dev server (`exp://...`)
- **Build**: `eas build --profile development`
- **Use when**: Actively coding and testing

### Preview Profile:
- **Purpose**: Test standalone app locally
- **Connection**: Direct to backend (local IP)
- **Build**: `eas build --profile preview`
- **Use when**: Testing APK before production

### Production Profile:
- **Purpose**: Release to Play Store
- **Connection**: Production backend (update URL in app.config.js)
- **Build**: `eas build --profile production`
- **Use when**: Ready for release

---

## 🚀 Recommended Workflow

### For Development:
```bash
# Use development build
eas build --platform android --profile development
# Then: expo start --dev-client
```

### For Testing:
```bash
# Use preview build with local backend
# Ensure backend is running first
eas build --platform android --profile preview
```

### For Production:
```bash
# Update app.config.js with your production backend URL first
# Then build
eas build --platform android --profile production
```

---

## ⚠️ Important Notes

1. **APK is Standalone**: Production APK doesn't connect to Expo - this is normal!
2. **Backend Must Be Accessible**: APK needs to reach your backend (local or production)
3. **Network Requirements**: Local backend requires same WiFi network
4. **Rebuild Required**: Changing `app.config.js` requires rebuilding APK
5. **Environment Variables**: Use EAS secrets or update app.config.js for production builds

---

## 🐛 Troubleshooting

### APK Shows "Network Error":
- ✅ Check backend is running
- ✅ Check phone has internet connection
- ✅ Verify API URL in app.config.js matches your backend
- ✅ Test backend in phone browser: `http://YOUR_IP:3000/health`

### APK Can't Connect to Local Backend:
- ✅ Ensure same WiFi network
- ✅ Check computer IP hasn't changed
- ✅ Verify firewall allows port 3000
- ✅ Test in browser: `http://YOUR_IP:3000/health`

### Want Expo Connection Back:
- ✅ Use development build: `eas build --profile development`
- ✅ Install Expo Go app for quick testing
- ✅ Use `expo start` for development mode

---

## 📝 Summary

**Your APK is working correctly** - it's a standalone app that doesn't need Expo connection.

**To fix backend connection:**
1. **For Local Testing**: Ensure backend is running and accessible on same WiFi
2. **For Production**: Update `app.config.js` with your production backend URL
3. **For Development**: Use development build profile

**Next Steps:**
1. Ensure backend is running: `cd backend && npm start`
2. Verify backend is accessible: Test `http://192.168.100.40:3000/health` in phone browser
3. If IP changed, update `app.config.js` with new IP
4. Rebuild APK: `eas build --platform android --profile preview`
