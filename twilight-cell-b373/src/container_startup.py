#!/usr/bin/env python3
"""
Dynamic container startup that creates custom notebooks from request body
"""

import os
import sys
import json
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler

class MarimoHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests"""
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(b'<h1>Marimo Container Ready</h1><p>Send POST to /create with notebook content</p>')
    
    def do_POST(self):
        """Handle POST requests to create notebooks"""
        try:
            print(f"📥 Received POST request to: {self.path}")
            
            if self.path == '/create':
                # Get content length
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length == 0:
                    raise Exception("No content in request body")
                
                # Read JSON body
                body = self.rfile.read(content_length)
                data = json.loads(body.decode('utf-8'))
                
                notebook_id = data.get('id')
                notebook_content = data.get('content')
                
                if not notebook_content:
                    raise Exception("No notebook content in request body")
                
                print(f"✅ Received notebook content for ID: {notebook_id}")
                print(f"📝 Content length: {len(notebook_content)} characters")
                
                # Create notebooks directory
                notebooks_dir = Path("/app/notebooks")
                notebooks_dir.mkdir(exist_ok=True)
                
                # Write notebook content to file
                notebook_path = notebooks_dir / f"{notebook_id}.py"
                notebook_path.write_text(notebook_content, encoding='utf-8')
                print(f"✅ Created notebook at: {notebook_path}")
                
                # Return success response
                success_response = {
                    "success": True,
                    "id": notebook_id,
                    "message": "Notebook created successfully"
                }
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(success_response).encode('utf-8'))
                print("✅ Success response sent to frontend")
            elif self.path.startswith('/notebooks/'):
                # Serve notebook by ID
                notebook_id = self.path.split('/')[-1].split('?')[0]  # Remove query params
                notebook_path = Path("/app/notebooks") / f"{notebook_id}.py"
                
                if not notebook_path.exists():
                    self.send_error(404, f"Notebook {notebook_id} not found")
                    return
                
                # Serve the Marimo notebook file
                self.serve_marimo_notebook(notebook_path)
            elif self.path == '/debug/echo':
                # Debug endpoint to echo what container receives
                content_length = int(self.headers.get('Content-Length', 0))
                body = self.rfile.read(content_length) if content_length > 0 else b''
                
                debug_response = {
                  "containerReceivedHeaders": [(k, v) for k, v in self.headers.items()],
                  "containerBodyBytes": len(body)
                }
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(debug_response).encode('utf-8'))
                print("✅ Debug echo endpoint served")
            else:
                raise Exception(f"Unknown POST endpoint: {self.path}")
                
        except Exception as e:
            print(f"❌ CRITICAL ERROR: {e}")
            import traceback
            traceback.print_exc()
            self.send_error(500, f"CRITICAL ERROR: {e}\n\n{traceback.format_exc()}")
    
    def serve_marimo_notebook(self, notebook_path):
        """Serve the Marimo notebook file"""
        try:
            print("📁 Serving Marimo notebook file...")
            
            # Read the notebook content
            with open(notebook_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Serve as Python file with proper headers
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.send_header('Content-Disposition', f'attachment; filename="{notebook_path.name}"')
            self.end_headers()
            
            # Send the notebook content
            self.wfile.write(content.encode('utf-8'))
            print("✅ Successfully served Marimo notebook file")
            
        except Exception as e:
            print(f"❌ CRITICAL ERROR serving notebook: {e}")
            import traceback
            traceback.print_exc()
            raise Exception(f"Failed to serve notebook: {e}")
    
    def log_message(self, format, *args):
        """Custom logging"""
        print(f"📝 {format % args}")

def main():
    """Main startup function"""
    print("🚀 Starting Marimo container with HTTP handler...")
    
    try:
        # Create notebooks directory
        notebooks_dir = Path("/app/notebooks")
        notebooks_dir.mkdir(exist_ok=True)
        
        # Start HTTP server on port 8080
        server = HTTPServer(('0.0.0.0', 8080), MarimoHandler)
        print(f"🌐 HTTP server started on port 8080")
        print(f"🎯 Container will create and serve dynamic Marimo notebooks via POST /create")
        
        # Start server
        server.serve_forever()
        
    except Exception as e:
        print(f"❌ CRITICAL CONTAINER STARTUP ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
