# Network Connectivity Troubleshooting Guide

## ✅ Backend Server Status

**Server is RUNNING:**
- ✅ Port 3000 is listening on `0.0.0.0:3000` (all network interfaces)
- ✅ Health endpoint responds: `http://192.168.1.12:3000/health`
- ✅ Server IP: `192.168.1.12`
- ✅ Process ID: 5604

## 🔍 Issue: Frontend Cannot Connect to Backend

**Error:** `ERR_NETWORK - Cannot reach server`
**Frontend trying to connect to:** `http://192.168.1.12:3000`

## 🛠️ Troubleshooting Steps

### 1. Check Windows Firewall

The backend is running, but Windows Firewall might be blocking incoming connections.

**Solution:**
1. Open Windows Defender Firewall
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port `3000` → Next
6. Select "Allow the connection" → Next
7. Check all profiles (Domain, Private, Public) → Next
8. Name it "Node.js Backend Port 3000" → Finish

**OR use PowerShell (Run as Administrator):**
```powershell
New-NetFirewallRule -DisplayName "Node.js Backend Port 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### 2. Verify Device Network

**For Physical Device:**
- Ensure your phone/tablet is on the **same Wi-Fi network** as your computer
- Check Wi-Fi network name matches on both devices
- Try disconnecting and reconnecting to Wi-Fi

**For Android Emulator:**
- Use `10.0.2.2` instead of your LAN IP
- Update `.env`: `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`

**For iOS Simulator:**
- Use `localhost` instead of LAN IP
- Update `.env`: `EXPO_PUBLIC_API_URL=http://localhost:3000`

### 3. Test Connectivity from Device

**From your phone/device:**
1. Open a web browser
2. Navigate to: `http://192.168.1.12:3000/health`
3. You should see: `{"success":true,"message":"Gretex API running",...}`

**If this doesn't work:**
- Firewall is blocking (see step 1)
- Device is on different network
- Router is blocking local connections

### 4. Verify Frontend Configuration

**Check `.env` file in project root:**
```env
EXPO_PUBLIC_API_URL=http://192.168.1.12:3000
```

**After changing `.env`:**
1. Stop Expo dev server (Ctrl+C)
2. Clear cache: `npx expo start --clear`
3. Restart Expo dev server

### 5. Check Router Settings

Some routers block device-to-device communication:
- Check if "AP Isolation" or "Client Isolation" is enabled
- Disable it if enabled
- Check if "Guest Network" is being used (may isolate devices)

### 6. Alternative: Use ngrok (For Testing)

If local network doesn't work, use ngrok for tunneling:

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000
```

This will give you a public URL like: `https://abc123.ngrok.io`
Update `.env`: `EXPO_PUBLIC_API_URL=https://abc123.ngrok.io`

**Note:** ngrok free tier has limitations. Use only for testing.

### 7. Verify Backend is Listening on All Interfaces

**Check server.js:**
```javascript
app.listen(PORT, "0.0.0.0", () => {
  // This is correct - listens on all interfaces
});
```

**Verify with netstat:**
```powershell
netstat -ano | findstr :3000
# Should show: TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING
```

## 🧪 Quick Test Commands

### Test from Computer:
```powershell
# Test localhost
curl http://localhost:3000/health

# Test LAN IP
curl http://192.168.1.12:3000/health
```

### Test from Device:
1. Open browser on device
2. Go to: `http://192.168.1.12:3000/health`
3. Should see JSON response

## 📱 Platform-Specific Solutions

### Android Emulator
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

### iOS Simulator
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Physical Device (Same Wi-Fi)
```env
EXPO_PUBLIC_API_URL=http://192.168.1.12:3000
```

### Physical Device (Different Network)
Use ngrok or deploy backend to a public server.

## 🔥 Most Common Fix

**90% of the time, it's Windows Firewall:**

1. Open PowerShell as Administrator
2. Run:
```powershell
New-NetFirewallRule -DisplayName "Node.js Backend Port 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

3. Restart backend server
4. Test from device browser: `http://192.168.1.12:3000/health`

## ✅ Verification Checklist

- [ ] Backend server is running (port 3000 listening)
- [ ] Windows Firewall allows port 3000
- [ ] Device is on same Wi-Fi network
- [ ] Can access `http://192.168.1.12:3000/health` from device browser
- [ ] `.env` file has correct `EXPO_PUBLIC_API_URL`
- [ ] Expo dev server restarted after `.env` changes
- [ ] Expo cache cleared: `npx expo start --clear`

## 🆘 Still Not Working?

1. **Check backend logs** - Are requests reaching the server?
2. **Check device network** - Can device ping `192.168.1.12`?
3. **Try different port** - Change to 3001 and update firewall
4. **Use ngrok** - Temporary solution for testing
5. **Check antivirus** - May be blocking connections

---

**Last Updated:** Current Date
**Backend IP:** 192.168.1.12
**Backend Port:** 3000

