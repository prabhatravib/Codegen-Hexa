#!/bin/bash
set -e

echo "Starting Marimo container..."

# Create the UUID notebook
python /app/src/create_uuid_notebook.py

# Find the created notebook
cd /app/notebooks
NOTEBOOK=$(ls *_marimo_notebook.py | head -1)

if [ -z "$NOTEBOOK" ]; then
    echo "ERROR: No notebook file found!"
    exit 1
fi

echo "Starting Marimo with notebook: $NOTEBOOK"

# Start Marimo directly without exec
python -m marimo edit \
    --host 0.0.0.0 \
    --port 2718 \
    --headless \
    --no-token \
    "$NOTEBOOK"
