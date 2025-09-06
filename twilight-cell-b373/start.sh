#!/bin/sh
set -eu

echo "[start] Marimo container starting..."

# Ensure unbuffered Python output for clearer logs
export PYTHONUNBUFFERED=1

# Create notebooks directory
mkdir -p /app/notebooks

# Determine notebook path
NOTEBOOK_NAME="marimo_notebook.py"
NOTEBOOK_PATH="/app/notebooks/$NOTEBOOK_NAME"

# If notebook content provided via env, write it; otherwise create a minimal valid notebook
if [ -n "${NOTEBOOK_CONTENT:-}" ]; then
  echo "[start] Using NOTEBOOK_CONTENT (len=${#NOTEBOOK_CONTENT})"
  # Use printf to avoid any echo-related escape handling
  printf "%s" "$NOTEBOOK_CONTENT" > "$NOTEBOOK_PATH"
else
  echo "[start] No NOTEBOOK_CONTENT provided; writing default notebook"
  cat > "$NOTEBOOK_PATH" << 'EOF'
# /// script
import marimo as mo

app = mo.App()

@app.cell
def __():
    """Welcome to Marimo!"""
    mo.md("""
    # Welcome to Marimo
    This is a basic Marimo notebook. New content will be loaded here when you generate a notebook.
    """)
    return None

@app.cell
def __():
    message = "Hello from Marimo!"
    return message

@app.cell
def __():
    mo.md(f"**Message:** {message}")
    return None
# ///
EOF
fi

echo "[start] Notebook at: $NOTEBOOK_PATH"

# Bind to provided PORT if set, else default 2718
PORT_TO_USE="${PORT:-2718}"
echo "[start] Using port: $PORT_TO_USE"

# Try to start Marimo with a compatible command
echo "[start] Attempting: python -m marimo edit --host 0.0.0.0 --port $PORT_TO_USE $NOTEBOOK_PATH"
python -m marimo edit --host 0.0.0.0 --port "$PORT_TO_USE" "$NOTEBOOK_PATH"
status=$?
if [ $status -ne 0 ]; then
  echo "[start] 'marimo edit' exited with $status; falling back to 'marimo run'"
  echo "[start] Attempting: python -m marimo run --host 0.0.0.0 --port $PORT_TO_USE $NOTEBOOK_PATH"
  exec python -m marimo run --host 0.0.0.0 --port "$PORT_TO_USE" "$NOTEBOOK_PATH"
fi

# If edit started successfully and later exits, just exit with its status
exit $status
