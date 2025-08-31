# deploy-all.ps1
#requires -Version 5.1
param(
  [string]$Root = $PSScriptRoot,
  [string[]]$Targets = @("apps\backend", "apps\frontend", "twilight-cell-b373")
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

# Ensure npm exists
$null = & npm -v 2>$null
if ($LASTEXITCODE -ne 0) { throw "npm not found in PATH" }

foreach ($t in $Targets) {
    $dir = Resolve-TargetPath $t
    Write-Host "Deploying in $dir"
    Push-Location $dir
    try {
        if (-not (Test-Path 'package.json')) { throw "package.json missing in $dir" }
        $pkg = Get-Content package.json -Raw | ConvertFrom-Json
        if (-not $pkg.scripts.deploy) { throw "No 'deploy' script in $dir\package.json" }
        npm run deploy
        if ($LASTEXITCODE -ne 0) { throw "npm run deploy failed in $dir with exit code $LASTEXITCODE" }
    } finally {
        Pop-Location
    }
}

Write-Host "All deployments completed"
