$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "Created .env from .env.example"
}

Write-Host ""
Write-Host "Local setup files are ready."
Write-Host "Next step:"
Write-Host "1. Start Docker Desktop"
Write-Host "2. Run: npm run docker:up"
