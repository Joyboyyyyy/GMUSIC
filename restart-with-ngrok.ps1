# Complete restart with ngrok setup
Write-Host "🔄 Restarting everything with ngrok..." -ForegroundColor Cyan

# 1. Kill all processes
Write-Host "Stopping all processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Wait for cleanup
Start-Sleep -Seconds 3

# 3. Start backend
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "backend" -WindowStyle Hidden

# 4. Wait for backend to start
Start-Sleep -Seconds 8

# 5. Start ngrok for backend
Write-Host "Starting ngrok tunnel for backend..." -ForegroundColor Yellow
Start-Process -FilePath "ngrok" -ArgumentList "http", "3002" -WindowStyle Normal

# 6. Wait for ngrok
Start-Sleep -Seconds 5

# 7. Get ngrok URL
Write-Host "Getting ngrok URL..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
    $json = $response.Content | ConvertFrom-Json
    $ngrokUrl = $json.tunnels[0].public_url
    Write-Host "✅ Ngrok URL: $ngrokUrl" -ForegroundColor Green
    
    # 8. Update .env file
    Write-Host "Updating .env file..." -ForegroundColor Yellow
    $envContent = Get-Content ".env" -Raw
    $envContent = $envContent -replace "EXPO_PUBLIC_API_URL=.*", "EXPO_PUBLIC_API_URL=$ngrokUrl"
    Set-Content ".env" $envContent
    Write-Host "✅ .env updated with: $ngrokUrl" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Could not get ngrok URL. Check ngrok window manually." -ForegroundColor Red
}

# 9. Start Expo with tunnel
Write-Host "Starting Expo with tunnel..." -ForegroundColor Yellow
Start-Process -FilePath "npx" -ArgumentList "expo", "start", "--tunnel", "--clear" -WindowStyle Normal

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Next steps:" -ForegroundColor Cyan
Write-Host "1. Check ngrok window for backend URL" -ForegroundColor White
Write-Host "2. Scan QR code in Expo window" -ForegroundColor White
Write-Host "3. App should now work from anywhere!" -ForegroundColor White