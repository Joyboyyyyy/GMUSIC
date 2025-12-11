# Fix Android Emulator Crash Issue

## Problem
Emulator crashes with error: `emulator @Medium_Phone_API_36.1 exited with non-zero code: 1`

## Step-by-Step Solution

### Step 1: Delete Broken Emulator Instances

**1.1 Delete emulator files:**
Open PowerShell as Administrator and run:
```powershell
# Delete all files in emulator folder
Remove-Item -Path "$env:LOCALAPPDATA\Android\Sdk\emulator\*" -Recurse -Force -ErrorAction SilentlyContinue

# Delete all AVDs
Remove-Item -Path "$env:USERPROFILE\.android\avd\*" -Recurse -Force -ErrorAction SilentlyContinue
```

**Or manually:**
- Navigate to: `C:\Users\Gretex\AppData\Local\Android\Sdk\emulator\`
- Delete everything inside this folder
- Navigate to: `C:\Users\Gretex\.android\avd\`
- Delete all folders inside this directory

### Step 2: Disable Hyper-V (if using Intel CPU)

**2.1 Check if Hyper-V is enabled:**
```powershell
Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All
```

**2.2 Disable Hyper-V (requires admin PowerShell):**
```powershell
Disable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All
```

**⚠️ IMPORTANT:** Restart your computer after running this command.

**2.3 Alternative - Disable Hyper-V using Control Panel:**
- Open "Turn Windows features on or off"
- Uncheck "Hyper-V"
- Restart computer

### Step 3: Verify Virtualization Settings (BIOS)

**3.1 Check if virtualization is enabled:**
```powershell
Get-ComputerInfo -Property "HyperV*"
```

**3.2 Enable VT-x in BIOS (if disabled):**
- Restart computer and enter BIOS (usually F2, F12, or Delete during boot)
- Look for "Virtualization Technology" or "Intel Virtualization Technology (VT-x)"
- Enable it
- Save and exit BIOS
- Reboot

### Step 4: Install Required Android SDK Components

**4.1 Open Android Studio:**
- Go to: **Tools → SDK Manager**
- Under **SDK Platforms** tab:
  - ✅ Check **Android 13.0 (API Level 33)** OR **Android 14.0 (API Level 34)**
  - ✅ Check **Show Package Details**
  - ✅ Check **Google APIs** and **Google Play** versions
  
- Under **SDK Tools** tab:
  - ✅ Check **Android Emulator**
  - ✅ Check **Android SDK Build-Tools**
  - ✅ Check **Android SDK Platform-Tools**
  - ✅ Check **Intel x86 Emulator Accelerator (HAXM installer)** (for Intel CPUs)

- Click **Apply** and wait for installation

**4.2 Verify installed components:**
```powershell
# Check SDK location
$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
Write-Host "SDK Path: $sdkPath"

# List installed platforms
Get-ChildItem "$sdkPath\platforms"

# List installed system images
Get-ChildItem "$sdkPath\system-images"
```

### Step 5: Create New Emulator in Android Studio

**5.1 Open Device Manager:**
- Android Studio → **Tools → Device Manager**
- Click **Create Device**

**5.2 Select Hardware:**
- Choose **Pixel 6** (or Pixel 5)
- Click **Next**

**5.3 Select System Image:**
- **IMPORTANT:** Select API Level **33** or **34** (NOT 30, 31, or 36)
- Choose **Google Play** image (not just Google APIs)
- Architecture: **x86_64** (NOT ARM)
- Click **Download** if needed, then **Next**

**5.4 Configure AVD:**
- AVD Name: `Pixel_6_API_33` (or similar)
- Click **Finish**

**5.5 Verify emulator:**
- In Device Manager, click **Play** button next to your emulator
- Wait for emulator to boot completely
- If it crashes, try:
  - Cold Boot: Click dropdown → **Cold Boot Now**
  - Check emulator logs: `%LOCALAPPDATA%\Android\Sdk\emulator\emulator-*.log`

### Step 6: Test Emulator from Command Line

**6.1 List available AVDs:**
```powershell
cd "$env:LOCALAPPDATA\Android\Sdk\emulator"
.\emulator -list-avds
```

**6.2 Start emulator manually:**
```powershell
.\emulator -avd Pixel_6_API_33 -verbose
```

**6.3 Check for errors:**
- Look for error messages in the console
- Common issues:
  - `HAXM not installed` → Install from SDK Manager
  - `VT-x not enabled` → Enable in BIOS
  - `Hyper-V conflict` → Disable Hyper-V and reboot

### Step 7: Run Expo Dev Client

**7.1 After emulator is working:**
```powershell
# Navigate to project
cd "C:\projectedit2\Gretex music Room"

# Start Expo with dev client
npx expo start --dev-client
```

**7.2 Connect to emulator:**
- Press `a` in Expo CLI to open on Android emulator
- OR manually: `npx expo run:android`

## Troubleshooting

### If emulator still crashes:

**1. Check emulator logs:**
```powershell
Get-Content "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator-*.log" -Tail 50
```

**2. Try different API level:**
- If API 33 crashes, try API 34
- If API 34 crashes, try API 33
- NEVER use API 30, 31, or 36

**3. Check disk space:**
- Emulators need ~2-4 GB free space
- Clear old AVDs: `Remove-Item "$env:USERPROFILE\.android\avd\*" -Recurse -Force`

**4. Verify HAXM installation (Intel only):**
```powershell
# Check if HAXM is installed
Test-Path "C:\Program Files\Intel\HAXM"

# Install HAXM manually if needed
# Download from: https://github.com/intel/haxm/releases
```

**5. Try software rendering:**
```powershell
# Start emulator with software graphics
cd "$env:LOCALAPPDATA\Android\Sdk\emulator"
.\emulator -avd Pixel_6_API_33 -gpu swiftshader_indirect
```

**6. Check Windows Defender/Antivirus:**
- Add emulator folder to exclusions:
  - `C:\Users\Gretex\AppData\Local\Android\Sdk\emulator`
  - `C:\Users\Gretex\.android`

## Quick Verification Checklist

- [ ] Deleted all files in `C:\Users\Gretex\AppData\Local\Android\Sdk\emulator\`
- [ ] Deleted all AVDs in `C:\Users\Gretex\.android\avd\`
- [ ] Disabled Hyper-V (if Intel CPU)
- [ ] Restarted computer after disabling Hyper-V
- [ ] Enabled VT-x in BIOS (if Intel CPU)
- [ ] Installed Android SDK Platform 33 or 34
- [ ] Installed Google Play x86_64 system image
- [ ] Installed Android Emulator from SDK Tools
- [ ] Created new Pixel 6 emulator with API 33/34
- [ ] Emulator boots successfully from Android Studio
- [ ] Emulator boots successfully from command line
- [ ] Expo dev client connects to emulator

## Additional Resources

- [Android Emulator Troubleshooting](https://developer.android.com/studio/run/emulator-troubleshooting)
- [HAXM Installation Guide](https://github.com/intel/haxm/wiki/Installation-Instructions-on-Windows)
- [Expo Development Build Guide](https://docs.expo.dev/development/build/)

