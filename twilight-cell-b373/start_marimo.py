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
    """Start Marimo with the notebook"""
    print("🚀 Starting Marimo...")
    
    # Get Marimo version to determine compatible flags
    try:
        version_result = subprocess.run(
            ["python", "-m", "marimo", "--version"],
            capture_output=True,
            text=True,
            timeout=10
        )
        marimo_version = version_result.stdout.strip()
        print(f"📦 Marimo version: {marimo_version}")
    except Exception as e:
        print(f"⚠️  Could not determine Marimo version: {e}")
        marimo_version = "unknown"
    
    # Try different flag combinations based on version
    flag_combinations = [
        # Try to bypass parser with --no-check flag
        [
            "python", "-m", "marimo", "edit",
            "--host", "0.0.0.0",
            "--port", "2718",
            "--headless",
            "--no-token",
            "--no-check",
            str(notebook_path)
        ],
        # Modern Marimo flags (0.8+)
        [
            "python", "-m", "marimo", "edit",
            "--host", "0.0.0.0",
            "--port", "2718",
            "--headless",
            "--no-token",
            "--skip-update-check",
            str(notebook_path)
        ],
        # Alternative modern flags
        [
            "python", "-m", "marimo", "edit",
            "--host", "0.0.0.0",
            "--port", "2718",
            "--headless",
            "--no-token",
            str(notebook_path)
        ],
        # Legacy Marimo flags (0.3.x)
        [
            "python", "-m", "marimo", "edit",
            "--host", "0.0.0.0",
            "--port", "2718",
            "--headless",
            str(notebook_path)
        ]
    ]
    
    for i, cmd in enumerate(flag_combinations):
        try:
            print(f"📝 Trying command set {i+1}: {' '.join(cmd)}")
            
            # Start Marimo
            process = subprocess.Popen(cmd)
            print(f"✅ Marimo started with PID: {process.pid}")
            
            # Wait to see if it starts successfully
            time.sleep(5)
            
            if process.poll() is None:
                print(f"🎉 Marimo is running successfully with command set {i+1}!")
                return process
            else:
                stdout, stderr = process.communicate()
                print(f"⚠️  Command set {i+1} failed:")
                if stdout: print(f"STDOUT: {stdout.decode()}")
                if stderr: print(f"STDERR: {stderr.decode()}")
                
                # Try next combination
                continue
                
        except Exception as e:
            print(f"❌ Error with command set {i+1}: {e}")
            continue
    
    # If we get here, all combinations failed
    raise RuntimeError("Marimo failed to start with all flag combinations")

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
