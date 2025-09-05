# deploy-all.ps1
#requires -Version 5.1
param(
  [string]$Root = $PSScriptRoot
)

$ErrorActionPreference = 'Stop'
if (-not $Root) { $Root = (Get-Location).Path }

function Resolve-TargetPath {
    param([string]$rel)
    $p = Join-Path $Root $rel
    if (Test-Path $p) { return (Resolve-Path $p).Path }

    $leaf = Split-Path $rel -Leaf
    $m = Get-ChildItem -Directory -Recurse -Path $Root -Filter $leaf -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($m) { return $m.FullName }
    throw "Path not found: $rel under root $Root"
}

# Ensure pnpm exists
$null = & pnpm -v 2>$null
if ($LASTEXITCODE -ne 0) { throw "pnpm not found in PATH" }

Write-Host "Starting complete deployment process..." -ForegroundColor Green

# Step 1: Install all dependencies
Write-Host "Installing all dependencies..." -ForegroundColor Yellow
Push-Location $Root
try {
    pnpm install
    if ($LASTEXITCODE -ne 0) { throw "pnpm install failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

# Step 2: Build all projects
Write-Host "Building all projects..." -ForegroundColor Yellow

# Build frontend
Write-Host "  Building frontend..." -ForegroundColor Cyan
$frontendDir = Resolve-TargetPath "apps\frontend"
Push-Location $frontendDir
try {
    pnpm run build
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

# Build backend
Write-Host "  Building backend..." -ForegroundColor Cyan
$backendDir = Resolve-TargetPath "apps\backend"
Push-Location $backendDir
try {
    pnpm run build
    if ($LASTEXITCODE -ne 0) { throw "Backend build failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

# Build marimo container
Write-Host "  Building marimo container..." -ForegroundColor Cyan
$marimoDir = Resolve-TargetPath "twilight-cell-b373"
Push-Location $marimoDir
try {
    pnpm install
    if ($LASTEXITCODE -ne 0) { throw "Marimo container pnpm install failed with exit code $LASTEXITCODE" }
    pnpm run build
    if ($LASTEXITCODE -ne 0) { throw "Marimo container build failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

# Step 3: Deploy all projects
Write-Host "Deploying all projects..." -ForegroundColor Yellow

# Deploy marimo container from twilight-cell-b373 (uses its wrangler.jsonc)
Write-Host "  Deploying marimo container..." -ForegroundColor Cyan
Push-Location $marimoDir
try {
    if (-not (Test-Path 'wrangler.jsonc')) { throw "wrangler.jsonc missing in twilight-cell-b373" }
    # Use the package script so we leverage local wrangler config
    pnpm run deploy
    if ($LASTEXITCODE -ne 0) { throw "Marimo container deployment failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

# Deploy backend
Write-Host "  Deploying backend..." -ForegroundColor Cyan
Push-Location $backendDir
try {
    pnpm run deploy
    if ($LASTEXITCODE -ne 0) { throw "Backend deployment failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

# Deploy frontend
Write-Host "  Deploying frontend..." -ForegroundColor Cyan
Push-Location $frontendDir
try {
    pnpm run deploy
    if ($LASTEXITCODE -ne 0) { throw "Frontend deployment failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

Write-Host "All deployments completed successfully!" -ForegroundColor Green
