#!/usr/bin/env python3
"""
Simple test server to verify HTTP functionality
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class SimpleHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'OK')
            return
        
        elif self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<h1>Simple Server Working!</h1>')
            return
        
        else:
            self.send_error(404, 'Not Found')
    
    def do_POST(self):
        if self.path == '/test':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            response = {
                'success': True,
                'message': 'POST request received',
                'data': post_data.decode('utf-8')
            }
            
            self.wfile.write(json.dumps(response).encode())
            return
        
        else:
            self.send_error(404, 'Not Found')

def main():
    print("🚀 Starting simple test server...")
    print("Host: 0.0.0.0, Port: 8000")
    
    try:
        server = HTTPServer(('0.0.0.0', 8000), SimpleHandler)
        print("✅ Server started successfully!")
        print("✅ Ready to serve requests!")
        print("🌐 Test with: http://localhost:8000/health")
        
        server.serve_forever()
        
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        return False
    
    return True

if __name__ == "__main__":
    main()
