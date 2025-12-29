# Network Connection Troubleshooting Guide

## Quick Fix Checklist

### 1. Check if Backend Server is Running

Open a terminal in the `backend` folder and run:
```bash
cd backend
npm start
```

You should see:
```
✅ Database connected successfully
🚀 Gretex API running on:
- Local:   http://localhost:3000
- Network: http://YOUR_IP:3000
```

**If you don't see this, the backend is not running!**

### 2. Find Your Computer's IP Address

**Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually WiFi or Ethernet).

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" address (not 127.0.0.1).

### 3. Configure API URL Based on Your Setup

#### For Android Emulator:
The emulator uses a special IP to access your host machine:
- Set environment variable: `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`
- Or the app will automatically use this if no env var is set

#### For iOS Simulator:
The simulator can access localhost directly:
- Use: `http://localhost:3000`
- Or set: `EXPO_PUBLIC_API_URL=http://localhost:3000`

#### For Physical Device (Phone):
1. Find your computer's IP (from step 2)
2. Set environment variable: `EXPO_PUBLIC_API_URL=http://YOUR_IP:3000`
   - Example: `EXPO_PUBLIC_API_URL=http://192.168.1.12:3000`
3. Ensure phone and computer are on the **same WiFi network**
4. Test in phone browser: `http://YOUR_IP:3000/health`

### 4. Test Backend Connection

**From your computer's browser:**
```
http://localhost:3000/health
```
Should return: `{"success":true,"message":"Gretex Music Room API is running..."}`

**From your phone's browser (if using physical device):**
```
http://YOUR_IP:3000/health
```
Should return the same JSON response.

### 5. Windows Firewall Issues

If the backend is running but phone can't connect:

1. **Allow Node.js through Firewall:**
   - Open Windows Defender Firewall
   - Click "Allow an app or feature through Windows Defender Firewall"
   - Find "Node.js" and check both "Private" and "Public"
   - If not listed, click "Allow another app" and add Node.js

2. **Or temporarily disable firewall to test:**
   - Only for testing! Re-enable after confirming connection works.

### 6. Common Issues and Solutions

#### Issue: "ECONNREFUSED" or "Network Error"
**Solution:** Backend server is not running. Start it with `npm start` in the backend folder.

#### Issue: "Timeout" error
**Solution:** 
- Check if backend is actually running
- Verify IP address is correct
- Check firewall settings
- Ensure phone and computer are on same network

#### Issue: Works on emulator but not physical device
**Solution:**
- Physical devices need the actual IP address, not localhost
- Set `EXPO_PUBLIC_API_URL` to your computer's IP
- Verify both devices are on same WiFi network

#### Issue: IP address changed
**Solution:**
- Your router may assign a new IP when you reconnect
- Check your IP again with `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Update `EXPO_PUBLIC_API_URL` environment variable

### 7. Setting Environment Variables

**For Expo/React Native:**
Create a `.env` file in the root directory:
```
EXPO_PUBLIC_API_URL=http://192.168.1.12:3000
```

Or set it when starting the app:
```bash
# Windows PowerShell
$env:EXPO_PUBLIC_API_URL="http://192.168.100.40:3000"; npm start

# Windows CMD
set EXPO_PUBLIC_API_URL=http://192.168.1.12:3000 && npm start

# Mac/Linux
EXPO_PUBLIC_API_URL=http://192.168.1.12:3000 npm start
```

### 8. Verify Database Connection

The backend needs a database connection. Check the backend console for:
- ✅ `Database connected successfully` - Good!
- ❌ `Database connection failed` - Check your database configuration

### 9. Still Not Working?

1. **Check backend logs** for any errors
2. **Verify port 3000 is not in use** by another application
3. **Try a different port** by setting `PORT=3001` in backend `.env` file
4. **Check router settings** - some routers block device-to-device communication
5. **Try using your computer's hostname** instead of IP (if on same network)

## Quick Test Script

Run this in your backend folder to verify everything:
```bash
# Start backend
npm start

# In another terminal, test health endpoint
curl http://localhost:3000/health
```

If this works, your backend is fine. The issue is with the mobile app connection.

