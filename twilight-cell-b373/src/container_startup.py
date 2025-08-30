#!/usr/bin/env python3
"""
Container that handles notebook creation and serves Marimo
"""

import os
import sys
import json
import subprocess
import time
import urllib.request
import urllib.error
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from threading import Thread

# Global variable to track Marimo process
marimo_process = None

def wait_for_marimo_ready(max_wait=30):
    """Wait for Marimo to be ready and responding on port 2718"""
    print("⏳ Waiting for Marimo to be ready...")
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        try:
            # Try to connect to Marimo
            response = urllib.request.urlopen('http://localhost:2718', timeout=2)
            if response.getcode() == 200:
                print("✅ Marimo is ready and responding")
                return True
        except (urllib.error.URLError, urllib.error.HTTPError, ConnectionRefusedError):
            pass
        except Exception as e:
            print(f"⚠️ Unexpected error checking Marimo: {e}")
        
        time.sleep(1)
        print(f"⏳ Still waiting... ({int(time.time() - start_time)}s)")
    
    print("❌ Marimo failed to start within timeout")
    return False

class NotebookHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'OK')
        else:
            # Proxy to Marimo if it's running
            if marimo_process and marimo_process.poll() is None:
                self.proxy_to_marimo()
            else:
                # Hard failure - no graceful fallback
                self.send_error(503, "Marimo not running")
    
    def do_POST(self):
        """Handle POST requests to create notebooks"""
        global marimo_process
        
        if self.path != '/create':
            self.send_error(404, f"Unknown endpoint: {self.path}")
            return
            
        try:
            print(f"📥 Received POST request to create notebook")
            
            # Get content length
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                print("❌ No content in request body")
                self.send_error(400, "No content in request body")
                return
            
            # Read JSON body
            body = self.rfile.read(content_length)
            print(f"📦 Received {len(body)} bytes")
            
            data = json.loads(body.decode('utf-8'))
            notebook_id = data.get('id', 'notebook')
            notebook_content = data.get('content', '')
            
            if not notebook_content:
                print("❌ No notebook content in request")
                self.send_error(400, "No notebook content")
                return
            
            print(f"✅ Received notebook ID: {notebook_id}")
            print(f"📝 Content length: {len(notebook_content)} characters")
            
            # Create notebooks directory
            notebooks_dir = Path("/app/notebooks")
            notebooks_dir.mkdir(exist_ok=True)
            
            # Write notebook content to file
            notebook_path = notebooks_dir / f"{notebook_id}.py"
            notebook_path.write_text(notebook_content, encoding='utf-8')
            print(f"✅ Created notebook at: {notebook_path}")
            
            # Kill any existing Marimo process
            if marimo_process and marimo_process.poll() is None:
                print("🔄 Stopping existing Marimo process...")
                marimo_process.terminate()
                marimo_process.wait(timeout=5)
            
            # Start Marimo with the new notebook
            print(f"🚀 Starting Marimo with notebook: {notebook_path}")
            marimo_process = subprocess.Popen([
                "python", "-m", "marimo", "edit",
                "--host", "0.0.0.0",
                "--port", "2718",  # Use a different port for Marimo
                "--headless",
                "--no-token",
                str(notebook_path)
            ])
            
            # Wait for Marimo to actually be ready
            if not wait_for_marimo_ready():
                # Kill the failed process
                if marimo_process and marimo_process.poll() is None:
                    marimo_process.terminate()
                    marimo_process.wait(timeout=5)
                self.send_error(500, "Failed to start Marimo server")
                return
            
            # Send success response
            response_data = {
                "success": True,
                "id": notebook_id,
                "message": "Notebook created and Marimo started"
            }
            
            response_json = json.dumps(response_data)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(response_json)))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(response_json.encode('utf-8'))
            print("✅ Success response sent")
            
        except Exception as e:
            print(f"❌ ERROR: {e}")
            import traceback
            traceback.print_exc()
            self.send_error(500, str(e))
    
    def proxy_to_marimo(self):
        """Proxy requests to Marimo server"""
        # Hard failure if Marimo is not accessible
        try:
            # Attempt to connect to Marimo
            response = urllib.request.urlopen('http://localhost:2718', timeout=5)
            # If successful, redirect
            self.send_response(302)
            self.send_header('Location', 'http://localhost:2718')
            self.end_headers()
        except:
            # Hard failure
            self.send_error(503, "Marimo server not accessible")
    
    def log_message(self, format, *args):
        """Custom logging"""
        print(f"📝 {format % args}")

def main():
    """Main startup function"""
    print("🚀 Starting Marimo container...")
    print(f"🐍 Python version: {sys.version}")
    
    try:
        # Create notebooks directory
        notebooks_dir = Path("/app/notebooks")
        notebooks_dir.mkdir(exist_ok=True)
        print(f"✅ Created notebooks directory: {notebooks_dir}")
        
        # Start HTTP server on port 8080
        server = HTTPServer(('0.0.0.0', 8080), NotebookHandler)
        print(f"🌐 HTTP server listening on port 8080")
        print(f"🎯 Ready to receive notebook creation requests")
        
        # Run the server
        server.serve_forever()
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
        if marimo_process and marimo_process.poll() is None:
            marimo_process.terminate()
        sys.exit(0)
    except Exception as e:
        print(f"❌ CRITICAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
