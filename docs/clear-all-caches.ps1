# Complete cache clearing script for Expo dev client
Write-Host "🧹 Clearing ALL caches..." -ForegroundColor Cyan

# 1. Kill Metro bundler
Write-Host "Stopping Metro bundler..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Clear Expo cache
Write-Host "Clearing Expo cache..." -ForegroundColor Yellow
Remove-Item -Path "$env:USERPROFILE\.expo" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:USERPROFILE\.expo-cache" -Recurse -Force -ErrorAction SilentlyContinue

# 3. Clear Metro cache
Write-Host "Clearing Metro cache..." -ForegroundColor Yellow
Remove-Item -Path ".\.metro-cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:TEMP\metro-*" -Recurse -Force -ErrorAction SilentlyContinue

# 4. Clear node_modules cache
Write-Host "Clearing node_modules cache..." -ForegroundColor Yellow
Remove-Item -Path ".\node_modules\.cache" -Recurse -Force -ErrorAction SilentlyContinue

# 5. Clear Android build cache
Write-Host "Clearing Android build cache..." -ForegroundColor Yellow
Remove-Item -Path ".\android\.gradle" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".\android\app\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".\android\build" -Recurse -Force -ErrorAction SilentlyContinue

# 6. Uninstall app from device
Write-Host "Uninstalling app from device..." -ForegroundColor Yellow
& adb uninstall com.gretexmusicroom.app -ErrorAction SilentlyContinue

# 7. Clear device cache
Write-Host "Clearing device cache..." -ForegroundColor Yellow
& adb shell pm clear com.gretexmusicroom.app -ErrorAction SilentlyContinue

Write-Host "✅ All caches cleared!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: npx expo start --clear" -ForegroundColor White
Write-Host "2. Run: npx expo run:android" -ForegroundColor White
Write-Host "3. Shake device and tap 'Reload'" -ForegroundColor White
