# Email Verification Troubleshooting

## Issue: ERR_ADDRESS_UNREACHABLE

If you see "ERR_ADDRESS_UNREACHABLE" when clicking the verify email link, follow these steps:

### Step 1: Check Backend Server is Running

1. Go to your backend directory
2. Run: `npm run dev`
3. Look for the IP address shown in console:
   ```
   📱 Mobile Device Connection Info:
      Your computer's IP: 192.168.x.x
      Backend URL: http://192.168.x.x:3000
   ```

### Step 2: Verify IP Address in Email Matches Server

The email should use the same IP shown when server starts. If it doesn't match:

1. **Set BACKEND_URL in .env file:**
   ```env
   BACKEND_URL=http://YOUR_ACTUAL_IP:3000
   ```
   Replace `YOUR_ACTUAL_IP` with the IP shown in server console.

2. **Restart backend server** after updating .env

3. **Resend verification email** (the new email will use correct IP)

### Step 3: Check Network Connection

1. **Same Wi-Fi Network**: Phone and computer must be on the same Wi-Fi
2. **Test Connection**: On your phone's browser, try: `http://YOUR_IP:3000/health`
   - If this works, the network is fine
   - If this fails, check firewall (Step 4)

### Step 4: Check Windows Firewall

1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Make sure Node.js is allowed (or add port 3000)
4. Or temporarily disable firewall to test

### Step 5: Alternative - Use App Directly

Instead of clicking email link:

1. Open the app on your phone
2. Go to login/signup screen
3. Use "Resend Verification" option
4. Enter verification code in app (if available)

### Step 6: Check IP Address Changed

If your computer's IP changed:

1. Check current IP: Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Update BACKEND_URL in .env with new IP
3. Restart server
4. Resend verification email

### Quick Fix

1. **Find your current IP:**
   ```bash
   # Windows
   ipconfig
   # Look for "IPv4 Address" under your Wi-Fi adapter
   
   # Mac/Linux
   ifconfig
   # Look for "inet" address
   ```

2. **Update .env file:**
   ```env
   BACKEND_URL=http://YOUR_CURRENT_IP:3000
   ```

3. **Restart backend:**
   ```bash
   npm run dev
   ```

4. **Resend verification email** from the app

### Still Not Working?

1. Check backend server console for errors
2. Verify phone and computer are on same Wi-Fi
3. Try accessing `http://YOUR_IP:3000/health` from phone browser
4. Check if antivirus is blocking connections
5. Try using mobile hotspot instead of Wi-Fi

