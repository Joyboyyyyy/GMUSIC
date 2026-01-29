# Fix VS Code TypeScript Issues
# This script helps resolve VS Code TypeScript path issues after project reorganization

Write-Host "Fixing VS Code TypeScript issues..." -ForegroundColor Green

# Remove VS Code workspace cache
$vscodeDir = ".vscode"
if (Test-Path $vscodeDir) {
    Write-Host "Clearing VS Code cache..." -ForegroundColor Yellow
    Remove-Item -Path "$vscodeDir/.ropeproject" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$vscodeDir/settings.json.bak" -Force -ErrorAction SilentlyContinue
}

# Clear TypeScript cache
Write-Host "Clearing TypeScript cache..." -ForegroundColor Yellow
Remove-Item -Path "frontend/node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "frontend/.expo" -Recurse -Force -ErrorAction SilentlyContinue

# Restart TypeScript in frontend
Write-Host "Restarting TypeScript service..." -ForegroundColor Yellow
Set-Location frontend
npx tsc --build --clean
npx tsc --noEmit
Set-Location ..

Write-Host "Done! Please restart VS Code and open the workspace file:" -ForegroundColor Green
Write-Host "  gretex-music-room.code-workspace" -ForegroundColor Cyan
Write-Host ""
Write-Host "In VS Code, you can also:" -ForegroundColor Yellow
Write-Host "  1. Press Ctrl+Shift+P" -ForegroundColor White
Write-Host "  2. Type 'TypeScript: Restart TS Server'" -ForegroundColor White
Write-Host "  3. Press Enter" -ForegroundColor White