# Run Full PayMesh Test Suite (Backend Pytest + Frontend Typecheck & Build)
Write-Host "Running Backend Pytest Suite..." -ForegroundColor Cyan
$backendPath = Join-Path $PSScriptRoot "..\backend"
Set-Location $backendPath
& ".\.venv\Scripts\pytest.exe" -v

if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nRunning Frontend Build Validation..." -ForegroundColor Cyan
$frontendPath = Join-Path $PSScriptRoot "..\frontend"
Set-Location $frontendPath
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nAll PayMesh verification checks PASSED!" -ForegroundColor Green
