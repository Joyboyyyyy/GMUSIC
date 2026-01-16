# Start ngrok tunnel for backend
Write-Host "🚀 Starting ngrok tunnel for backend..." -ForegroundColor Cyan
Write-Host ""

# Check if ngrok is installed
if (!(Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Host "❌ ngrok is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install ngrok:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://ngrok.com/download" -ForegroundColor White
    Write-Host "2. Extract and add to PATH" -ForegroundColor White
    Write-Host "3. Sign up and get auth token: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor White
    Write-Host "4. Run: ngrok config add-authtoken <your-token>" -ForegroundColor White
    exit 1
}

Write-Host "✅ ngrok found" -ForegroundColor Green
Write-Host ""
Write-Host "Starting tunnel on port 3002..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT: Copy the HTTPS URL and update .env file:" -ForegroundColor Cyan
Write-Host "   EXPO_PUBLIC_API_URL=<ngrok-https-url>" -ForegroundColor White
Write-Host ""

# Start ngrok
ngrok http 3002
