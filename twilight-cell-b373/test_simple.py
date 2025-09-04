#!/usr/bin/env python3
"""
Minimal test script to verify container basics
"""

import http.server
import socketserver
import sys

print("🔥 MINIMAL TEST CONTAINER STARTING!")
print(f"🔥 Python version: {sys.version}")
sys.stdout.flush()

class TestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        response = f"""
        <h1>✅ Container is Working!</h1>
        <p>Python version: {sys.version}</p>
        <p>Time: {__import__('time').ctime()}</p>
        """
        self.wfile.write(response.encode())

print("🌐 Starting test server on port 2718...")
with socketserver.TCPServer(("0.0.0.0", 2718), TestHandler) as httpd:
    print("✅ Test server is running!")
    sys.stdout.flush()
    httpd.serve_forever()
