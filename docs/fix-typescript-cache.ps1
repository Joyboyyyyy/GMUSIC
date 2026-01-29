# Fix TypeScript Cache Issues
# This script clears TypeScript cache and restarts the language server

Write-Host "🔧 Fixing TypeScript Cache Issues..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Clear TypeScript cache folders
Write-Host "Step 1: Clearing TypeScript cache folders..." -ForegroundColor Yellow

$tsCachePaths = @(
    "$env:LOCALAPPDATA\Microsoft\TypeScript",
    "$env:TEMP\typescript",
    ".\.vscode",
    ".\node_modules\.cache"
)

foreach ($path in $tsCachePaths) {
    if (Test-Path $path) {
        try {
            Write-Host "  Removing: $path" -ForegroundColor Gray
            Remove-Item -Recurse -Force $path -ErrorAction Stop
            Write-Host "  ✅ Cleared: $path" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️  Could not clear: $path" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "Step 2: Clearing Metro bundler cache..." -ForegroundColor Yellow
try {
    npx expo start --clear
    Write-Host "  ✅ Metro cache cleared" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Metro cache clear skipped (run manually if needed)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Cache clearing complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "1. In VS Code, press Ctrl+Shift+P" -ForegroundColor White
Write-Host "2. Type: TypeScript: Restart TS Server" -ForegroundColor White
Write-Host "3. Press Enter" -ForegroundColor White
Write-Host ""
Write-Host "Alternative: Press Ctrl+Shift+P and type 'Developer: Reload Window'" -ForegroundColor Yellow
Write-Host ""
Write-Host "The BookingInvoiceScreen.tsx error should disappear after restarting TS Server." -ForegroundColor Green
Write-Host ""
