from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import httpx
import os
import time
import json

# Use the internal Marimo port
MARIMO_PORT = int(os.getenv("MARIMO_PORT", "2718"))
MARIMO_BASE = f"http://127.0.0.1:{MARIMO_PORT}"
DATA_DIR = Path("/app/notebooks")
DATA_DIR.mkdir(parents=True, exist_ok=True)
TOKEN = os.getenv("MARIMO_TOKEN")

app = FastAPI()
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"], 
    allow_methods=["*"], 
    allow_headers=["*"],
    allow_credentials=True
)

@app.post("/api/save")
async def save(req: Request):
    if TOKEN:
        auth = req.headers.get("authorization", "")
        if not auth.startswith("Bearer ") or auth.split(" ", 1)[1] != TOKEN:
            raise HTTPException(status_code=401, detail="unauthorized")

    try:
        p = await req.json()
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        raise HTTPException(status_code=400, detail="invalid json")

    nb_id = p.get("id")
    content = p.get("content")
    filename = p.get("filename") or (nb_id + ".py" if nb_id else None)
    
    if not content:
        raise HTTPException(status_code=400, detail="content required")
    
    if not filename:
        # Generate filename from ID or timestamp
        if nb_id:
            filename = f"{nb_id}.py"
        else:
            filename = f"notebook_{int(time.time())}.py"

    # Sanitize filename
    filename = filename.replace('/', '_').replace('\\', '_')
    if not filename.endswith('.py'):
        filename += '.py'

    # Save the notebook
    path = DATA_DIR / filename
    print(f"Saving notebook to: {path}")
    path.write_text(content, encoding="utf-8")

    # Extract ID from filename for response
    response_id = nb_id or filename.replace('.py', '')
    
    print(f"Notebook saved successfully: {filename}")
    
    # Restart Marimo server with the new notebook
    print(f"Restarting Marimo server with notebook: {filename}")
    import subprocess
    import signal
    import os
    
    # Kill existing Marimo process
    try:
        # Find and kill the Marimo process
        result = subprocess.run(['pkill', '-f', 'marimo'], capture_output=True)
        print(f"Killed existing Marimo processes: {result.returncode}")
    except Exception as e:
        print(f"Error killing Marimo: {e}")
    
    # Start new Marimo server with the specific notebook
    try:
        marimo_cmd = [
            'python', '-m', 'marimo', 'edit', str(path),
            '--host', '0.0.0.0', '--port', str(MARIMO_PORT),
            '--headless', '--no-token', '--allow-origins', '*'
        ]
        print(f"Starting Marimo with command: {' '.join(marimo_cmd)}")
        subprocess.Popen(marimo_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("Marimo server restarted successfully")
    except Exception as e:
        print(f"Error starting Marimo: {e}")
    
    return JSONResponse({
        "ok": True, 
        "id": response_id, 
        "filename": filename,
        "url": f"/notebooks/{response_id}",
        "message": "Notebook saved successfully"
    })

@app.get("/notebooks/{nb_id}", response_class=HTMLResponse)
async def notebook_page(nb_id: str):
    """Serve the notebook viewer page"""
    # Check if the notebook file exists
    notebook_file = DATA_DIR / f"{nb_id}.py"
    if not notebook_file.exists():
        # Try with .py extension already in the ID
        notebook_file = DATA_DIR / nb_id
        if not notebook_file.exists():
            raise HTTPException(status_code=404, detail=f"Notebook {nb_id} not found")
    
    # Create an HTML page that loads the Marimo notebook directly
    html = f"""<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Marimo Notebook: {nb_id}</title>
  </head>
  <body style="margin:0;background:#0b0d12;color:#e5e7eb">
    <div id="header" style="padding:10px 14px;font:14px/1.3 system-ui;border-bottom:1px solid #374151">
      Notebook: {nb_id}
    </div>
    <iframe src="/ui/" style="border:0;width:100%;height:calc(100vh - 44px)"></iframe>
  </body>
</html>"""
    return HTMLResponse(html)

# Generic reverse proxy to Marimo UI
@app.api_route("/ui/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
async def proxy_to_marimo(path: str, request: Request):
    """Proxy requests to the Marimo server"""
    url = f"{MARIMO_BASE}/{path}"
    
    print(f"Proxying to Marimo: {request.method} {url}")
    
    # Define hop-by-hop headers to remove
    HOP_HEADERS = {
        "host", "connection", "keep-alive", "proxy-authenticate", 
        "proxy-authorization", "te", "trailers", "transfer-encoding", "upgrade"
    }
    
    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        # Filter headers
        req_headers = dict(request.headers)
        for header in HOP_HEADERS:
            req_headers.pop(header, None)
        
        try:
            body = await request.body()
            r = await client.request(request.method, url, headers=req_headers, content=body)
            
            # Stream response back
            def iterbytes():
                yield r.content
            
            resp = StreamingResponse(iterbytes(), status_code=r.status_code)
            
            # Copy response headers (excluding hop-by-hop)
            for k, v in r.headers.items():
                if k.lower() not in HOP_HEADERS:
                    resp.headers[k] = v
            
            # Ensure CORS for iframe
            resp.headers["Access-Control-Allow-Origin"] = "*"
            return resp
            
        except httpx.ConnectError as e:
            print(f"Marimo server not available: {e}")
            raise HTTPException(status_code=503, detail="Marimo server not available")
        except httpx.TimeoutException:
            print(f"Marimo server timeout")
            raise HTTPException(status_code=504, detail="Marimo server timeout")
        except Exception as e:
            print(f"Proxy error: {e}")
            raise HTTPException(status_code=502, detail=f"Proxy error: {str(e)}")

@app.get("/health")
def health():
    """Health check endpoint"""
    notebooks = list(DATA_DIR.glob('*.py'))
    return {
        "ok": True,
        "notebooks_dir": str(DATA_DIR),
        "notebooks_count": len(notebooks),
        "notebooks": [f.name for f in notebooks],
        "marimo_port": MARIMO_PORT,
        "marimo_base": MARIMO_BASE
    }

@app.get("/")
def root():
    return {
        "message": "Marimo Container Running",
        "notebooks_dir": str(DATA_DIR),
        "notebooks": [f.name for f in DATA_DIR.glob('*.py')],
        "marimo_port": MARIMO_PORT
    }
