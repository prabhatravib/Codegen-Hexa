#!/usr/bin/env python3
"""Create the Marimo notebook file during Docker build"""

import os
from pathlib import Path

def create_notebook():
    """Create the notebook file with proper content"""
    
    # Create notebooks directory
    notebooks_dir = Path("/app/notebooks")
    notebooks_dir.mkdir(exist_ok=True)
    
    # Create the notebook file
    notebook_path = notebooks_dir / "d6367d62_notebook.py"
    
    # Simple notebook content to test basic functionality
    content = '''import marimo as mo

# Initialize the Marimo app
app = mo.App()

@app.cell
def __():
    return "Hello from Marimo!"

@app.cell
def __():
    return 42
'''
    
    # Write the notebook
    notebook_path.write_text(content, encoding='utf-8')
    print(f"Created notebook: {notebook_path}")
    
    # Verify the file was created
    if notebook_path.exists():
        print(f"Notebook file exists: {notebook_path}")
        print(f"File size: {notebook_path.stat().st_size} bytes")
    else:
        print("ERROR: Notebook file was not created!")

if __name__ == "__main__":
    create_notebook()
