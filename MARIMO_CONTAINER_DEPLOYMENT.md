# Marimo Container Deployment Guide

This guide walks you through deploying the transformed Marimo implementation from browser-based Pyodide execution to a real Marimo server running on Cloudflare Containers.

## What Was Changed

### 1. New Marimo Container Service
- **Location**: `apps/marimo-container/`
- **Purpose**: Runs real Marimo server instead of browser-based execution
- **Technology**: Python + Docker + Cloudflare Containers

### 2. Updated Backend
- **New Endpoint**: `/api/marimo/save-to-container`
- **Purpose**: Saves notebooks to Marimo container and returns access URL
- **Integration**: Forwards requests to Marimo container service

### 3. Simplified Frontend
- **Component**: `MarimoNotebook.tsx`
- **Change**: Replaced complex Pyodide logic with simple iframe to Marimo server
- **Benefits**: Cleaner code, better performance, full Marimo features

## Deployment Steps

### Step 1: Deploy Marimo Container Service

```bash
# Navigate to Marimo container directory
cd apps/marimo-container

# Install dependencies
pnpm install

# Build the service
pnpm run build

# Deploy to Cloudflare
pnpm run deploy
```

**Important**: Set your OpenAI API key as a secret:
```bash
wrangler secret put OPENAI_API_KEY
```

### Step 2: Deploy Updated Backend

```bash
# Navigate to backend directory
cd apps/backend

# Build and deploy
pnpm run build
pnpm run deploy
```

### Step 3: Deploy Updated Frontend

```bash
# Navigate to frontend directory
cd apps/frontend

# Build and deploy
pnpm run build
pnpm run deploy
```

### Step 4: Test the Integration

1. **Generate a flowchart** in the frontend
2. **Generate Marimo notebook** from the flowchart
3. **Verify** that the notebook opens in the Marimo container (iframe)
4. **Test** interactive features like cell execution

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Frontend      │    │    Backend       │    │ Marimo Container │
│   (React)       │───▶│   (Workers)      │───▶│   (Python)       │
└─────────────────┘    └──────────────────┘    └──────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
   iframe display         API endpoints         Real Marimo server
   to container           for notebook         with Python env
                        generation
```

## Key Benefits

### Before (Pyodide)
- ❌ Limited Python packages
- ❌ Slow execution (WebAssembly)
- ❌ Memory constraints
- ❌ No persistent state
- ❌ Limited WebSocket support

### After (Container)
- ✅ Full Python environment
- ✅ Fast execution (native)
- ✅ No memory limits
- ✅ Persistent notebooks
- ✅ Full WebSocket support
- ✅ Package installation
- ✅ Real file system

## Configuration Files

### Marimo Container
- `Dockerfile` - Python environment setup
- `requirements.txt` - Python dependencies
- `wrangler.toml` - Cloudflare configuration
- `src/start_marimo.py` - Server startup script

### Backend Updates
- `src/routes/marimo.ts` - New save-to-container endpoint
- `src/services/aiService.ts` - AI generation functions
- `src/services/marimoService.ts` - Notebook management

### Frontend Updates
- `src/components/MarimoNotebook.tsx` - Simplified iframe component

## Troubleshooting

### Container Not Starting
```bash
# Check container logs
wrangler tail

# Verify Dockerfile
docker build -t test-marimo .

# Check requirements
pip install -r requirements.txt
```

### Connection Issues
```bash
# Test container health
curl https://codegen-hexa-marimo.prabhatravib.workers.dev/health

# Check backend endpoint
curl https://codegen-hexa-backend.prabhatravib.workers.dev/api/marimo/save-to-container
```

### Build Errors
```bash
# Clean and rebuild
rm -rf node_modules
pnpm install
pnpm run build:marimo
```

## Environment Variables

### Required Secrets
- `OPENAI_API_KEY` - For AI generation features

### Optional Configuration
- Container CPU/Memory limits in `wrangler.toml`
- Idle timeout settings
- Network policies

## Monitoring

### Health Checks
- Container: `/health` endpoint
- Backend: `/api/health` endpoint
- Frontend: Built-in error boundaries

### Logs
- Cloudflare Workers logs
- Container startup logs
- Frontend console logs

## Next Steps

After successful deployment:

1. **Monitor Performance**: Check container startup times and response latency
2. **Scale Resources**: Adjust CPU/memory based on usage patterns
3. **Add Features**: Implement notebook sharing, collaboration, etc.
4. **Security**: Add authentication and rate limiting if needed

## Support

If you encounter issues:

1. Check the Cloudflare Workers dashboard
2. Review container logs
3. Verify network connectivity
4. Test individual components in isolation

## Rollback Plan

If issues arise, you can quickly rollback:

1. **Frontend**: Revert to previous MarimoNotebook.tsx
2. **Backend**: Remove save-to-container endpoint
3. **Container**: Stop the Marimo container service

The original Pyodide-based implementation will continue to work during the transition.
