# Fix All Issues - Automated Script
# This script fixes all issues that can be automated

Write-Host "🚀 Fixing All Issues Automatically..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Clear TypeScript Cache
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Step 1: Clearing TypeScript Cache" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

$tsCachePaths = @(
    "$env:LOCALAPPDATA\Microsoft\TypeScript",
    "$env:TEMP\typescript"
)

foreach ($path in $tsCachePaths) {
    if (Test-Path $path) {
        try {
            Remove-Item -Recurse -Force $path -ErrorAction Stop
            Write-Host "✅ Cleared: $path" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Could not clear: $path" -ForegroundColor Yellow
        }
    } else {
        Write-Host "ℹ️  Not found: $path" -ForegroundColor Gray
    }
}

Write-Host ""

# Step 2: Clear Metro Cache
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Step 2: Clearing Metro Bundler Cache" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

$metroCachePaths = @(
    "$env:LOCALAPPDATA\Temp\metro-*",
    "$env:LOCALAPPDATA\Temp\react-*",
    "$env:LOCALAPPDATA\Temp\haste-map-*"
)

foreach ($pattern in $metroCachePaths) {
    $items = Get-ChildItem -Path (Split-Path $pattern -Parent) -Filter (Split-Path $pattern -Leaf) -ErrorAction SilentlyContinue
    foreach ($item in $items) {
        try {
            Remove-Item -Recurse -Force $item.FullName -ErrorAction Stop
            Write-Host "✅ Cleared: $($item.Name)" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Could not clear: $($item.Name)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# Step 3: Clear Node Modules Cache
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "Step 3: Clearing Node Modules Cache" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

if (Test-Path ".\node_modules\.cache") {
    try {
        Remove-Item -Recurse -Force ".\node_modules\.cache" -ErrorAction Stop
        Write-Host "✅ Cleared: node_modules\.cache" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not clear node_modules cache" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  No node_modules cache found" -ForegroundColor Gray
}

Write-Host ""

# Step 4: Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "✅ Automated Fixes Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

Write-Host "📋 What was fixed:" -ForegroundColor Cyan
Write-Host "  ✅ TypeScript cache cleared" -ForegroundColor White
Write-Host "  ✅ Metro bundler cache cleared" -ForegroundColor White
Write-Host "  ✅ Node modules cache cleared" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  Manual Action Required:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  In VS Code, you MUST restart the TypeScript server:" -ForegroundColor White
Write-Host ""
Write-Host "  1. Press Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)" -ForegroundColor Cyan
Write-Host "  2. Type: TypeScript: Restart TS Server" -ForegroundColor Cyan
Write-Host "  3. Press Enter" -ForegroundColor Cyan
Write-Host ""
Write-Host "  This will fix the BookingInvoiceScreen.tsx error." -ForegroundColor White
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host "📚 Next Steps:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "1. Restart TypeScript Server (see above)" -ForegroundColor White
Write-Host "2. Restart backend: cd backend && npm start" -ForegroundColor White
Write-Host "3. Rebuild Android: npx expo run:android" -ForegroundColor White
Write-Host ""
Write-Host "See FINAL_FIX_GUIDE.md for complete instructions." -ForegroundColor Gray
Write-Host ""

# Pause to show results
Write-Host "Press any key to exit..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
