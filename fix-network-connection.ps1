# Network Connection Fix Script
Write-Host "🔧 NETWORK CONNECTION FIX" -ForegroundColor Cyan
Write-Host "=" * 50
Write-Host ""

# 1. Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Not running as Administrator" -ForegroundColor Yellow
    Write-Host "   Some firewall fixes require admin rights" -ForegroundColor Yellow
    Write-Host ""
}

# 2. Check backend status
Write-Host "1️⃣  Checking Backend Server..." -ForegroundColor Yellow
$backendRunning = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue
if ($backendRunning) {
    Write-Host "   ✅ Backend is running on port 3002" -ForegroundColor Green
} else {
    Write-Host "   ❌ Backend is NOT running" -ForegroundColor Red
    Write-Host "   Start it with: cd backend; npm start" -ForegroundColor White
    exit 1
}

# 3. Get network info
Write-Host ""
Write-Host "2️⃣  Network Information..." -ForegroundColor Yellow
$wifiIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -like "*Wi-Fi*" -and $_.IPAddress -notlike "169.*"}).IPAddress
if ($wifiIP) {
    Write-Host "   ✅ Wi-Fi IP: $wifiIP" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  No Wi-Fi connection detected" -ForegroundColor Yellow
    $wifiIP = "192.168.1.12" # fallback
}

# 4. Test backend accessibility
Write-Host ""
Write-Host "3️⃣  Testing Backend Accessibility..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://${wifiIP}:3002/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✅ Backend is accessible at http://${wifiIP}:3002" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Cannot reach backend at http://${wifiIP}:3002" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
}

# 5. Add firewall rule (if admin)
Write-Host ""
Write-Host "4️⃣  Firewall Configuration..." -ForegroundColor Yellow
if ($isAdmin) {
    try {
        # Remove old rule if exists
        Remove-NetFirewallRule -DisplayName "Gretex Backend Port 3002" -ErrorAction SilentlyContinue
        
        # Add new rule
        New-NetFirewallRule -DisplayName "Gretex Backend Port 3002" `
            -Direction Inbound `
            -LocalPort 3002 `
            -Protocol TCP `
            -Action Allow `
            -Profile Any | Out-Null
        
        Write-Host "   ✅ Firewall rule added for port 3002" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Could not add firewall rule: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Skipping firewall config (requires admin)" -ForegroundColor Yellow
    Write-Host "   Run this script as Administrator to add firewall rule" -ForegroundColor White
}

# 6. Update .env file
Write-Host ""
Write-Host "5️⃣  Updating .env File..." -ForegroundColor Yellow
$envPath = ".env"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    $newURL = "http://${wifiIP}:3002"
    
    # Replace the API URL
    $envContent = $envContent -replace 'EXPO_PUBLIC_API_URL=.*', "EXPO_PUBLIC_API_URL=$newURL"
    
    Set-Content -Path $envPath -Value $envContent -NoNewline
    Write-Host "   ✅ Updated EXPO_PUBLIC_API_URL to: $newURL" -ForegroundColor Green
} else {
    Write-Host "   ❌ .env file not found" -ForegroundColor Red
}

# 7. Device-specific instructions
Write-Host ""
Write-Host "6️⃣  Device-Specific Instructions..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   📱 For Physical Android Device:" -ForegroundColor Cyan
Write-Host "      1. Connect phone to SAME Wi-Fi as computer" -ForegroundColor White
Write-Host "      2. Backend URL: http://${wifiIP}:3002" -ForegroundColor White
Write-Host "      3. Restart Expo: npx expo start --clear" -ForegroundColor White
Write-Host ""
Write-Host "   🖥️  For Android Emulator:" -ForegroundColor Cyan
Write-Host "      1. Use special IP: http://10.0.2.2:3002" -ForegroundColor White
Write-Host "      2. Update .env: EXPO_PUBLIC_API_URL=http://10.0.2.2:3002" -ForegroundColor White
Write-Host "      3. Restart Expo: npx expo start --clear" -ForegroundColor White
Write-Host ""
Write-Host "   🍎 For iOS Simulator:" -ForegroundColor Cyan
Write-Host "      1. Use localhost: http://localhost:3002" -ForegroundColor White
Write-Host "      2. Update .env: EXPO_PUBLIC_API_URL=http://localhost:3002" -ForegroundColor White
Write-Host "      3. Restart Expo: npx expo start --clear" -ForegroundColor White

# 8. Summary
Write-Host ""
Write-Host "=" * 50
Write-Host "✅ NEXT STEPS:" -ForegroundColor Green
Write-Host "=" * 50
Write-Host "1. Restart Expo with: npx expo start --clear" -ForegroundColor White
Write-Host "2. Make sure your device is on the SAME Wi-Fi" -ForegroundColor White
Write-Host "3. Try registering/logging in again" -ForegroundColor White
Write-Host ""
Write-Host "If still not working, you're using:" -ForegroundColor Yellow
Write-Host "  - Android Emulator? Update .env to: http://10.0.2.2:3002" -ForegroundColor White
Write-Host "  - Different network? Use ngrok (run: .\start-ngrok.ps1)" -ForegroundColor White
Write-Host ""
