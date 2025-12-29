# Network Error Fix

## ✅ Issue Identified

**Problem:** App trying to connect to `192.168.100.40:3000` but your computer's IP is `192.168.2.122`

**Solution:** Updated `LAN_IP` in `src/config/api.ts` to match your current IP address.

## 🔧 What Was Fixed

1. **Updated API Config** (`src/config/api.ts`)
   - Changed `LAN_IP` from `192.168.100.40` to `192.168.2.122`
   - This matches your current computer IP address

## ✅ Next Steps

1. **Restart Expo/React Native app** to pick up the new IP address
2. **Verify backend is running** on `http://192.168.2.122:3000`
3. **Test connection** - Login should work now

## 🔍 Verify Backend is Running

Check your backend terminal - you should see:
```
🚀 Gretex API running on:
- Local:   http://localhost:3000
- Network: http://192.168.2.122:3000
```

## 📱 Alternative: Use Environment Variable

Instead of hardcoding IP, you can set in `.env`:
```env
EXPO_PUBLIC_API_URL=http://192.168.2.122:3000
```

This takes priority over the `LAN_IP` constant.

## ⚠️ Note

If your IP changes (e.g., different Wi-Fi network), you'll need to:
1. Run `ipconfig` to get new IP
2. Update `LAN_IP` in `src/config/api.ts`
3. Or set `EXPO_PUBLIC_API_URL` in `.env`

