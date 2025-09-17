#!/usr/bin/env python3
"""
ASGI server for Marimo notebooks - inspired by pitext_codegen implementation.
This runs Marimo as an ASGI app instead of trying to run it as the main container process.
"""

import os
import sys
import logging
import tempfile
import asyncio
from pathlib import Path
from typing import Optional
import marimo
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import Response
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MarimoASGIServer:
    def __init__(self):
        self.app = FastAPI(title="Marimo ASGI Server")
        self.notebook_path: Optional[Path] = None
        self.marimo_app = None
        self.setup_routes()
    
    def setup_routes(self):
        """Setup FastAPI routes"""
        
        @self.app.get("/health")
        async def health():
            return {"status": "ok", "marimo_ready": self.marimo_app is not None}
        
        @self.app.get("/api/health")
        async def api_health():
            return {"ok": True}
        
        @self.app.post("/api/save")
        async def save_notebook(request: Request):
            """Save notebook content and create Marimo ASGI app"""
            try:
                body = await request.json()
                content = body.get("content", "")
                notebook_id = body.get("id", "default")
                
                if not content:
                    raise HTTPException(status_code=400, detail="No content provided")
                
                # Create temporary notebook file
                self.notebook_path = self.create_notebook_file(content, notebook_id)
                logger.info(f"Created notebook file: {self.notebook_path}")
                
                # Create Marimo ASGI app
                self.marimo_app = self.create_marimo_asgi_app(self.notebook_path)
                
                # Mount the Marimo app
                self.app.mount("/marimo", self.marimo_app)
                
                logger.info("Marimo ASGI app created and mounted successfully")
                
                return {
                    "ok": True,
                    "url": "/marimo",
                    "id": notebook_id,
                    "filename": f"{notebook_id}.py"
                }
                
            except Exception as e:
                logger.error(f"Failed to save notebook: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/")
        async def root():
            """Root endpoint - redirect to Marimo if available"""
            if self.marimo_app:
                return Response(
                    content='<script>window.location.href="/marimo";</script>',
                    media_type="text/html"
                )
            else:
                return {"message": "Marimo ASGI Server - No notebook loaded"}
    
    def create_notebook_file(self, content: str, notebook_id: str) -> Path:
        """Create a temporary notebook file"""
        # Use /app/notebooks directory (created in Dockerfile)
        notebooks_dir = Path("/app/notebooks")
        notebooks_dir.mkdir(exist_ok=True)
        
        filename = f"{notebook_id}.py"
        notebook_path = notebooks_dir / filename
        
        with open(notebook_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        logger.info(f"Created notebook file: {notebook_path}")
        return notebook_path
    
    def create_marimo_asgi_app(self, notebook_path: Path):
        """Create Marimo ASGI app from notebook file"""
        try:
            logger.info(f"Creating Marimo ASGI app for: {notebook_path}")
            
            # Verify notebook file exists and has content
            if not notebook_path.exists():
                raise ValueError(f"Notebook file does not exist: {notebook_path}")
            
            with open(notebook_path, 'r', encoding='utf-8') as f:
                content = f.read()
                logger.info(f"Notebook file has {len(content)} characters")
                logger.info(f"Notebook contains {content.count('@app.cell')} cells")
            
            # Create Marimo ASGI app
            marimo_asgi = marimo.create_asgi_app()
            
            # Configure with the notebook file
            configured_app = marimo_asgi.with_app(
                path="",  # serve at root of mount
                root=str(notebook_path)  # notebook file path
            )
            
            # Build the ASGI app
            final_app = configured_app.build()
            
            logger.info("Marimo ASGI app created successfully")
            return final_app
            
        except Exception as e:
            logger.error(f"Failed to create Marimo ASGI app: {e}")
            raise ValueError(f"Failed to create Marimo ASGI app: {e}")

def main():
    """Main entry point"""
    port = int(os.environ.get("PORT", 8080))
    host = "0.0.0.0"
    
    logger.info(f"Starting Marimo ASGI Server on {host}:{port}")
    
    # Create server instance
    server = MarimoASGIServer()
    
    # Run the server
    uvicorn.run(
        server.app,
        host=host,
        port=port,
        log_level="info",
        access_log=True
    )

if __name__ == "__main__":
    main()
