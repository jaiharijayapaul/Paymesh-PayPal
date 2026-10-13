# Launch PayMesh Backend and Frontend Concurrently on Windows PowerShell
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting PayMesh AI Commerce Network" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$backendPath = Join-Path $PSScriptRoot "..\backend"
$frontendPath = Join-Path $PSScriptRoot "..\frontend"

# Launch Backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; .\.venv\Scripts\uvicorn app.main:app --reload --port 8000"

# Launch Frontend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"

Write-Host "✓ Backend running on: http://localhost:8000" -ForegroundColor Green
Write-Host "✓ API Docs available at: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "✓ Frontend running on: http://localhost:5173" -ForegroundColor Green
