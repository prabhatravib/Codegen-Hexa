#!/bin/bash
set -e

echo "Starting Marimo container..."

# Create notebooks directory
mkdir -p /app/notebooks

# Check if notebook content is provided via environment variable
if [ -n "$NOTEBOOK_CONTENT" ]; then
    echo "Using provided notebook content..."
    
    # Create notebook file with provided content
    NOTEBOOK_NAME="marimo_notebook.py"
    NOTEBOOK_PATH="/app/notebooks/$NOTEBOOK_NAME"
    
    # Write the content to file
    echo "$NOTEBOOK_CONTENT" > "$NOTEBOOK_PATH"
    
    echo "Notebook created: $NOTEBOOK_PATH"
else
    echo "No notebook content provided, creating basic notebook..."
    
    # Create a basic "Hello World" Marimo notebook
    NOTEBOOK_NAME="marimo_notebook.py"
    NOTEBOOK_PATH="/app/notebooks/$NOTEBOOK_NAME"

    cat > "$NOTEBOOK_PATH" << 'EOF'
import marimo as mo

app = mo.App()

@app.cell
def __():
    """Welcome to Marimo! 🚀"""
    mo.md("""
    # Welcome to Marimo! 🚀
    
    This is a basic Marimo notebook. 
    New content will be loaded here when you generate a notebook.
    """)
    return

@app.cell
def __():
    """Sample cell"""
    message = "Hello from Marimo!"
    return message

@app.cell
def __():
    """Display the message"""
    mo.md(f"**Message:** {message}")
    return
EOF

    echo "Created basic notebook: $NOTEBOOK_PATH"
fi

echo "Starting Marimo with notebook: $NOTEBOOK_NAME"

# Start Marimo directly
python -m marimo edit \
    --host 0.0.0.0 \
    --port 2718 \
    --headless \
    --no-token \
    "$NOTEBOOK_PATH"
