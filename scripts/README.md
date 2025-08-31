# Deployment Scripts

This directory contains deployment scripts for the Codegen-Hexa project that automate building and deploying both the backend and frontend to Cloudflare Workers.

## Available Scripts

### 1. `deploy.sh` (Linux/macOS)
Bash script for Unix-based systems with colored output and comprehensive error handling.

### 2. `deploy.ps1` (Windows PowerShell)
PowerShell script for Windows with colored output and proper error handling.

### 3. `deploy.bat` (Windows Command Prompt)
Batch file for Windows Command Prompt users.

## Prerequisites

Before running any deployment script, ensure you have:

1. **Node.js** installed (version 18 or higher)
2. **pnpm** installed globally: `npm install -g pnpm`
3. **Cloudflare account** and authentication set up
4. **Wrangler CLI** installed (scripts will auto-install if missing)

## Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Authenticate with Cloudflare
```bash
wrangler login
```

### 3. Configure Your Projects
Ensure your `wrangler.jsonc` files in both `apps/backend/` and `apps/frontend/` are properly configured with your Cloudflare account details.

## Usage

### Option 1: Use the Deployment Scripts

#### On Windows (PowerShell):
```powershell
.\scripts\deploy.ps1
```

#### On Windows (Command Prompt):
```cmd
scripts\deploy.bat
```

#### On Linux/macOS:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Option 2: Use Existing npm Scripts

The project already has deployment scripts in the root `package.json`:

```bash
# Build and deploy everything
pnpm run deploy

# Or step by step
pnpm run build:backend
pnpm run build:frontend
pnpm run deploy:backend
pnpm run deploy:frontend
```

## What the Scripts Do

1. **Verify Environment**: Check if you're in the right directory and have required tools
2. **Authenticate**: Verify Cloudflare authentication
3. **Install Dependencies**: Run `pnpm install` to ensure all packages are up to date
4. **Build Backend**: Compile TypeScript and prepare backend for deployment
5. **Build Frontend**: Compile TypeScript, build Vite bundle, and prepare frontend
6. **Deploy Backend**: Deploy backend to Cloudflare Workers
7. **Deploy Frontend**: Deploy frontend to Cloudflare Workers

## Deployment Order

The scripts deploy in this specific order:
1. **Backend First**: Ensures the API is available before the frontend tries to connect
2. **Frontend Second**: Deploys the user interface after the backend is live

## Error Handling

All scripts include comprehensive error handling:
- Exit on first error (`set -e` in bash, `$ErrorActionPreference = "Stop"` in PowerShell)
- Clear error messages with color coding
- Proper cleanup of directory changes
- Verification of each step before proceeding

## Troubleshooting

### Common Issues

1. **"pnpm not found"**: Install pnpm globally with `npm install -g pnpm`
2. **"wrangler not found"**: Scripts will auto-install wrangler, or install manually with `pnpm add -g wrangler`
3. **"Not logged into Cloudflare"**: Run `wrangler login` first
4. **Build failures**: Check TypeScript compilation errors in the respective app directories
5. **Deployment failures**: Verify your Cloudflare account has the necessary permissions

### Manual Deployment

If scripts fail, you can manually run the deployment steps:

```bash
# Backend
cd apps/backend
pnpm run build
pnpm run deploy
cd ../..

# Frontend
cd apps/frontend
pnpm run build
pnpm run deploy
cd ../..
```

## Security Notes

- Scripts verify you're in the project root directory before proceeding
- Cloudflare authentication is verified before any deployment
- No hardcoded secrets or credentials in the scripts
- Scripts use your existing `wrangler.jsonc` configurations

## Contributing

When modifying these scripts:
- Maintain the same error handling patterns
- Keep the deployment order (backend → frontend)
- Test on both Windows and Unix systems
- Update this README if adding new functionality
