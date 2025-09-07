#!/usr/bin/env python3
"""
Test script to verify the Marimo container is working
"""

import http.server
import socketserver
import sys
import os
from pathlib import Path

print("🚀 MARIMO CONTAINER TEST STARTING!")
print(f"🚀 Python version: {sys.version}")
print(f"🚀 Current directory: {os.getcwd()}")
print(f"🚀 Notebooks directory: {Path('/app/notebooks') if os.path.exists('/app') else Path('./notebooks')}")
sys.stdout.flush()

class MarimoTestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            response = f"""
            <h1>✅ Marimo Container is Working!</h1>
            <p>Python version: {sys.version}</p>
            <p>Time: {__import__('time').ctime()}</p>
            <p>Current directory: {os.getcwd()}</p>
            <p>Notebooks directory: {Path('/app/notebooks') if os.path.exists('/app') else Path('./notebooks')}</p>
            <h2>Test Endpoints:</h2>
            <ul>
                <li><a href="/test-notebook">Test Notebook</a></li>
                <li><a href="/health">Health Check</a></li>
            </ul>
            """
            self.wfile.write(response.encode())
        elif self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                "status": "healthy",
                "python_version": sys.version,
                "notebooks_dir": str(Path('/app/notebooks') if os.path.exists('/app') else Path('./notebooks')),
                "timestamp": __import__('time').ctime()
            }
            import json
            self.wfile.write(json.dumps(response, indent=2).encode())
        elif self.path == '/test-notebook':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            response = f"""# Test Marimo Notebook

import marimo as mo

# Initialize the Marimo app
app = mo.App()

@app.cell
def __():
    mo.md("# Test Notebook")
    return "Hello from test notebook!"

@app.cell
def __():
    import numpy as np
    data = np.random.randn(50)
    return data
"""
            self.wfile.write(response.encode())
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not found")

    def do_POST(self):
        if self.path == '/create-notebook':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            import json
            response = {
                "success": True,
                "message": "Test notebook creation endpoint working",
                "received_data": post_data.decode()[:100] + "..." if len(post_data) > 100 else post_data.decode()
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not found")

print("🌐 Starting Marimo test server on port 2718...")
with socketserver.TCPServer(("0.0.0.0", 2718), MarimoTestHandler) as httpd:
    print("✅ Marimo test server is running!")
    print("🌐 Test endpoints available:")
    print("   - GET / - Main test page")
    print("   - GET /health - Health check")
    print("   - GET /test-notebook - Sample notebook")
    print("   - POST /create-notebook - Test notebook creation")
    sys.stdout.flush()
    httpd.serve_forever()
