#!/bin/bash
set -euo pipefail

echo "[start] Marimo container starting..."

# Ensure unbuffered Python output
export PYTHONUNBUFFERED=1
export MARIMO_SKIP_UPDATE_CHECK=1

# Create notebooks directory
mkdir -p /app/notebooks

# Default safe notebook that we know works
create_safe_notebook() {
    local notebook_path="$1"
    cat > "$notebook_path" << 'EOF'
import marimo

__generated_with = "0.9.11"
app = marimo.App()

@app.cell
def __():
    import marimo as mo
    mo.md("# Welcome to Marimo")
    return

@app.cell
def __():
    import numpy as np
    data = np.random.randn(10)
    return data,

@app.cell
def __(data):
    import marimo as mo
    mo.md(f"Data mean: {data.mean():.3f}")
    return

if __name__ == "__main__":
    app.run()
EOF
}

NOTEBOOK_PATH="/app/notebooks/notebook.py"

# If content provided, try to use it, otherwise use safe default
if [ -n "${NOTEBOOK_CONTENT:-}" ]; then
    echo "[start] Writing provided notebook content..."
    printf "%s" "$NOTEBOOK_CONTENT" > "$NOTEBOOK_PATH"
    
    # Test if the notebook can be compiled
    if ! python -m py_compile "$NOTEBOOK_PATH" 2>/dev/null; then
        echo "[start] Provided content has syntax errors, using safe fallback"
        create_safe_notebook "$NOTEBOOK_PATH"
    else
        # Check if it has required Marimo structure
        if ! grep -q "import marimo" "$NOTEBOOK_PATH" || ! grep -q "app = marimo.App" "$NOTEBOOK_PATH"; then
            echo "[start] Content missing Marimo structure, using safe fallback"
            create_safe_notebook "$NOTEBOOK_PATH"
        fi
    fi
else
    echo "[start] No content provided, creating safe default notebook"
    create_safe_notebook "$NOTEBOOK_PATH"
fi

PORT_TO_USE="${PORT:-8080}"

echo "[start] Final notebook preview:"
head -10 "$NOTEBOOK_PATH"

echo "[start] Starting Marimo on port $PORT_TO_USE..."

# Start Marimo with the most basic options to avoid any configuration issues
exec python -m marimo edit "$NOTEBOOK_PATH" \
    --host 0.0.0.0 \
    --port "$PORT_TO_USE" \
    --headless \
    --no-token