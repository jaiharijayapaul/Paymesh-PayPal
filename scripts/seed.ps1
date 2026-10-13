# Seed PayMesh database with verified demo providers and test user
$backendPath = Join-Path $PSScriptRoot "..\backend"
Set-Location $backendPath
& ".\.venv\Scripts\python.exe" "seed.py"
