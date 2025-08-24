#!/usr/bin/env python3
import os
import subprocess
import time
from pathlib import Path

def main():
    """Startup script for Cloudflare Containers - using working subprocess approach"""
    print("🚀 Starting Marimo Container...")
    
    try:
        # Create notebooks directory
        notebooks_dir = Path("/app/notebooks")
        notebooks_dir.mkdir(exist_ok=True)
        print(f"✅ Created notebooks directory: {notebooks_dir}")
        
        # Create a unique UUID notebook
        print("🔧 Creating unique UUID notebook...")
        from create_uuid_notebook import create_uuid_notebook
        notebook_name = create_uuid_notebook()
        print(f"✅ Created notebook: {notebook_name}")
        
        # Find the created notebook file
        notebook_path = notebooks_dir / notebook_name
        if not notebook_path.exists():
            print("❌ Notebook file not found!")
            return 1
        
        print(f"✅ Using notebook: {notebook_path}")
        
        # Test if we can run Python
        print("🧪 Testing Python execution...")
        test_result = subprocess.run(["python", "--version"], capture_output=True, text=True)
        print(f"✅ Python test: {test_result.stdout.strip()}")
        
        # Test if Marimo is available
        print("🧪 Testing Marimo availability...")
        marimo_result = subprocess.run(["python", "-m", "marimo", "--version"], capture_output=True, text=True)
        print(f"✅ Marimo test: {marimo_result.stdout.strip()}")
        
        # Start Marimo with the notebook file (this is what works on Cloudflare)
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
        
        # Start Marimo - this is the working approach for Cloudflare Containers
        process = subprocess.Popen(cmd)
        print(f"✅ Marimo started with PID: {process.pid}")
        
        # Wait a moment to see if it starts successfully
        time.sleep(5)
        
        if process.poll() is None:
            print("🎉 Marimo is running successfully!")
            print("🌐 WebSocket endpoint will be at: /ws")
            print("📱 Container is ready for Cloudflare")
            # Keep container alive - this is what Cloudflare expects
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
