import os
import sys
import subprocess
import threading
import time
from pathlib import Path

def start_marimo_server(notebooks_dir: Path):
    """Start Marimo server for Cloudflare Containers"""
    try:
        print(f"🚀 Starting Marimo server on port 2718...")
        
        # Start Marimo server with proper flags for container deployment
        cmd = [
            "python", "-m", "marimo", "edit",
            "--host", "0.0.0.0",
            "--port", "2718",
            "--headless",
            "--no-token",
            "--skip-update-check",
            "--allow-origins", "*",
            str(notebooks_dir)
        ]
        
        env = os.environ.copy()
        env["MARIMO_SKIP_UPDATE_CHECK"] = "true"
        env["MARIMO_LOG_LEVEL"] = "INFO"
        
        print(f"📝 Command: {' '.join(cmd)}")
        
        # Start Marimo server
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env
        )
        
        print(f"✅ Marimo server started with PID: {process.pid}")
        print(f"🌐 Marimo will be available on port 2718")
        
        # Wait for server to be ready
        time.sleep(3)
        
        # Check if process is still running
        if process.poll() is None:
            print(f"✅ Marimo server is running successfully!")
            return process
        else:
            stdout, stderr = process.communicate()
            print(f"❌ Marimo server failed to start:")
            print(f"STDOUT: {stdout.decode()}")
            print(f"STDERR: {stderr.decode()}")
            return None
            
    except Exception as e:
        print(f"❌ Error starting Marimo server: {e}")
        return None

def main():
    """Main entry point for Cloudflare Containers"""
    print("🚀 Starting Marimo Container for Cloudflare...")
    
    # Create notebooks directory
    if os.path.exists("/app"):
        notebooks_dir = Path("/app/notebooks")
    else:
        notebooks_dir = Path("./notebooks")
    
    notebooks_dir.mkdir(exist_ok=True)
    print(f"📁 Using notebooks directory: {notebooks_dir}")
    
    # Start Marimo server
    marimo_process = start_marimo_server(notebooks_dir)
    
    if marimo_process:
        print("🎉 Marimo Container is ready!")
        print("📝 Your Marimo notebooks will be available on port 2718")
        print("🌐 Cloudflare will proxy requests to this container")
        
        # Keep the container running
        try:
            marimo_process.wait()
        except KeyboardInterrupt:
            print("\n🛑 Shutting down Marimo server...")
            marimo_process.terminate()
            marimo_process.wait()
    else:
        print("❌ Failed to start Marimo server")
        sys.exit(1)

if __name__ == "__main__":
    main()
