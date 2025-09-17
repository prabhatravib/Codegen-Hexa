#!/bin/sh
set -euo pipefail

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
import marimo

app = marimo.App()

@app.cell
def __():
    import marimo as mo
    mo.md("""
    # Marimo is starting
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
EOF
fi

echo "[start] Notebook at: $NOTEBOOK_PATH"

# Bind to provided PORT if set, else default 8080
PORT_TO_USE="${PORT:-8080}"
echo "[start] Using port: $PORT_TO_USE"

# Log Python and Marimo versions for diagnostics
python -V || true
python - <<'PY'
try:
    import marimo
    print("[start] marimo version:", marimo.__version__)
except Exception as e:
    print("[start] marimo import failed:", e)
PY

# Validate notebook syntax; if invalid, write a safe fallback
if ! python - <<PY
import py_compile, sys
try:
    py_compile.compile("$NOTEBOOK_PATH", doraise=True)
    print("[start] Notebook syntax OK")
except Exception as e:
    print("[start] Notebook syntax error:", e)
    sys.exit(42)
PY
then
  echo "[start] Overwriting with safe fallback notebook due to syntax error"
  cat > "$NOTEBOOK_PATH" << 'EOF'
import marimo as mo

app = mo.App()

@app.cell
def __():
    mo.md("""
    # Notebook Error
    The generated content had a syntax error. This is a safe fallback.
    """)
    return None
EOF
fi

# Start Marimo editor with file first (CLI expects path as positional)
echo "[start] Exec: python -m marimo edit $NOTEBOOK_PATH --host 0.0.0.0 --port $PORT_TO_USE --headless --no-token --skip-update-check"
exec python -m marimo edit "$NOTEBOOK_PATH" --host 0.0.0.0 --port "$PORT_TO_USE" --headless --no-token --skip-update-check
