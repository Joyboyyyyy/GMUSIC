# Network Connection Diagnosis & Fixes

## Issues Identified and Fixed

### ✅ Issue 1: Missing Axios Error Interceptors
**Problem:** No logging of network errors made debugging impossible.

**Fix Applied:**
- Added request interceptor to log outgoing requests
- Added response interceptor to log responses and detailed error information
- Added specific error messages for network failures

**File:** `src/utils/api.ts`

### ✅ Issue 2: CORS Configuration Too Permissive
**Problem:** Basic CORS might not handle all Android request scenarios.

**Fix Applied:**
- Enhanced CORS with explicit configuration
- Added proper headers for Android/iOS
- Added request logging middleware to backend

**File:** `backend/src/app.js`

### ✅ Issue 3: Android 9+ Network Security Policy
**Problem:** Android 9+ requires explicit network security config for cleartext traffic.

**Fix Applied:**
- Created `network_security_config.xml` with explicit cleartext permissions
- Added domain-specific configurations for local network IPs
- Updated AndroidManifest to reference the config

**Files:**
- `android/app/src/main/res/xml/network_security_config.xml` (NEW)
- `android/app/src/main/AndroidManifest.xml` (UPDATED)

### ✅ Issue 4: Timeout Too Short
**Problem:** 10 second timeout might be too short for slower networks.

**Fix Applied:**
- Increased timeout to 30 seconds

**File:** `src/utils/api.ts`

## Step-by-Step Troubleshooting Protocol

### Step 1: Verify Backend is Running
```bash
cd "Gretex music Room/backend"
npm start
```

**Check for:**
- ✅ "Database connected successfully"
- ✅ "🚀 Gretex API running on:"
- ✅ "Network: http://192.168.100.40:3000"

### Step 2: Test from Phone Browser
1. Open Chrome on your phone
2. Navigate to: `http://192.168.100.40:3000/health`
3. Should see: `{"success":true,"message":"Gretex API running","timestamp":"..."}`

**If this fails:**
- Phone and PC are NOT on same WiFi network
- Firewall is blocking port 3000
- IP address is incorrect

### Step 3: Check Network Connectivity
**On PC:**
```bash
ipconfig
```
Verify IPv4 Address matches `192.168.100.40`

**On Phone:**
- Settings → WiFi → Check connected network
- Must match PC's WiFi network name
- Disable mobile data

### Step 4: Check Windows Firewall
1. Windows Security → Firewall & network protection
2. Allow an app through firewall
3. Find "Node.js" → Check both Private and Public
4. OR temporarily disable firewall to test

### Step 5: Rebuild APK with New Config
```bash
# Clean build
cd "Gretex music Room"
npx expo prebuild --clean

# Rebuild APK
npx expo run:android
# OR
eas build --platform android --profile development
```

### Step 6: Check App Logs
After rebuilding, check Expo/Metro logs for:
- `🔗 API Base URL: http://192.168.100.40:3000`
- `📱 Platform: android`
- `📤 [API Request]` logs when making requests
- `❌ [API Network Error]` if connection fails

### Step 7: Check Backend Logs
When using the app, backend should show:
- `📥 [timestamp] GET /health` (or POST /api/auth/login, etc.)
- Request headers including origin

**If no requests appear:**
- Phone cannot reach server (network/firewall issue)
- Check Step 2 (phone browser test)

**If requests appear but fail:**
- Different issue (auth, database, etc.)
- Check error details in backend logs

## Common Error Messages and Solutions

### Error: "Network Error" or "Network request failed"
**Causes:**
1. Phone and PC not on same WiFi network
2. Firewall blocking connection
3. Backend server not running
4. Wrong IP address

**Solution:**
- Verify Step 2 (phone browser test)
- Check firewall settings
- Verify backend is running
- Confirm IP address

### Error: "timeout of 30000ms exceeded"
**Causes:**
1. Network is very slow
2. Backend is not responding
3. Firewall is blocking but not rejecting

**Solution:**
- Check backend logs for incoming requests
- Test from phone browser
- Check network speed

### Error: "CORS policy" or "Access-Control-Allow-Origin"
**Causes:**
1. CORS not configured correctly
2. Backend not allowing the origin

**Solution:**
- Already fixed in `backend/src/app.js`
- Verify backend logs show CORS headers

## Verification Checklist

After applying fixes and rebuilding:

- [ ] Backend server is running (`npm start` in backend folder)
- [ ] Phone browser can open `http://192.168.100.40:3000/health`
- [ ] Phone and PC on same WiFi network
- [ ] Windows Firewall allows Node.js
- [ ] APK rebuilt with new network security config
- [ ] App logs show `🔗 API Base URL: http://192.168.100.40:3000`
- [ ] App logs show `📤 [API Request]` when making requests
- [ ] Backend logs show `📥 [timestamp]` when app makes requests
- [ ] No "Network Error" in app
- [ ] Signup/Login work successfully

## Files Modified

1. **src/utils/api.ts**
   - Added axios interceptors for request/response logging
   - Increased timeout to 30 seconds
   - Added detailed error logging

2. **backend/src/app.js**
   - Enhanced CORS configuration
   - Added request logging middleware

3. **android/app/src/main/res/xml/network_security_config.xml** (NEW)
   - Created network security config for Android 9+
   - Explicitly allows cleartext traffic for local IPs

4. **android/app/src/main/AndroidManifest.xml**
   - Added reference to network security config

## Next Steps

1. **Rebuild the APK** with the new configuration
2. **Test from phone browser** first (Step 2)
3. **Check app logs** for detailed error messages
4. **Check backend logs** for incoming requests
5. **Follow troubleshooting steps** if issues persist

## Important Notes

- USB debugging does NOT provide network connectivity
- Phone MUST be on WiFi (same network as PC)
- Network security config is required for Android 9+
- All changes preserve existing code flow
- No business logic or auth logic was modified

