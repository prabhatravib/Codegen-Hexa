import os
import sys
import subprocess
from pathlib import Path

def main():
    # Create notebooks directory
    notebooks_dir = Path("/app/notebooks")
    notebooks_dir.mkdir(exist_ok=True)
    
    print(f"Starting Marimo server in {notebooks_dir}")
    print(f"Host: 0.0.0.0, Port: 2718")
    
    # Start Marimo server
    try:
        subprocess.run([
            "marimo", "edit",
            "--host", "0.0.0.0",
            "--port", "2718",
            "--no-browser",
            "--sandbox",
            str(notebooks_dir)
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Failed to start Marimo server: {e}")
        sys.exit(1)
    except FileNotFoundError:
        print("Marimo command not found. Please ensure marimo is installed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
