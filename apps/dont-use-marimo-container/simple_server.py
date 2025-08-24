#!/usr/bin/env python3
"""
Simple HTTP server to handle dynamic notebook creation in the Marimo container.
This runs alongside Marimo to provide API endpoints.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
from pathlib import Path
import urllib.parse

# Ensure notebooks directory exists
notebooks_dir = Path("/app/notebooks")
notebooks_dir.mkdir(exist_ok=True)

class NotebookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        """Handle POST requests for notebook creation"""
        if self.path == '/api/save':
            try:
                # Get content length
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                
                # Parse JSON data
                data = json.loads(post_data.decode('utf-8'))
                content = data.get('content')
                notebook_id = data.get('id')
                
                if not content or not notebook_id:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    
                    response = {
                        'success': False,
                        'error': 'Missing content or id'
                    }
                    self.wfile.write(json.dumps(response).encode())
                    return
                
                # Create notebook file
                notebook_path = notebooks_dir / f"{notebook_id}_marimo_notebook.py"
                
                # Write the notebook content
                with open(notebook_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                print(f"✅ Created notebook: {notebook_path}")
                
                # Return success response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {
                    'success': True,
                    'id': notebook_id,
                    'url': f'/notebooks/{notebook_id}'
                }
                self.wfile.write(json.dumps(response).encode())
                
            except Exception as e:
                print(f"❌ Error creating notebook: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {
                    'success': False,
                    'error': str(e)
                }
                self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'status': 'healthy',
                'service': 'Marimo Container API',
                'notebooks_dir': str(notebooks_dir),
                'notebooks_count': len(list(notebooks_dir.glob('*.py')))
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def main():
    """Start the HTTP server"""
    port = 8080
    server = HTTPServer(('0.0.0.0', port), NotebookHandler)
    print(f"🚀 Starting notebook API server on port {port}")
    print(f"📁 Notebooks directory: {notebooks_dir}")
    server.serve_forever()

if __name__ == '__main__':
    main()
