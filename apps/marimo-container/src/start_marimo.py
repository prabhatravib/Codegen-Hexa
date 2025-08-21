import os
import sys
import json
import tempfile
import subprocess
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading
import time

class MarimoRequestHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, notebooks_dir=None, **kwargs):
        self.notebooks_dir = notebooks_dir
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        query_params = parse_qs(parsed_url.query)
        
        if path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'OK')
            return
        
        elif path == '/edit':
            # Handle notebook editing
            if 'file' in query_params:
                notebook_content = query_params['file'][0]
                self.serve_marimo_editor(notebook_content)
            else:
                self.send_error(400, 'Missing file parameter')
            return
        
        elif path == '/':
            # Serve the main Marimo interface
            self.serve_marimo_interface()
            return
        
        else:
            self.send_error(404, 'Not Found')
    
    def serve_marimo_editor(self, notebook_content):
        """Serve a Marimo editor with the given notebook content"""
        try:
            # Create a temporary notebook file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, dir=self.notebooks_dir) as f:
                f.write(notebook_content)
                temp_file_path = f.name
            
            # Start Marimo server for this specific notebook
            self.start_marimo_server(temp_file_path)
            
            # Redirect to the Marimo interface
            self.send_response(302)
            self.send_header('Location', f'http://localhost:2718/edit?file={temp_file_path}')
            self.end_headers()
            
        except Exception as e:
            self.send_error(500, f'Error creating notebook: {str(e)}')
    
    def serve_marimo_interface(self):
        """Serve the main Marimo interface"""
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Marimo Container</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #333; text-align: center; }
                .info { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .endpoint { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; font-family: monospace; }
                .status { text-align: center; margin: 20px 0; }
                .status.online { color: #4caf50; }
                .status.offline { color: #f44336; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 Marimo Container</h1>
                
                <div class="info">
                    <h3>Container Status</h3>
                    <div class="status online">✅ Online and Ready</div>
                    <p>This container is running a real Marimo Python server that can execute Python code interactively.</p>
                </div>
                
                <div class="info">
                    <h3>Available Endpoints</h3>
                    <div class="endpoint">GET /health - Health check</div>
                    <div class="endpoint">GET /edit?file=content - Edit notebook with content</div>
                    <div class="endpoint">GET / - This interface</div>
                </div>
                
                <div class="info">
                    <h3>How It Works</h3>
                    <p>1. The Cloudflare Worker stores notebooks in KV storage</p>
                    <p>2. When you request a notebook, it creates a temporary .py file</p>
                    <p>3. Marimo server serves the interactive notebook from that file</p>
                    <p>4. You get a real Python execution environment!</p>
                </div>
                
                <div class="info">
                    <h3>Test the Container</h3>
                    <p>Try visiting: <code>/edit?file=print('Hello from Marimo!')</code></p>
                    <p>This will create and serve an interactive notebook with that Python code.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(html_content.encode())
    
    def start_marimo_server(self, notebook_path):
        """Start Marimo server for a specific notebook"""
        try:
            # Start Marimo in a separate thread
            def run_marimo():
                            subprocess.run([
                "python", "-m", "marimo", "edit",
                "--host", "0.0.0.0",
                "--port", "2718",
                "--headless",
                notebook_path
            ], check=True)
            
            thread = threading.Thread(target=run_marimo, daemon=True)
            thread.start()
            
        except Exception as e:
            print(f"Error starting Marimo server: {e}")

def main():
    # Create notebooks directory - use local path when not in Docker
    if os.path.exists("/app"):
        notebooks_dir = Path("/app/notebooks")
    else:
        notebooks_dir = Path("./notebooks")
    
    notebooks_dir.mkdir(exist_ok=True)
    
    print(f"Starting Marimo container server in {notebooks_dir}")
    print(f"Host: 0.0.0.0, Port: 8000")
    print(f"Marimo will be available on port 2718")
    
    # Create custom handler with notebooks directory
    def handler_factory(*args, **kwargs):
        return MarimoRequestHandler(*args, notebooks_dir=notebooks_dir, **kwargs)
    
    # Start HTTP server
    try:
        server = HTTPServer(('0.0.0.0', 8000), handler_factory)
        print("✅ Container server started on port 8000")
        print("✅ Ready to serve Marimo notebooks!")
        
                # Start Marimo server in background
        def start_marimo_background():
            time.sleep(2)  # Wait a bit for container to be ready
            try:
                subprocess.run([
                    "python", "-m", "marimo", "edit",
                    "--host", "0.0.0.0",
                    "--port", "2718",
                    "--headless",
                    str(notebooks_dir)
                ], check=True)
            except Exception as e:
                print(f"Marimo background server error: {e}")
        
        marimo_thread = threading.Thread(target=start_marimo_background, daemon=True)
        marimo_thread.start()
        
        print("🌐 HTTP server starting...")
        print("📝 Marimo server starting in background...")
        
        # Start serving HTTP requests
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Shutting down server...")
            server.shutdown()
        
    except Exception as e:
        print(f"Failed to start container server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
