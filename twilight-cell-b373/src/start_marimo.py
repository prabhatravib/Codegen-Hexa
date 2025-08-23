#!/usr/bin/env python3
import os
import subprocess
import time
from pathlib import Path

def main():
    """Simple startup script for Cloudflare Containers"""
    print("🚀 Starting Marimo Container...")
    
    try:
        # Create notebooks directory
        notebooks_dir = Path("/app/notebooks")
        notebooks_dir.mkdir(exist_ok=True)
        print(f"✅ Created notebooks directory: {notebooks_dir}")
        
        # Create a proper Marimo notebook
        notebook_path = notebooks_dir / "workspace.py"
        notebook_content = '''import marimo as mo

# Initialize the Marimo app
app = mo.App()

@app.cell
def __():
    return "Hello from Marimo!"

@app.cell
def __():
    return 42
'''
        notebook_path.write_text(notebook_content)
        print(f"✅ Created notebook: {notebook_path}")
        
        # Test if we can run Python
        print("🧪 Testing Python execution...")
        test_result = subprocess.run(["python", "--version"], capture_output=True, text=True)
        print(f"✅ Python test: {test_result.stdout.strip()}")
        
        # Test if Marimo is available
        print("🧪 Testing Marimo availability...")
        marimo_result = subprocess.run(["python", "-m", "marimo", "--version"], capture_output=True, text=True)
        print(f"✅ Marimo test: {marimo_result.stdout.strip()}")
        
        # Start Marimo with the notebook file
        print("🎯 Starting Marimo...")
        cmd = [
            "python", "-m", "marimo", "edit",
            "--host", "0.0.0.0",
            "--port", "2718",
            "--headless",
            "--no-token",
            str(notebook_path)
        ]
        
        print(f"📝 Command: {' '.join(cmd)}")
        
        # Start Marimo
        process = subprocess.Popen(cmd)
        print(f"✅ Marimo started with PID: {process.pid}")
        
        # Wait a moment to see if it starts successfully
        time.sleep(5)
        
        if process.poll() is None:
            print("🎉 Marimo is running successfully!")
            # Keep container alive
            process.wait()
        else:
            stdout, stderr = process.communicate()
            print(f"❌ Marimo failed to start:")
            print(f"STDOUT: {stdout.decode()}")
            print(f"STDERR: {stderr.decode()}")
            return 1
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
