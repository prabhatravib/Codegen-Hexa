#!/usr/bin/env python3
"""
Startup script for Marimo in Cloudflare Containers
This approach is more robust and future-proof than static Docker CMD
"""

import os
import sys
import subprocess
import time
from pathlib import Path

# Immediate debug output
print("🔥 CONTAINER STARTING - Python script loaded!")
print(f"🔥 Python executable: {sys.executable}")
print(f"🔥 Python path: {sys.path}")
sys.stdout.flush()

def create_notebook():
    """Create a fresh notebook file"""
    notebooks_dir = Path("/app/notebooks")
    notebooks_dir.mkdir(exist_ok=True)
    
    notebook_path = notebooks_dir / "workspace.py"
    
    # Create a proper Marimo notebook with simpler content
    content = """import marimo as mo

# Initialize the Marimo app
app = mo.App()

@app.cell
def __():
    return "Notebook is ready!"

@app.cell
def __():
    return 42
"""
    
    # Write with explicit encoding and ensure proper line endings
    with open(notebook_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(content)
    
    # Verify the file was written correctly
    with open(notebook_path, 'r', encoding='utf-8') as f:
        actual_content = f.read()
        print(f"📝 File content preview: {actual_content[:100]}...")
    
    print(f"✅ Created notebook: {notebook_path}")
    return notebook_path

def start_marimo(notebook_path):
    """Start Marimo with the notebook using modern 0.11-0.13 flags"""
    print("🚀 Starting Marimo...")
    
    # Get Marimo version to confirm we're running 0.11+
    try:
        version_result = subprocess.run(
            ["python", "-m", "marimo", "--version"],
            capture_output=True,
            text=True,
            timeout=10
        )
        marimo_version = version_result.stdout.strip()
        print(f"📦 Marimo version: {marimo_version}")
        
        # Check if version is 0.11+
        if marimo_version and marimo_version.startswith(('0.11', '0.12', '0.13')):
            print("✅ Marimo version is compatible (0.11-0.13)")
        else:
            print("⚠️  Marimo version may not be fully compatible")
            
    except Exception as e:
        print(f"⚠️  Could not determine Marimo version: {e}")
        marimo_version = "unknown"
    
    # Modern Marimo 0.11-0.13 flags
    # Using --no-token for public access (behind your reverse proxy)
    cmd = [
        "python", "-m", "marimo", "edit",
        "--host", "0.0.0.0",
        "--port", "2718",
        "--headless",
        "--no-token",
        "--skip-update-check",
        str(notebook_path)
    ]
    
    try:
        print(f"📝 Starting Marimo with command: {' '.join(cmd)}")
        
        # Start Marimo
        process = subprocess.Popen(cmd)
        print(f"✅ Marimo started with PID: {process.pid}")
        
        # Wait to see if it starts successfully
        time.sleep(5)
        
        if process.poll() is None:
            print(f"🎉 Marimo is running successfully!")
            return process
        else:
            stdout, stderr = process.communicate()
            print(f"❌ Marimo failed to start:")
            if stdout: print(f"STDOUT: {stdout.decode()}")
            if stderr: print(f"STDERR: {stderr.decode()}")
            raise RuntimeError("Marimo process exited unexpectedly")
            
    except Exception as e:
        print(f"❌ Error starting Marimo: {e}")
        raise

def main():
    """Main startup function"""
    print("🚀 Starting Marimo Container...")
    print(f"🐍 Python version: {sys.version}")
    print(f"📁 Working directory: {os.getcwd()}")
    print("=" * 50)
    
    try:
        # Create the notebook
        print("📝 Creating notebook...")
        notebook_path = create_notebook()
        
        # Start Marimo
        print("🚀 Starting Marimo server...")
        process = start_marimo(notebook_path)
        
        print("=" * 50)
        print("🎉 Marimo is now running!")
        print(f"🌐 Access your notebook at: http://localhost:2718")
        print(f"📊 Process ID: {process.pid}")
        print("=" * 50)
        
        # Keep container alive and monitor process
        while True:
            if process.poll() is not None:
                print("❌ Marimo process died unexpectedly!")
                return 1
            
            # Health check every 30 seconds
            time.sleep(30)
            print("💓 Health check: Marimo is running...")
        
    except KeyboardInterrupt:
        print("\n🛑 Received interrupt signal, shutting down...")
        if 'process' in locals():
            process.terminate()
            process.wait()
        return 0
        
    except Exception as e:
        print(f"❌ Startup failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

def start_simple_server():
    """Start a simple HTTP server for testing"""
    import http.server
    import socketserver
    
    print("🚨 Starting simple HTTP server as fallback...")
    
    class SimpleHandler(http.server.SimpleHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<h1>Container is running! Marimo failed to start.</h1>')
    
    try:
        with socketserver.TCPServer(("0.0.0.0", 2718), SimpleHandler) as httpd:
            print("🌐 Simple server running on http://0.0.0.0:2718")
            httpd.serve_forever()
    except Exception as e:
        print(f"❌ Even simple server failed: {e}")
        return 1

if __name__ == "__main__":
    try:
        exit(main())
    except Exception as e:
        print(f"❌ Main function failed: {e}")
        print("🚨 Falling back to simple server...")
        exit(start_simple_server())
