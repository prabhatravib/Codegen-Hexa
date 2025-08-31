@echo off
REM Codegen-Hexa Deployment Script (Batch)
REM This script builds and deploys both backend and frontend to Cloudflare Workers

setlocal enabledelayedexpansion

echo [INFO] Starting Codegen-Hexa deployment...
echo ==========================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Please run this script from the project root directory
    pause
    exit /b 1
)

if not exist "pnpm-workspace.yaml" (
    echo [ERROR] Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] pnpm is not installed. Please install it first: npm install -g pnpm
    pause
    exit /b 1
)

REM Check if wrangler is installed
wrangler --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] wrangler is not installed globally. Installing it...
    pnpm add -g wrangler
)

REM Check Cloudflare authentication
echo [INFO] Checking Cloudflare authentication...
wrangler whoami >nul 2>&1
if errorlevel 1 (
    echo [ERROR] You are not logged into Cloudflare. Please run 'wrangler login' first.
    pause
    exit /b 1
)
echo [SUCCESS] Cloudflare authentication verified

REM Install dependencies
echo [INFO] Installing dependencies...
pnpm install
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Dependencies installed successfully

REM Build backend
echo [INFO] Building backend...
cd apps\backend
pnpm run build
if errorlevel 1 (
    echo [ERROR] Backend build failed
    cd ..\..
    pause
    exit /b 1
)
echo [SUCCESS] Backend built successfully
cd ..\..

REM Build frontend
echo [INFO] Building frontend...
cd apps\frontend
pnpm run build
if errorlevel 1 (
    echo [ERROR] Frontend build failed
    cd ..\..
    pause
    exit /b 1
)
echo [SUCCESS] Frontend built successfully
cd ..\..

REM Deploy backend
echo [INFO] Deploying backend to Cloudflare Workers...
cd apps\backend
pnpm run deploy
if errorlevel 1 (
    echo [ERROR] Backend deployment failed
    cd ..\..
    pause
    exit /b 1
)
echo [SUCCESS] Backend deployed successfully
cd ..\..

REM Deploy frontend
echo [INFO] Deploying frontend to Cloudflare Workers...
cd apps\frontend
pnpm run deploy
if errorlevel 1 (
    echo [ERROR] Frontend deployment failed
    cd ..\..
    pause
    exit /b 1
)
echo [SUCCESS] Frontend deployed successfully
cd ..\..

echo ==========================================
echo [SUCCESS] Deployment completed successfully! 🚀
echo [INFO] Your applications are now live on Cloudflare Workers
pause
