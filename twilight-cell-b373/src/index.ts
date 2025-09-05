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
      // Simple health to validate bindings without starting the container
      if (url.pathname === '/api/health' && request.method === 'GET') {
        try {
          const info: Record<string, unknown> = {
            hasBinding: !!env.MARIMO,
            timestamp: Date.now(),
          };
          // Try to instantiate to ensure DO class exists
          try {
            const container = getContainer(env.MARIMO);
            info.canGetContainer = !!container;
          } catch (e) {
            info.canGetContainer = false;
            info.getContainerError = e instanceof Error ? e.message : String(e);
          }
          return new Response(JSON.stringify({ ok: true, ...info }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store',
              'Access-Control-Allow-Origin': '*',
            },
          });
        } catch (e) {
          return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      }

      if (url.pathname === '/api/save' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { content, id } = body as { content?: string; id?: string };
          console.log('POST /api/save', {
            id,
            content_len: typeof content === 'string' ? content.length : 0,
          });
          
          if (!content || !id) {
            return new Response(JSON.stringify({ 
              success: false, 
              error: 'Content and id are required' 
            }), {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store',
                'Access-Control-Allow-Origin': '*',
              }
            });
          }

          // Get the container instance
          const container = getContainer(env.MARIMO);
          
          // Start the container with the notebook content as environment variable
          console.log('Starting container with NOTEBOOK_CONTENT...');
          await container.start({
            envVars: {
              NOTEBOOK_CONTENT: content
            }
          });
          
          console.log('Container started; returning URL');
          return new Response(JSON.stringify({
            success: true,
            id: id,
            // Expose the base URL of the container; the container serves the active notebook at '/'
            url: `https://twilight-cell-b373.prabhatravib.workers.dev/`
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store',
              'Access-Control-Allow-Origin': '*',
            }
          });
        } catch (error) {
          console.error('Error in /api/save:', error);
          return new Response(JSON.stringify({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store',
              'Access-Control-Allow-Origin': '*',
            }
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
      // Important: Preserve WebSocket/SSE upgrades by returning the original response
      const response = await container.fetch(request);

      const isWs = request.headers.get('Upgrade') === 'websocket' || response.status === 101;
      const accept = request.headers.get('Accept') || '';
      const isSse = accept.includes('text/event-stream');

      if (isWs || isSse) {
        // Return untouched response so the upgrade/stream stays intact
        return response;
      }

      // Add CORS headers for regular HTTP responses
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
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
