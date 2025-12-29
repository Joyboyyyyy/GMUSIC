# Mobile APK Setup - Backend Connection

## Quick Fix for APK Not Connecting to Backend

### Step 1: Start Backend Server
```bash
cd backend
npm run dev
```

The server will display your computer's IP address. Look for:
```
📱 Mobile Device Connection Info:
   Your computer's IP: 192.168.x.x
   Backend URL: http://192.168.x.x:3000
```

### Step 2: Update Frontend Configuration

**Option A: Using Environment Variable (Recommended)**

Create or update `.env` file in the root directory:
```env
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:3000
```

Replace `YOUR_COMPUTER_IP` with the IP shown when backend starts.

**Option B: Update app.config.js**

Edit `app.config.js`:
```javascript
extra: {
  apiUrl: 'http://YOUR_COMPUTER_IP:3000', // Replace with your IP
  // ...
}
```

**Option C: Update src/config/api.ts**

Edit `src/config/api.ts`:
```typescript
const LAN_IP = 'YOUR_COMPUTER_IP'; // Replace with your IP
```

### Step 3: Rebuild APK

After updating the IP:
```bash
# For development build
npx expo run:android

# For production APK
eas build --platform android
```

### Step 4: Verify Connection

1. Make sure your phone and computer are on the **same Wi-Fi network**
2. Make sure Windows Firewall allows connections on port 3000
3. Test connection: Open browser on phone and go to `http://YOUR_COMPUTER_IP:3000/health`

### Troubleshooting

**Phone can't connect:**
- Check both devices are on same Wi-Fi
- Check Windows Firewall allows port 3000
- Verify IP address is correct (run `ipconfig` on Windows)
- Try disabling VPN on phone

**Backend shows different IP:**
- The server auto-detects your IP
- Use the IP shown in server console output
- Update frontend config with that exact IP

**Still not working:**
- Check backend is listening on `0.0.0.0:3000` (not just localhost)
- Verify backend is running and accessible
- Check phone's network settings

