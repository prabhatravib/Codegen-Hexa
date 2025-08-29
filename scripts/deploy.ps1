# Codegen-Hexa Deployment Script (PowerShell)
# This script builds and deploys both backend and frontend to Cloudflare Workers

# Set error action preference to stop on errors
$ErrorActionPreference = "Stop"

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"
$White = "White"

# Logging functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

# Check if we're in the right directory
if (-not (Test-Path "package.json") -or -not (Test-Path "pnpm-workspace.yaml")) {
    Write-Error "Please run this script from the project root directory"
    exit 1
}

# Check if pnpm is installed
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Error "pnpm is not installed. Please install it first: npm install -g pnpm"
    exit 1
}

# Check if wrangler is installed
if (-not (Get-Command wrangler -ErrorAction SilentlyContinue)) {
    Write-Warning "wrangler is not installed globally. Installing it..."
    pnpm add -g wrangler
}

# Function to check if user is logged into Cloudflare
function Test-CloudflareAuth {
    try {
        wrangler whoami | Out-Null
        Write-Success "Cloudflare authentication verified"
    }
    catch {
        Write-Error "You are not logged into Cloudflare. Please run 'wrangler login' first."
        exit 1
    }
}

# Function to install dependencies
function Install-Dependencies {
    Write-Info "Installing dependencies..."
    pnpm install
    Write-Success "Dependencies installed successfully"
}

# Function to build backend
function Build-Backend {
    Write-Info "Building backend..."
    Push-Location "apps/backend"
    try {
        pnpm run build
        Write-Success "Backend built successfully"
    }
    finally {
        Pop-Location
    }
}

# Function to build frontend
function Build-Frontend {
    Write-Info "Building frontend..."
    Push-Location "apps/frontend"
    try {
        pnpm run build
        Write-Success "Frontend built successfully"
    }
    finally {
        Pop-Location
    }
}

# Function to deploy backend
function Deploy-Backend {
    Write-Info "Deploying backend to Cloudflare Workers..."
    Push-Location "apps/backend"
    try {
        pnpm run deploy
        Write-Success "Backend deployed successfully"
    }
    finally {
        Pop-Location
    }
}

# Function to deploy frontend
function Deploy-Frontend {
    Write-Info "Deploying frontend to Cloudflare Workers..."
    Push-Location "apps/frontend"
    try {
        pnpm run deploy
        Write-Success "Frontend deployed successfully"
    }
    finally {
        Pop-Location
    }
}

# Main deployment function
function Start-Deployment {
    Write-Info "Starting Codegen-Hexa deployment..."
    Write-Host "==========================================" -ForegroundColor $White
    
    # Check authentication
    Test-CloudflareAuth
    
    # Install dependencies
    Install-Dependencies
    
    # Build both applications
    Write-Info "Building applications..."
    Build-Backend
    Build-Frontend
    
    # Deploy in sequence (backend first, then frontend)
    Write-Info "Starting deployment sequence..."
    Deploy-Backend
    Deploy-Frontend
    
    Write-Host "==========================================" -ForegroundColor $White
    Write-Success "Deployment completed successfully! 🚀"
    Write-Info "Your applications are now live on Cloudflare Workers"
}

# Run main deployment function
Start-Deployment
