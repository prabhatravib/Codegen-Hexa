from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import subprocess
import uuid
import os

app = Flask(__name__)
CORS(app)

# Store running notebooks
notebooks = {}

@app.route('/launch', methods=['POST'])
def launch_notebook():
    data = request.json
    notebook_content = data.get('notebook')
    
    # Create temporary file
    notebook_id = str(uuid.uuid4())
    temp_file = f"/tmp/marimo_{notebook_id}.py"
    
    with open(temp_file, 'w') as f:
        f.write(notebook_content)
    
    # Launch Marimo server
    port = find_free_port()
    process = subprocess.Popen([
        'marimo', 'run', temp_file,
        '--port', str(port),
        '--headless',
        '--no-browser',
        '--presentation',
        '--include-code'
    ])
    
    notebooks[notebook_id] = {
        'process': process,
        'port': port,
        'file': temp_file
    }
    
    return jsonify({
        'notebook_id': notebook_id,
        'url': f'http://localhost:{port}'
    })

def find_free_port():
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

if __name__ == '__main__':
    app.run(port=5000)
