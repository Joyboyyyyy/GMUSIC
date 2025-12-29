# How to Fix BACKEND_URL for Email Verification

## Problem
Email verification links show `ERR_ADDRESS_UNREACHABLE` because `BACKEND_URL` in `.env` has wrong IP address.

## Solution

### Step 1: Find Your Current IP Address

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" under your Wi-Fi adapter (usually something like `192.168.1.xxx` or `192.168.0.xxx`)

**Mac/Linux:**
```bash
ifconfig
```
Look for "inet" address

### Step 2: Check What IP Your Server Detects

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Look for this in the console:
   ```
   📱 Mobile Device Connection Info:
      Your computer's IP: 192.168.x.x
      Backend URL: http://192.168.x.x:3000
   ```

3. **Use that IP address** in the next step

### Step 3: Update .env File

1. Open `backend/.env` file (create it if it doesn't exist)

2. Find or add this line:
   ```env
   BACKEND_URL=http://YOUR_ACTUAL_IP:3000
   ```

3. Replace `YOUR_ACTUAL_IP` with the IP shown in server console

   Example:
   ```env
   BACKEND_URL=http://192.168.1.100:3000
   ```

4. **Save the file**

### Step 4: Restart Backend Server

1. Stop the server (Ctrl+C)
2. Start it again:
   ```bash
   npm run dev
   ```

3. Verify it shows the correct IP:
   ```
   [Email] Backend URL: http://YOUR_IP:3000
   ```

### Step 5: Resend Verification Email

1. From your app, resend the verification email
2. The new email will use the correct IP address
3. Click the verify button - it should work now

## Quick Test

Before resending email, test if your phone can reach the backend:

1. On your phone's browser, go to:
   ```
   http://YOUR_IP:3000/health
   ```

2. If you see `{"success":true,"message":"Gretex API running"}` → Network is fine!
3. If you see error → Check firewall or network settings

## Common Issues

**IP Changed?**
- If your computer's IP changes (common with DHCP), update `BACKEND_URL` again
- Or use a static IP on your router

**Still Not Working?**
- Make sure phone and computer are on same Wi-Fi network
- Check Windows Firewall allows port 3000
- Try disabling VPN on phone
- Check antivirus isn't blocking connections

## Auto-Detection Fallback

If `BACKEND_URL` is not set in `.env`, the server will auto-detect your IP. However, setting it explicitly is recommended for reliability.

