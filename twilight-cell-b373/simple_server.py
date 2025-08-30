#!/usr/bin/env python3
"""
Simple server that can serve Marimo notebooks with dynamic content
"""
import os
import sys
import tempfile
from pathlib import Path

def main():
    print("🚀 Starting Marimo server with dynamic notebook support...")
    
    # Check for notebook content in environment variables
    notebook_content = os.environ.get('HTTP_X_NOTEBOOK_CONTENT')
    notebook_id = os.environ.get('HTTP_X_NOTEBOOK_ID')
    
    if notebook_content:
        print(f"📝 Using dynamic notebook content (ID: {notebook_id})")
        print(f"📊 Content length: {len(notebook_content)} characters")
        
        # Create a temporary notebook file
        notebooks_dir = Path("/app/notebooks")
        notebooks_dir.mkdir(exist_ok=True)
        
        notebook_file = notebooks_dir / f"dynamic_{notebook_id}.py"
        with open(notebook_file, 'w') as f:
            f.write(notebook_content)
        
        print(f"💾 Created notebook file: {notebook_file}")
        
        # Start Marimo with the dynamic notebook
        os.system(f"python -m marimo edit --host 0.0.0.0 --port 2718 --headless --no-token '{notebook_file}'")
    else:
        print("📋 No dynamic content found, creating default notebook...")
        
        # Create default notebook
        os.system("python src/create_uuid_notebook.py")
        
        # Find the created notebook
        notebooks_dir = Path("/app/notebooks")
        notebook_files = list(notebooks_dir.glob("*_marimo_notebook.py"))
        
        if notebook_files:
            notebook_file = notebook_files[0]
            print(f"📁 Using default notebook: {notebook_file}")
            os.system(f"python -m marimo edit --host 0.0.0.0 --port 2718 --headless --no-token '{notebook_file}'")
        else:
            print("❌ No notebook files found!")
            sys.exit(1)

if __name__ == "__main__":
    main()
