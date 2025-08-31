#!/usr/bin/env python3
"""
Simple Marimo Container for Cloudflare
Handles file writing and Marimo server startup
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse

# Create notebooks directory
NB_DIR = Path("/app/notebooks")
NB_DIR.mkdir(exist_ok=True)

class MarimoHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Handle POST requests for saving notebooks"""
        if self.path == '/api/save':
            self.handle_save()
        else:
            self.send_error(404)
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/health':
            self.handle_health()
        elif self.path == '/':
            self.handle_root()
        else:
            self.send_error(404)
    
    def handle_save(self):
        """Save a notebook file"""
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Parse JSON
            data = json.loads(post_data.decode('utf-8'))
            filename = data.get('filename', 'notebook.py')
            content = data.get('content', '')
            
            # Validate content
            if not content:
                self.send_error_response(400, 'Content is required')
                return
            
            if 'import marimo as mo' not in content or 'app = mo.App()' not in content:
                self.send_error_response(400, 'Invalid Marimo notebook content')
                return
            
            # Sanitize filename
            filename = filename.replace('/', '_').replace('\\', '_')
            if not filename.endswith('.py'):
                filename += '.py'
            
            # Write the file
            file_path = NB_DIR / filename
            file_path.write_text(content, encoding='utf-8')
            
            print(f"✅ Saved notebook: {file_path}")
            
            # Send success response
            response = {
                'ok': True,
                'appPath': f'/app/notebooks/{filename}',
                'filename': filename,
                'message': 'Notebook saved successfully'
            }
            
            self.send_json_response(200, response)
            
        except Exception as e:
            print(f"❌ Error saving notebook: {e}")
            self.send_error_response(500, str(e))
    
    def handle_health(self):
        """Health check endpoint"""
        response = {
            'status': 'healthy',
            'notebooks_dir': str(NB_DIR),
            'notebooks': [f.name for f in NB_DIR.glob('*.py')]
        }
        self.send_json_response(200, response)
    
    def handle_root(self):
        """Root endpoint"""
        response = {
            'message': 'Marimo Container Running',
            'notebooks_dir': str(NB_DIR),
            'notebooks': [f.name for f in NB_DIR.glob('*.py')]
        }
        self.send_json_response(200, response)
    
    def send_json_response(self, status_code, data):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def send_error_response(self, status_code, message):
        """Send error response"""
        self.send_json_response(status_code, {'error': message})
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def start_marimo():
    """Start Marimo server with the most recent notebook"""
    try:
        # Find the most recent .py file in notebooks directory
        notebook_files = list(NB_DIR.glob("*.py"))
        if notebook_files:
            # Sort by modification time, newest first
            notebook_files.sort(key=lambda f: f.stat().st_mtime, reverse=True)
            notebook_path = notebook_files[0]
        else:
            # Create a default notebook
            default_notebook = NB_DIR / "default_notebook.py"
            default_content = '''import marimo as mo

app = marimo.App()

@app.cell
def __():
    return "Hello from Marimo!"

@app.cell
def __():
    return 42
'''
            default_notebook.write_text(default_content)
            notebook_path = default_notebook
        
        print(f"🚀 Starting Marimo with notebook: {notebook_path}")
        
        # Start Marimo
        subprocess.run([
            sys.executable, "-m", "marimo", "edit",
            "--host", "0.0.0.0",
            "--port", "2718",
            "--headless",
            "--no-token",
            "--allow-origins", "*",
            str(notebook_path)
        ], check=True)
        
    except Exception as e:
        print(f"❌ Error starting Marimo: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Start HTTP server for file operations
    import threading
    server = HTTPServer(('0.0.0.0', 8080), MarimoHandler)
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()
    
    print("🌐 HTTP server started on port 8080")
    print("📁 Notebooks directory:", NB_DIR)
    
    # Start Marimo
    start_marimo()
