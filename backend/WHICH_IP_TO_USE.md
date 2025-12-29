# Which IP Address to Use for BACKEND_URL?

## Answer: Your Computer's LAN IP Address

### What is BACKEND_URL?
`BACKEND_URL` is used in verification emails. When users click the verify link, their phone needs to reach your backend server.

### Which IP Should You Use?

**Use your computer's LAN (Local Area Network) IP address** - NOT localhost!

- ✅ **CORRECT**: `http://192.168.1.100:3000` (your LAN IP)
- ❌ **WRONG**: `http://localhost:3000` (won't work from phone)
- ❌ **WRONG**: `http://127.0.0.1:3000` (won't work from phone)

### How to Find Your IP Address

#### Method 1: Check Server Console (Easiest)

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Look for this output:
   ```
   📱 Mobile Device Connection Info:
      Your computer's IP: 192.168.1.100  ← USE THIS IP
      Backend URL: http://192.168.1.100:3000
   ```

3. **Copy that IP address** and use it in .env:
   ```env
   BACKEND_URL=http://192.168.1.100:3000
   ```

#### Method 2: Use Command Line

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your Wi-Fi adapter:
```
Wireless LAN adapter Wi-Fi:
   IPv4 Address. . . . . . . . . . . : 192.168.1.100  ← USE THIS
```

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" address:
```
en0: flags=8863<UP,BROADCAST,SMART,RUNNING,SIMPLEX,MULTICAST>
    inet 192.168.1.100 netmask 0xffffff00  ← USE THIS
```

### Example .env File

```env
# Backend URL (for email verification links)
# Use your computer's LAN IP address (NOT localhost!)
# Find it by running: ipconfig (Windows) or ifconfig (Mac/Linux)
# Or check the server console when it starts
BACKEND_URL=http://192.168.1.100:3000
```

### Important Notes

1. **Same Wi-Fi Network**: Your phone and computer must be on the same Wi-Fi network
2. **IP May Change**: If your router uses DHCP, your IP might change. You may need to update BACKEND_URL if it changes
3. **Static IP (Optional)**: For production, consider setting a static IP on your router

### Quick Test

After setting BACKEND_URL, test if your phone can reach it:

1. On your phone's browser, go to:
   ```
   http://YOUR_IP:3000/health
   ```

2. If you see `{"success":true,"message":"Gretex API running"}` → ✅ It works!
3. If you see error → Check firewall or network settings

### Common IP Address Ranges

- `192.168.1.x` (most common)
- `192.168.0.x`
- `192.168.2.x`
- `10.0.0.x`

All of these are fine - just use whatever your computer shows!

### Still Confused?

1. **Start your backend server**
2. **Look at the console output** - it shows your IP
3. **Copy that IP** into .env as `BACKEND_URL=http://THAT_IP:3000`
4. **Restart server** and resend verification email

That's it! 🎯

