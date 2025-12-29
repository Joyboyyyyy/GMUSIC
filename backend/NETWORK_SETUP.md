# 🔧 Windows Firewall Setup for Backend Network Access

## Problem
Mobile device cannot reach backend server running on Windows PC at `192.168.100.40:3000`.

## Solution: Configure Windows Firewall

### Step 1: Allow Node.js Through Windows Firewall

#### Method A: Using Windows Defender Firewall GUI

1. **Open Windows Defender Firewall:**
   - Press `Win + R`
   - Type: `wf.msc`
   - Press Enter

2. **Click "Inbound Rules"** in the left panel

3. **Click "New Rule..."** in the right panel

4. **Select "Program"** → Click Next

5. **Browse to Node.js executable:**
   - Click "Browse..."
   - Navigate to: `C:\Program Files\nodejs\node.exe`
   - (Or wherever Node.js is installed)
   - Click Next

6. **Select "Allow the connection"** → Click Next

7. **Check all profiles** (Domain, Private, Public) → Click Next

8. **Name it:** "Node.js - Allow Inbound" → Click Finish

9. **Repeat for Outbound Rules** (same steps, but select "Outbound Rules")

#### Method B: Using PowerShell (Admin)

```powershell
# Run PowerShell as Administrator

# Allow Node.js inbound
New-NetFirewallRule -DisplayName "Node.js - Allow Inbound" -Direction Inbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow

# Allow Node.js outbound
New-NetFirewallRule -DisplayName "Node.js - Allow Outbound" -Direction Outbound -Program "C:\Program Files\nodejs\node.exe" -Action Allow

# Allow port 3000 specifically (alternative method)
New-NetFirewallRule -DisplayName "Backend API - Port 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Step 2: Allow Port 3000 Specifically

#### Using Windows Defender Firewall GUI:

1. **Open Windows Defender Firewall** (`wf.msc`)

2. **Click "Inbound Rules"** → "New Rule..."

3. **Select "Port"** → Click Next

4. **Select "TCP"** and **"Specific local ports"**: `3000` → Click Next

5. **Select "Allow the connection"** → Click Next

6. **Check all profiles** (Domain, Private, Public) → Click Next

7. **Name it:** "Backend API - Port 3000" → Click Finish

#### Using PowerShell (Admin):

```powershell
New-NetFirewallRule -DisplayName "Backend API - Port 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Step 3: Verify Network Profile

1. **Check your network profile:**
   - Open "Network and Sharing Center"
   - Check if your WiFi is set to "Private" or "Public"

2. **If set to Public:**
   - Windows Firewall may block connections
   - Either:
     - Change network to "Private" (recommended for home/office)
     - OR ensure firewall rules allow Public networks (done in Step 1)

### Step 4: Test Connectivity

#### From Mobile Device:
1. Open browser on phone
2. Navigate to: `http://192.168.100.40:3000/health`
3. Should see: `{"status":"OK",...}`

#### From Command Line (on PC):
```bash
# Test if server is accessible
curl http://192.168.100.40:3000/health

# Or from another device on same network
curl http://192.168.100.40:3000/health
```

### Step 5: Verify Server is Binding Correctly

Ensure `backend/src/server.js` has:
```javascript
app.listen(PORT, "0.0.0.0", () => {
  // This allows connections from any network interface
});
```

**NOT:**
```javascript
app.listen(PORT, "localhost", () => {
  // This only allows local connections
});
```

---

## 🔍 Troubleshooting

### Issue: Still can't connect from mobile device

#### Check 1: Verify IP Address
```bash
# On Windows, run:
ipconfig

# Look for "IPv4 Address" under your WiFi adapter
# Should be something like: 192.168.x.x
# Update app.config.js if IP changed
```

#### Check 2: Verify Server is Running
```bash
# On PC, check if server is listening:
netstat -an | findstr :3000

# Should show: 0.0.0.0:3000 (listening on all interfaces)
```

#### Check 3: Test from PC Browser
```
http://localhost:3000/health
http://192.168.100.40:3000/health
```
Both should work if firewall is configured correctly.

#### Check 4: Temporarily Disable Firewall (Testing Only)
⚠️ **Only for testing - re-enable after!**

1. Open Windows Defender Firewall
2. Click "Turn Windows Defender Firewall on or off"
3. Turn off for Private network (temporarily)
4. Test connection
5. **Re-enable immediately after testing**

#### Check 5: Antivirus Software
- Some antivirus software has its own firewall
- Check antivirus settings and allow Node.js/port 3000

#### Check 6: Router/Network Issues
- Ensure phone and PC are on same WiFi network
- Some routers have "AP Isolation" enabled (prevents devices from talking to each other)
- Check router settings if connection still fails

---

## ✅ Verification Checklist

- [ ] Node.js allowed through Windows Firewall (Inbound + Outbound)
- [ ] Port 3000 allowed through Windows Firewall
- [ ] Network profile is "Private" (or firewall allows Public)
- [ ] Server is binding to `0.0.0.0` (not `localhost`)
- [ ] Server is running and accessible from PC browser
- [ ] Mobile device can access `http://192.168.100.40:3000/health`
- [ ] IP address in `app.config.js` matches actual PC IP

---

## 📝 Quick Reference

**Server IP:** `192.168.100.40` (update if changed)  
**Server Port:** `3000`  
**Health Check:** `http://192.168.100.40:3000/health`  
**Backend URL:** `http://192.168.100.40:3000`

**Update in:**
- `app.config.js` → `extra.apiUrl`
- `src/utils/api.ts` → `BASE_URL` fallback

---

## 🚀 After Setup

1. Restart backend server
2. Test from mobile browser: `http://192.168.100.40:3000/health`
3. If successful, restart Expo app
4. Test login/signup/forgot password flows

