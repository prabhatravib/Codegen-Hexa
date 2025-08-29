"""
CodeGen Hexa Backend - Minimal Python Workers Test
Following the exact pattern from Cloudflare documentation
"""

from workers import WorkerEntrypoint, Response

class Default(WorkerEntrypoint):
    """Minimal Python Worker following Cloudflare docs exactly"""
    
    async def fetch(self, request, env):
        """Simple test handler"""
        return Response("Hello from Python Workers!", headers={"Content-Type": "text/plain"})