# Start Expo with Ngrok for global access
Write-Host "🌍 Starting Expo with Ngrok for global access..." -ForegroundColor Cyan

# Kill any existing processes
Write-Host "Stopping existing processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process ngrok -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Start Expo in background
Write-Host "Starting Expo server..." -ForegroundColor Yellow
Start-Process -FilePath "npx" -ArgumentList "expo", "start", "--clear" -WindowStyle Hidden

# Wait for Expo to start
Write-Host "Waiting for Expo to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Start ngrok tunnel
Write-Host "Creating ngrok tunnel..." -ForegroundColor Yellow
Start-Process -FilePath "ngrok" -ArgumentList "http", "8081" -WindowStyle Normal

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 How to connect:" -ForegroundColor Cyan
Write-Host "1. Check ngrok window for public URL (https://xxxxx.ngrok.io)" -ForegroundColor White
Write-Host "2. Open Expo Go app" -ForegroundColor White
Write-Host "3. Tap 'Enter URL manually'" -ForegroundColor White
Write-Host "4. Enter: exp://xxxxx.ngrok.io:80" -ForegroundColor White
Write-Host ""
Write-Host "🌍 Now accessible from anywhere in the world!" -ForegroundColor Green