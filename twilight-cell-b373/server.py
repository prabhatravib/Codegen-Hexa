from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import httpx
import os
import time

MARIMO_BASE = "http://127.0.0.1:2718"
DATA_DIR = Path("/app/notebooks")
DATA_DIR.mkdir(parents=True, exist_ok=True)
TOKEN = os.getenv("MARIMO_TOKEN")

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.post("/api/save")
async def save(req: Request):
    if TOKEN:
        auth = req.headers.get("authorization", "")
        if not auth.startswith("Bearer ") or auth.split(" ", 1)[1] != TOKEN:
            raise HTTPException(status_code=401, detail="unauthorized")

    try:
        p = await req.json()
    except Exception:
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

    path = DATA_DIR / filename
    path.write_text(content, encoding="utf-8")

    # Extract ID from filename for response
    response_id = nb_id or filename.replace('.py', '')
    
    # front-end will iframe this URL (worker → container:8080)
    return JSONResponse({
        "ok": True, 
        "id": response_id, 
        "filename": filename,
        "url": f"/notebooks/{response_id}",
        "message": "Notebook saved successfully"
    })

@app.get("/notebooks/{nb_id}", response_class=HTMLResponse)
async def notebook_page(nb_id: str):
    # simple wrapper that embeds Marimo under same origin via /ui/*
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
    <iframe src="/ui/" style="border:0;width:100%;height:calc(100vh - 44px)" sandbox="allow-scripts allow-same-origin"></iframe>
  </body>
</html>"""
    return HTMLResponse(html)

# Generic reverse proxy to Marimo UI on 2718
@app.api_route("/ui/{{path:path}}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
async def proxy_to_marimo(path: str, request: Request):
    url = f"{MARIMO_BASE}/{path}"
    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        req_headers = dict(request.headers)
        # remove hop-by-hop headers
        for k in ["host", "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
                  "te", "trailers", "transfer-encoding", "upgrade"]:
            req_headers.pop(k, None)
        body = await request.body()
        r = await client.request(request.method, url, headers=req_headers, content=body)
        # stream back
        def iterbytes():
            yield r.content
        resp = StreamingResponse(iterbytes(), status_code=r.status_code)
        for k, v in r.headers.items():
            if k.lower() not in {"content-length", "transfer-encoding", "connection"}:
                resp.headers[k] = v
        # same-origin for iframe
        resp.headers["Access-Control-Allow-Origin"] = "*"
        return resp

@app.get("/health")
def health():
    return {
        "ok": True,
        "notebooks_dir": str(DATA_DIR),
        "notebooks": [f.name for f in DATA_DIR.glob('*.py')]
    }

@app.get("/")
def root():
    return {
        "message": "Marimo Container Running",
        "notebooks_dir": str(DATA_DIR),
        "notebooks": [f.name for f in DATA_DIR.glob('*.py')]
    }
