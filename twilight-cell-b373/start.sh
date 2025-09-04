#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting Marimo Container..."

# Create notebooks directory
mkdir -p /app/notebooks

# 1) Start Marimo on port 8081 (background)
MARIMO_PORT=${MARIMO_PORT:-8081}
echo "📊 Starting Marimo server on port ${MARIMO_PORT}..."
python -m marimo edit /app/notebooks --host 127.0.0.1 --port ${MARIMO_PORT} --headless --no-token --allow-origins "*" &
MARIMO_PID=$!

# Wait a moment for Marimo to start
sleep 5

# Check if Marimo started successfully
if ! kill -0 $MARIMO_PID 2>/dev/null; then
    echo "❌ Failed to start Marimo server"
    exit 1
fi

echo "✅ Marimo server started (PID: $MARIMO_PID) on port ${MARIMO_PORT}"

# 2) Start FastAPI server on 8080 (foreground)
echo "🌐 Starting FastAPI server on port 8080..."
exec uvicorn server:app --host 0.0.0.0 --port 8080 --reload
