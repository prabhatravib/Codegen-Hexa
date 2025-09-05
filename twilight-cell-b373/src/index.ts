import { Container, getContainer } from "@cloudflare/containers";

export class MarimoContainer extends Container {
  // Worker will wait until this port is listening
  defaultPort = 2718; // Marimo default
  // Optional: keep warm window for idle editing
  sleepAfter = "2h";
  // Enable manual start to control when container starts
  manualStart = true;
}

export class MarimoContainerV2 extends Container {
  // Worker will wait until this port is listening
  defaultPort = 2718; // Marimo default
  // Optional: keep warm window for idle editing
  sleepAfter = "2h";
}

export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Handle API endpoints
    if (url.pathname.startsWith('/api/')) {
      if (url.pathname === '/api/save' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { content, id } = body;
          
          if (!content || !id) {
            return new Response(JSON.stringify({ 
              success: false, 
              error: 'Content and id are required' 
            }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          // Get the container instance
          const container = getContainer(env.MARIMO);
          
          // Start the container with the notebook content as environment variable
          await container.start({
            envVars: {
              NOTEBOOK_CONTENT: content
            }
          });
          
          return new Response(JSON.stringify({
            success: true,
            id: id,
            url: `https://twilight-cell-b373.prabhatravib.workers.dev/notebooks/${id}`
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (error) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // Get the container instance
    const container = getContainer(env.MARIMO);
    
    // Ensure container is started
    console.log("Starting Marimo container...");
    await container.start();
    console.log("Container started successfully");
    
    try {
      // Forward ALL requests to the Marimo container
      // This ensures the notebook interface is properly served
      const response = await container.fetch(request);
      
      // Ensure status code is valid (200-599)
      const status = Math.max(200, Math.min(599, response.status || 200));
      
      // Add CORS headers to the response
      const corsResponse = new Response(response.body, {
        status: status,
        statusText: response.statusText || 'OK',
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        },
      });
      
      return corsResponse;
    } catch (error) {
      console.error('Error forwarding request to container:', error);
      
      // Return a proper error response with CORS headers
      return new Response(JSON.stringify({ 
        error: 'Failed to process request', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }), {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        },
      });
    }
  },
};

