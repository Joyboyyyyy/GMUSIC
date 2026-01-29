# Quick fix for physical phone connection
Write-Host ""
Write-Host "📱 PHYSICAL PHONE CONNECTION FIX" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Get WiFi IP
$wifiIP = "192.168.1.12"
Write-Host "✅ Your Computer's WiFi IP: $wifiIP" -ForegroundColor Green
Write-Host ""

# Test backend
Write-Host "Testing backend..." -ForegroundColor Yellow
try {
    $null = Invoke-RestMethod -Uri "http://${wifiIP}:3002/health" -TimeoutSec 3
    Write-Host "✅ Backend is running and accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend not accessible" -ForegroundColor Red
    Write-Host "   Start backend: cd backend; npm start" -ForegroundColor White
    exit 1
}
Write-Host ""

# Check .env
Write-Host "Checking .env configuration..." -ForegroundColor Yellow
$envContent = Get-Content .env -Raw
$expectedURL = "http://${wifiIP}:3002"
if ($envContent -match [regex]::Escape($expectedURL)) {
    Write-Host "✅ .env is correctly configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  Updating .env..." -ForegroundColor Yellow
    $envContent = $envContent -replace 'EXPO_PUBLIC_API_URL=.*', "EXPO_PUBLIC_API_URL=$expectedURL"
    Set-Content -Path .env -Value $envContent -NoNewline
    Write-Host "✅ .env updated" -ForegroundColor Green
}
Write-Host ""

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "🎯 NEXT STEPS:" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Make sure your phone is connected to the SAME WiFi" -ForegroundColor White
Write-Host "   (Check WiFi name on both devices)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Stop Expo if running (Ctrl+C)" -ForegroundColor White
Write-Host ""
Write-Host "3. Clear cache and restart:" -ForegroundColor White
Write-Host "   npx expo start --clear" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Scan QR code with Expo Go app" -ForegroundColor White
Write-Host ""
Write-Host "5. Try registering/logging in" -ForegroundColor White
Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "🔧 TROUBLESHOOTING:" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If still not working:" -ForegroundColor White
Write-Host "• Check phone WiFi: Settings > WiFi" -ForegroundColor Gray
Write-Host "• Check computer WiFi: Same network?" -ForegroundColor Gray
Write-Host "• Disable VPN if active" -ForegroundColor Gray
Write-Host "• Try restarting WiFi router" -ForegroundColor Gray
Write-Host ""
Write-Host "Backend URL: http://${wifiIP}:3002" -ForegroundColor Cyan
Write-Host ""
