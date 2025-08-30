# deploy-all.ps1
#requires -Version 5.1
param(
  [string[]]$Targets = @("apps\backend", "apps\frontend", "twilight-cell-b373")
)

$ErrorActionPreference = 'Stop'

# Find repo root via git, else use current directory
$gitTop = & git rev-parse --show-toplevel 2>$null
$root = if ($LASTEXITCODE -eq 0 -and $gitTop) { $gitTop.Trim() } else { (Get-Location).Path }

function Resolve-TargetPath {
    param([string]$rel)
    $candidate = Join-Path $root $rel
    if (Test-Path $candidate) { return (Resolve-Path $candidate).Path }

    $leaf = Split-Path $rel -Leaf
    if ($leaf -in @('backend','frontend')) {
        $matches = Get-ChildItem -Directory -Recurse -Path $root -Filter $leaf -ErrorAction SilentlyContinue |
            Where-Object { $_.Parent -and $_.Parent.Name -eq 'apps' }
    } else {
        $matches = Get-ChildItem -Directory -Recurse -Path $root -Filter $leaf -ErrorAction SilentlyContinue
    }
    if ($matches) { return $matches[0].FullName }
    throw "Path not found: $rel under root $root"
}

foreach ($t in $Targets) {
    $dir = Resolve-TargetPath $t
    Write-Host "Deploying in $dir"
    Push-Location $dir
    try {
        npm run deploy
        if ($LASTEXITCODE -ne 0) { throw "npm run deploy failed in $dir with exit code $LASTEXITCODE" }
    } finally {
        Pop-Location
    }
}

Write-Host "All deployments completed"
