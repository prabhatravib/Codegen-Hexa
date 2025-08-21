# Marimo Container Service

This service provides a real Marimo server running on Cloudflare Containers, replacing the browser-based Pyodide execution with a full Python environment.

## Features

- **Real Python Environment**: Runs actual Marimo server instead of browser-based Pyodide
- **Persistent State**: Notebooks persist across sessions
- **Package Installation**: Users can install Python packages dynamically
- **WebSocket Support**: Full Marimo reactive UI capabilities
- **Auto-scaling**: Containers auto-sleep after 5 minutes of inactivity

## Architecture

```
Frontend (React) → Backend (Workers) → Marimo Container (Python)
```

The frontend connects to the backend API, which forwards requests to the Marimo container running the actual Python server.

## Setup

### 1. Install Dependencies

```bash
cd apps/marimo-container
pnpm install
```

### 2. Configure Environment

Set your OpenAI API key as a secret:

```bash
wrangler secret put OPENAI_API_KEY
```

### 3. Build and Deploy

```bash
# Build the service
pnpm run build:marimo

# Deploy to Cloudflare
pnpm run deploy:marimo
```

## Development

```bash
# Start development server
pnpm run dev:marimo

# Type checking
pnpm run type-check
```

## API Endpoints

- `/marimo/*` - Routes to Marimo container
- `/health` - Health check endpoint

## Container Configuration

- **CPU**: 1 core
- **Memory**: 2GB
- **Disk**: 5GB
- **Port**: 2718
- **Idle Timeout**: 5 minutes

## Integration

The service integrates with the main backend through:

1. **Notebook Generation**: Backend generates Marimo notebook code
2. **Container Storage**: Notebooks are saved to the Marimo container
3. **Frontend Display**: Frontend shows notebooks in iframe to container

## Troubleshooting

### Container Not Starting
- Check Dockerfile syntax
- Verify requirements.txt dependencies
- Check Cloudflare Container logs

### Connection Issues
- Verify container is running
- Check network policies
- Ensure correct port configuration

## Notes

- Containers are stateless and will lose data on restart
- Each user session can have its own container instance
- The service automatically handles container lifecycle management
