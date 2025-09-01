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
        
        # Create a unique UUID notebook
        print("🔧 Creating unique UUID notebook...")
        create_result = subprocess.run(["python", "src/create_uuid_notebook.py"], 
                                     capture_output=True, text=True, cwd="/app")
        print(f"✅ Notebook creation output: {create_result.stdout}")
        if create_result.stderr:
            print(f"⚠️  Notebook creation warnings: {create_result.stderr}")
        
        # Find the created notebook file
        notebook_files = list(notebooks_dir.glob("*_marimo_notebook.py"))
        if not notebook_files:
            print("❌ No notebook files found!")
            return 1
        
        notebook_path = notebook_files[0]
        print(f"✅ Using notebook: {notebook_path}")
        
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
            "--port", os.getenv("MARIMO_PORT", "8080"),
            "--headless",
            "--no-token",
            "--allow-origins", "*",  # Allow all origins for CORS
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
            print(f"STDOUT: {stdout.decode() if stdout else 'None'}")
            print(f"STDERR: {stderr.decode() if stderr else 'None'}")
            return 1
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
