# PowerShell script to start Expo with correct API URL
# This ensures the environment variable is set before starting Expo

$env:EXPO_PUBLIC_API_URL = "http://192.168.100.40:3000"
Write-Host "✅ Set EXPO_PUBLIC_API_URL to: $env:EXPO_PUBLIC_API_URL" -ForegroundColor Green
Write-Host "🚀 Starting Expo development server..." -ForegroundColor Cyan
npm start

