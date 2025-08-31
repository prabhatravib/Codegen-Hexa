from workers import WorkerEntrypoint, Response
import json
import asyncio
from typing import Dict, Any
import os

# Import our custom modules
from marimo_service import MarimoService
from ai_service import AIService

class Default(WorkerEntrypoint):
    def __init__(self):
        super().__init__()
        self.marimo_service = MarimoService()
        self.ai_service = AIService()
    
    async def fetch(self, request, env):
        """Main request handler for the Python Worker."""
        try:
            # Parse the request
            url = request.url
            path = url.path
            method = request.method
            
            # Handle CORS preflight
            if method == "OPTIONS":
                return self._handle_cors_preflight()
            
            # Route the request
            if path == "/api/marimo/generate":
                return await self._handle_marimo_generate(request, env)
            elif path.startswith("/api/marimo/notebook/"):
                return await self._handle_marimo_notebook(request, env)
            elif path.startswith("/api/marimo/viewer/"):
                return await self._handle_marimo_viewer(request, env)
            elif path == "/api/marimo/create-viewer":
                return await self._handle_marimo_create_viewer(request, env)
            elif path == "/health":
                return self._handle_health()
            else:
                return Response("Not Found", status=404)
                
        except Exception as e:
            return Response(
                json.dumps({"error": str(e), "success": False}),
                status=500,
                headers={"Content-Type": "application/json"}
            )
    
    def _handle_cors_preflight(self):
        """Handle CORS preflight requests."""
        return Response(
            "",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Max-Age": "86400"
            }
        )
    
    async def _handle_marimo_generate(self, request, env):
        """Generate a new Marimo notebook."""
        try:
            # Parse request body
            body = await request.json()
            diagram = body.get("diagram")
            language = body.get("language", "python")
            prompt = body.get("prompt", "Generated from flowchart")
            
            if not diagram:
                return Response(
                    json.dumps({"error": "Diagram is required", "success": False}),
                    status=400,
                    headers={"Content-Type": "application/json"}
                )
            
            # Get OpenAI API key from environment
            openai_api_key = env.get("OPENAI_API_KEY")
            if not openai_api_key:
                return Response(
                    json.dumps({"error": "OpenAI API key not configured", "success": False}),
                    status=500,
                    headers={"Content-Type": "application/json"}
                )
            
            # Generate Marimo notebook using AI
            marimo_notebook = await self.ai_service.generate_marimo_notebook(
                prompt, diagram, language, openai_api_key
            )
            
            # Generate a unique ID for this notebook
            server_id = f"marimo_{int(asyncio.get_event_loop().time() * 1000)}_{hash(diagram) % 10000}"
            print('Generating notebook with ID:', server_id)
            print('Storing notebook in service...')
            
            # Store the notebook
            self.marimo_service.store_notebook(server_id, marimo_notebook)
            print(f'Notebook stored successfully. Active notebooks: {self.marimo_service.get_active_server_count()}')
            
            return Response(
                json.dumps({
                    "success": True,
                    "marimoNotebook": marimo_notebook,
                    "serverId": server_id,
                    "notebookContent": marimo_notebook,
                    "diagram": diagram,
                    "language": language,
                    "prompt": prompt
                }),
                headers={
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            )
            
        except Exception as e:
            return Response(
                json.dumps({"error": str(e), "success": False}),
                status=500,
                headers={"Content-Type": "application/json"}
            )
    
    async def _handle_marimo_notebook(self, request, env):
        """Get a specific Marimo notebook by ID."""
        try:
            # Extract server ID from path
            url = request.url
            path_parts = url.path.split("/")
            if len(path_parts) < 4:
                return Response("Invalid path", status=400)
            
            server_id = path_parts[3]
            notebook = self.marimo_service.get_notebook(server_id)
            
            if not notebook:
                return Response("Notebook not found", status=404)
            
            return Response(
                notebook,
                headers={
                    "Content-Type": "text/plain",
                    "Access-Control-Allow-Origin": "*"
                }
            )
            
        except Exception as e:
            return Response(
                json.dumps({"error": str(e), "success": False}),
                status=500,
                headers={"Content-Type": "application/json"}
            )
    
    async def _handle_marimo_viewer(self, request, env):
        """Get the Marimo viewer HTML for a specific notebook."""
        try:
            # Extract server ID from path
            url = request.url
            path_parts = url.path.split("/")
            
            # Debug logging
            print(f"Viewer path: {url.path}")
            print(f"Path parts: {path_parts}")
            
            if len(path_parts) < 4:
                return Response("Invalid path", status=400)
            
            server_id = path_parts[3]
            print(f"Extracted server ID: {server_id}")
            
            notebook = self.marimo_service.get_notebook(server_id)
            
            if not notebook:
                return Response("Notebook not found", status=404)
            
            # Create the Marimo WASM viewer HTML
            viewer_html = self.marimo_service.create_wasm_viewer_html(notebook, server_id)
            
            return Response(
                viewer_html,
                headers={
                    "Content-Type": "text/html",
                    "Access-Control-Allow-Origin": "*"
                }
            )
            
        except Exception as e:
            print(f"Viewer error: {str(e)}")
            return Response(
                json.dumps({"error": str(e), "success": False}),
                status=500,
                headers={"Content-Type": "application/json"}
            )
    
    async def _handle_marimo_create_viewer(self, request, env):
        """Create a Marimo viewer for existing notebook content."""
        try:
            # Parse request body
            body = await request.json()
            notebook_content = body.get("notebookContent")
            
            if not notebook_content:
                return Response(
                    json.dumps({"error": "Notebook content is required", "success": False}),
                    status=400,
                    headers={"Content-Type": "application/json"}
                )
            
            # Generate a unique ID for this notebook
            server_id = f"viewer_{int(asyncio.get_event_loop().time() * 1000)}_{hash(notebook_content) % 10000}"
            print('Creating viewer for notebook with ID:', server_id)
            
            # Store the notebook
            self.marimo_service.store_notebook(server_id, notebook_content)
            print(f'Viewer notebook stored successfully. Active notebooks: {self.marimo_service.get_active_server_count()}')
            
            return Response(
                json.dumps({
                    "success": True,
                    "serverId": server_id,
                    "viewerUrl": f"/api/marimo/viewer/{server_id}"
                }),
                headers={
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            )
            
        except Exception as e:
            print(f"Create viewer error: {str(e)}")
            return Response(
                json.dumps({"error": str(e), "success": False}),
                status=500,
                headers={"Content-Type": "application/json"}
            )
    
    def _handle_health(self):
        """Health check endpoint."""
        return Response(
            json.dumps({
                "status": "healthy",
                "service": "Marimo Python Worker",
                "endpoints": [
                    "/api/marimo/generate",
                    "/api/marimo/create-viewer",
                    "/api/marimo/notebook/{serverId}",
                    "/api/marimo/viewer/{serverId}",
                    "/health"
                ]
            }),
            headers={
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        )
