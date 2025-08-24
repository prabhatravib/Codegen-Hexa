import { Container, getContainer } from "@cloudflare/containers";

export class MarimoContainer extends Container {
  // Worker will wait until this port is listening
  defaultPort = 2718; // Marimo default
  // Optional: keep warm window for idle editing
  sleepAfter = "2h";
}

export default {
  async fetch(request: Request, env: any) {
    try {
      // Get the container instance using the binding
      const container = getContainer(env.MARIMO);
      
      // Ensure container is started
      console.log("Starting Marimo container...");
      await container.start();
      console.log("Container started successfully");
      
      // Handle API endpoints before forwarding to Marimo
      const url = new URL(request.url);
      
      if (url.pathname === '/api/save' && request.method === 'POST') {
        // Forward to the simple HTTP server running in the container
        try {
          const response = await container.fetch(new Request('http://localhost:8080/api/save', {
            method: 'POST',
            headers: request.headers,
            body: request.body
          }));
          
          return response;
        } catch (error) {
          console.error('Error forwarding to container API:', error);
          return new Response(JSON.stringify({
            success: false,
            error: 'Failed to create notebook in container'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      if (url.pathname.startsWith('/notebooks/')) {
        // Extract notebook ID and redirect to Marimo
        const notebookId = url.pathname.split('/')[2];
        console.log(`Serving notebook: ${notebookId}`);
        
        // Forward to Marimo's edit interface
        const marimoUrl = `http://localhost:2718/edit/${notebookId}_marimo_notebook.py`;
        return container.fetch(new Request(marimoUrl));
      }
      
      // Forward all other requests to the Marimo container
      return container.fetch(request);
      
    } catch (error) {
      console.error('Error with container:', error);
      return new Response(JSON.stringify({
        message: 'Marimo Container Worker',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoints: [
          'POST /api/save - Save notebook content',
          'GET /notebooks/{id} - Access notebook',
          'Container forwarding will be available once container is ready'
        ]
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }
  },
};
