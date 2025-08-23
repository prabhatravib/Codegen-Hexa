import os
import subprocess
import time
from pathlib import Path

def main():
    """Minimal startup script for Cloudflare Containers"""
    print("🚀 Starting Marimo Container...")
    
    # Create notebooks directory
    notebooks_dir = Path("/app/notebooks")
    notebooks_dir.mkdir(exist_ok=True)
    
    # Create a simple notebook
    notebook_path = notebooks_dir / "workspace.py"
    notebook_path.write_text("print('Hello, Marimo!')\n")
    
    print(f"📝 Created notebook: {notebook_path}")
    
    # Start Marimo with minimal flags
    cmd = [
        "python", "-m", "marimo", "edit",
        "--host", "0.0.0.0",
        "--port", "2718",
        "--headless",
        "--no-token",
        str(notebook_path)
    ]
    
    print(f"📝 Starting Marimo: {' '.join(cmd)}")
    
    # Start and keep running
    process = subprocess.Popen(cmd)
    print(f"✅ Marimo started with PID: {process.pid}")
    
    # Keep container alive
    process.wait()

if __name__ == "__main__":
    main()
