# Phone Not Connecting to Backend - Troubleshooting Guide

## Common Issues When Using USB Debugging with APK

### Issue: Phone cannot reach backend server at http://192.168.100.40:3000

## Step-by-Step Diagnosis

### 1. Verify Backend Server is Running
```bash
cd "Gretex music Room/backend"
npm start
```

**Check for:**
- ✅ Server starts without errors
- ✅ Database connects successfully
- ✅ Logs show: "🚀 Gretex API running on:"
- ✅ Logs show: "Network: http://192.168.100.40:3000"

### 2. Verify Phone and PC are on SAME WiFi Network

**On PC:**
```bash
ipconfig
```
Look for IPv4 Address (usually under "Wireless LAN adapter Wi-Fi")

**On Phone:**
- Settings → WiFi → Check connected network name
- Must match PC's WiFi network name

**⚠️ CRITICAL:** USB debugging does NOT provide network connection. Phone must be on WiFi.

### 3. Test Backend from Phone Browser

**On Phone:**
1. Open Chrome/Safari browser
2. Navigate to: `http://192.168.100.40:3000/health`
3. Should see JSON response: `{"success":true,"message":"Gretex API running"}`

**If this fails:**
- ❌ Phone and PC are NOT on same network
- ❌ IP address is wrong
- ❌ Firewall is blocking

### 4. Check Windows Firewall

**Allow Node.js through firewall:**
1. Windows Security → Firewall & network protection
2. Allow an app through firewall
3. Find "Node.js" → Check both Private and Public
4. OR temporarily disable firewall to test

### 5. Verify IP Address is Correct

**Get current PC IP:**
```bash
ipconfig
```

**Update if different:**
- Edit: `src/utils/api.ts`
- Change: `const BASE_URL = "http://YOUR_ACTUAL_IP:3000";`
- Rebuild APK

### 6. Check Backend Server Logs

**When you try to use app, check backend console:**
- Do you see incoming requests?
- If NO requests appear → Phone cannot reach server
- If requests appear but fail → Different issue (auth, database, etc.)

## Quick Fixes

### Fix 1: Ensure Phone is on WiFi (Not Mobile Data)
- Disable mobile data
- Connect to same WiFi as PC
- Try again

### Fix 2: Update IP Address
1. Run `ipconfig` on PC
2. Find your current IP (e.g., 192.168.1.100)
3. Update `src/utils/api.ts`:
   ```typescript
   const BASE_URL = "http://192.168.1.100:3000";
   ```
4. Rebuild APK: `npx expo run:android` or `eas build`

### Fix 3: Test with Phone Browser First
- If browser can't reach `http://IP:3000/health`
- App definitely won't work
- Fix network/firewall first

### Fix 4: Check Backend is Listening on 0.0.0.0
- Verify `backend/src/server.js` has:
  ```javascript
  app.listen(PORT, "0.0.0.0", ...)
  ```
- NOT `localhost` or `127.0.0.1`

## Most Common Issue

**Phone is using mobile data or different WiFi network**

USB debugging only provides:
- ✅ ADB connection
- ✅ File transfer
- ❌ Network connectivity

**Solution:** Phone MUST be on same WiFi network as PC.

## Verification Checklist

- [ ] Backend server is running (`npm start` in backend folder)
- [ ] Phone and PC on same WiFi network
- [ ] Phone browser can open `http://192.168.100.40:3000/health`
- [ ] Windows Firewall allows Node.js
- [ ] IP address in `src/utils/api.ts` matches PC's actual IP
- [ ] Backend logs show incoming requests when using app
- [ ] AndroidManifest.xml has `usesCleartextTraffic="true"`

## Still Not Working?

1. **Check backend logs** - Are requests reaching the server?
2. **Check phone browser** - Can it reach the health endpoint?
3. **Try different IP** - Your IP might have changed
4. **Check router settings** - Some routers block device-to-device communication

