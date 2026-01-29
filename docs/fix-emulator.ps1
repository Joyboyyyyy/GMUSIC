# Android Emulator Fix Script
# Run this script as Administrator

Write-Host "=== Android Emulator Fix Script ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Delete broken emulator instances
Write-Host "Step 1: Cleaning up broken emulator files..." -ForegroundColor Yellow

$emulatorPath = "$env:LOCALAPPDATA\Android\Sdk\emulator"
$avdPath = "$env:USERPROFILE\.android\avd"

if (Test-Path $emulatorPath) {
    Write-Host "  Deleting emulator files from: $emulatorPath" -ForegroundColor Gray
    Remove-Item -Path "$emulatorPath\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ Emulator files deleted" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Emulator path not found: $emulatorPath" -ForegroundColor Yellow
}

if (Test-Path $avdPath) {
    Write-Host "  Deleting AVD files from: $avdPath" -ForegroundColor Gray
    Remove-Item -Path "$avdPath\*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ AVD files deleted" -ForegroundColor Green
} else {
    Write-Host "  ⚠ AVD path not found: $avdPath" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Check Hyper-V status
Write-Host "Step 2: Checking Hyper-V status..." -ForegroundColor Yellow

$hyperVFeature = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All -ErrorAction SilentlyContinue

if ($hyperVFeature) {
    if ($hyperVFeature.State -eq "Enabled") {
        Write-Host "  ⚠ Hyper-V is ENABLED" -ForegroundColor Red
        Write-Host "  This can conflict with Android Emulator on Intel CPUs" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  To disable Hyper-V, run:" -ForegroundColor Cyan
        Write-Host "  Disable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All" -ForegroundColor White
        Write-Host ""
        Write-Host "  ⚠ RESTART REQUIRED after disabling Hyper-V" -ForegroundColor Red
    } else {
        Write-Host "  ✓ Hyper-V is disabled" -ForegroundColor Green
    }
} else {
    Write-Host "  ℹ Could not check Hyper-V status (may require admin privileges)" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Check virtualization status
Write-Host "Step 3: Checking virtualization support..." -ForegroundColor Yellow

try {
    $computerInfo = Get-ComputerInfo -ErrorAction SilentlyContinue
    Write-Host "  ℹ Check BIOS settings for VT-x/AMD-V if emulator fails" -ForegroundColor Gray
} catch {
    Write-Host "  ℹ Could not retrieve virtualization info" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Check Android SDK installation
Write-Host "Step 4: Checking Android SDK installation..." -ForegroundColor Yellow

$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"

if (Test-Path $sdkPath) {
    Write-Host "  ✓ SDK found at: $sdkPath" -ForegroundColor Green
    
    # Check for platforms
    $platformsPath = "$sdkPath\platforms"
    if (Test-Path $platformsPath) {
        $platforms = Get-ChildItem $platformsPath -ErrorAction SilentlyContinue
        Write-Host "  Installed platforms:" -ForegroundColor Gray
        foreach ($platform in $platforms) {
            Write-Host "    - $($platform.Name)" -ForegroundColor Gray
        }
    }
    
    # Check for system images
    $systemImagesPath = "$sdkPath\system-images"
    if (Test-Path $systemImagesPath) {
        $images = Get-ChildItem $systemImagesPath -Recurse -Directory -ErrorAction SilentlyContinue
        Write-Host "  Installed system images:" -ForegroundColor Gray
        foreach ($image in $images) {
            Write-Host "    - $($image.Name)" -ForegroundColor Gray
        }
    }
    
    # Check for emulator
    $emulatorExe = "$sdkPath\emulator\emulator.exe"
    if (Test-Path $emulatorExe) {
        Write-Host "  ✓ Android Emulator found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Android Emulator NOT found" -ForegroundColor Red
        Write-Host "  Install from: Android Studio → SDK Manager → SDK Tools → Android Emulator" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ Android SDK not found at: $sdkPath" -ForegroundColor Red
    Write-Host "  Install Android Studio and SDK first" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: List available AVDs
Write-Host "Step 5: Listing available AVDs..." -ForegroundColor Yellow

$emulatorPath = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
if (Test-Path $emulatorPath) {
    try {
        Push-Location "$env:LOCALAPPDATA\Android\Sdk\emulator"
        $avds = .\emulator.exe -list-avds 2>&1
        if ($avds) {
            Write-Host "  Available AVDs:" -ForegroundColor Gray
            foreach ($avd in $avds) {
                Write-Host "    - $avd" -ForegroundColor Gray
            }
        } else {
            Write-Host "  ⚠ No AVDs found. Create one in Android Studio → Device Manager" -ForegroundColor Yellow
        }
        Pop-Location
    } catch {
        Write-Host "  ⚠ Could not list AVDs: $_" -ForegroundColor Red
    }
} else {
    Write-Host "  ⚠ Emulator executable not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. If Hyper-V is enabled and you have Intel CPU:" -ForegroundColor Yellow
Write-Host "   - Run: Disable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All" -ForegroundColor White
Write-Host "   - Restart your computer" -ForegroundColor White
Write-Host ""
Write-Host "2. Open Android Studio → SDK Manager:" -ForegroundColor Yellow
Write-Host "   - Install Android SDK Platform 33 or 34" -ForegroundColor White
Write-Host "   - Install Google Play x86_64 System Image (API 33 or 34)" -ForegroundColor White
Write-Host "   - Install Android Emulator (SDK Tools)" -ForegroundColor White
Write-Host ""
Write-Host "3. Create new emulator:" -ForegroundColor Yellow
Write-Host "   - Android Studio → Device Manager → Create Device" -ForegroundColor White
Write-Host "   - Choose Pixel 6, API 33 or 34, Google Play, x86_64" -ForegroundColor White
Write-Host ""
Write-Host "4. Test emulator from Android Studio Device Manager" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. After emulator works, run:" -ForegroundColor Yellow
Write-Host "   npx expo start --dev-client" -ForegroundColor White
Write-Host ""

