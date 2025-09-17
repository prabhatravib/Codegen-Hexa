#!/usr/bin/env python3
"""
Simple test server to verify the container can run Python/FastAPI
"""

import os
from fastapi import FastAPI
import uvicorn

app = FastAPI(title="Simple Test Server")

@app.get("/")
async def root():
    return {"message": "Simple test server is running!"}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/api/health")
async def api_health():
    return {"ok": True}

@app.post("/api/save")
async def save_test(request):
    return {"ok": True, "message": "Test save endpoint working"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    host = "0.0.0.0"
    
    print(f"Starting Simple Test Server on {host}:{port}")
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info"
    )
