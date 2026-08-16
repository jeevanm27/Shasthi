[CmdletBinding()]
param(
  [switch]$NoBuild,
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

try {
  docker version --format '{{.Server.Version}}' | Out-Null
} catch {
  Write-Error 'Docker Desktop is not running. Start Docker Desktop, wait for it to finish starting, then run this script again.'
  exit 1
}

$composeArgs = @('compose', 'up', '-d')
if (-not $NoBuild) { $composeArgs += '--build' }

Write-Host 'Starting Shasthi Masala...' -ForegroundColor Cyan
& docker @composeArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$website = 'http://localhost:3000'
Write-Host 'Waiting for the website to become available...' -ForegroundColor DarkCyan
$ready = $false
for ($attempt = 1; $attempt -le 30; $attempt++) {
  try {
    $response = Invoke-WebRequest -Uri $website -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -eq 200) { $ready = $true; break }
  } catch { Start-Sleep -Seconds 2 }
}

if (-not $ready) {
  Write-Warning "The containers started, but the website is not ready yet. Check status with: docker compose ps"
  exit 1
}

Write-Host "Shasthi Masala is ready at $website" -ForegroundColor Green
if (-not $NoBrowser) { Start-Process $website }
