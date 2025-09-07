#!/bin/sh
set -e

echo "[start] Marimo container starting..."

# Python unbuffered output
export PYTHONUNBUFFERED=1

# Memory optimization
export PYTHONDONTWRITEBYTECODE=1
export PYTHONHASHSEED=0

# Create notebooks directory
mkdir -p /app/notebooks

# Create notebook file
NOTEBOOK_PATH="/app/notebooks/notebook.py"

# Write notebook content
if [ -n "${NOTEBOOK_CONTENT:-}" ]; then
    echo "[start] Using provided notebook content"
    echo "$NOTEBOOK_CONTENT" > "$NOTEBOOK_PATH"
else
    echo "[start] Creating default notebook"
    cat > "$NOTEBOOK_PATH" << 'EOF'
import marimo as mo

app = mo.App()

@app.cell
def __():
    import marimo as mo
    mo.md("# Welcome to Marimo\nNotebook is ready!")
    return mo
EOF
fi

echo "[start] Starting Marimo on port 2718..."

# Start Marimo with memory optimizations
exec python -m marimo edit "$NOTEBOOK_PATH" \
    --host 0.0.0.0 \
    --port 2718 \
    --headless \
    --no-token \
    --skip-update-check
