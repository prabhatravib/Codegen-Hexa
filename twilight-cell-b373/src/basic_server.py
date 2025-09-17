#!/usr/bin/env python3
"""
Basic Python HTTP server to test container startup
"""

import http.server
import socketserver
import os
import json

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status": "ok"}')
        elif self.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"ok": true}')
        else:
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"message": "Basic server running"}')
    
    def do_POST(self):
        if self.path == '/api/save':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"ok": true, "message": "Save endpoint working"}')
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    host = "0.0.0.0"
    
    print(f"Starting Basic HTTP Server on {host}:{port}")
    
    with socketserver.TCPServer((host, port), MyHandler) as httpd:
        print(f"Server running at http://{host}:{port}")
        httpd.serve_forever()
