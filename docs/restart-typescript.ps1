# Restart TypeScript Server Script
# This script helps clear TypeScript cache issues in VS Code

Write-Host "🔄 Restarting TypeScript Server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Please follow these steps in VS Code:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Press Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)" -ForegroundColor White
Write-Host "2. Type: TypeScript: Restart TS Server" -ForegroundColor White
Write-Host "3. Press Enter" -ForegroundColor White
Write-Host ""
Write-Host "Alternative method:" -ForegroundColor Yellow
Write-Host "1. Press Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)" -ForegroundColor White
Write-Host "2. Type: Developer: Reload Window" -ForegroundColor White
Write-Host "3. Press Enter" -ForegroundColor White
Write-Host ""
Write-Host "✅ This will clear the stale TypeScript cache" -ForegroundColor Green
Write-Host ""

# Optional: Try to clear TypeScript cache folders (cross-platform)
$tsCache = $null

# Detect OS and set appropriate cache path
if ($IsWindows -or $env:OS -eq "Windows_NT") {
    $tsCache = "$env:LOCALAPPDATA\Microsoft\TypeScript"
} elseif ($IsMacOS -or (Test-Path "/Users")) {
    $tsCache = "$env:HOME/Library/Caches/typescript"
} elseif ($IsLinux -or (Test-Path "/home")) {
    $tsCache = "$env:HOME/.cache/typescript"
}

if ($tsCache -and (Test-Path $tsCache)) {
    Write-Host "Found TypeScript cache at: $tsCache" -ForegroundColor Cyan
    $response = Read-Host "Do you want to delete it? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        try {
            Remove-Item -Recurse -Force $tsCache -ErrorAction Stop
            Write-Host "✅ TypeScript cache cleared!" -ForegroundColor Green
            Write-Host "Please restart VS Code for changes to take effect." -ForegroundColor Yellow
        } catch {
            Write-Host "❌ Failed to clear cache: $_" -ForegroundColor Red
        }
    }
} elseif ($tsCache) {
    Write-Host "TypeScript cache not found at: $tsCache" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  Could not detect OS-specific cache location" -ForegroundColor Yellow
    Write-Host "Please manually clear TypeScript cache for your OS:" -ForegroundColor White
    Write-Host "  Windows: %LOCALAPPDATA%\Microsoft\TypeScript" -ForegroundColor Gray
    Write-Host "  Mac: ~/Library/Caches/typescript" -ForegroundColor Gray
    Write-Host "  Linux: ~/.cache/typescript" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
