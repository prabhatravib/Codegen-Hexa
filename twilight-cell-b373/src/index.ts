import { Container, getContainer } from "@cloudflare/containers";
export { NotebookStore } from './notebook_store'

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

          // Persist content by id in a Durable Object so any region can start correctly
          try {
            const storeId = env.NOTEBOOK_STORE.idFromName(id)
            const stub = env.NOTEBOOK_STORE.get(storeId)
            await stub.fetch(new URL('/state', request.url), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, content })
            })
          } catch (e) {
            console.error('Failed to persist notebook content', e)
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
            // Return URL with id so any region can restore content if needed
            url: `https://twilight-cell-b373.prabhatravib.workers.dev/?id=${encodeURIComponent(id)}`
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

    // Get the container instance.
    const container = getContainer(env.MARIMO);

    // If an id is supplied, ensure the container is started with the saved content in this region
    const idParam = url.searchParams.get('id')
    if (idParam) {
      try {
        const storeId = env.NOTEBOOK_STORE.idFromName(idParam)
        const stub = env.NOTEBOOK_STORE.get(storeId)
        const res = await stub.fetch(new URL('/state', request.url))
        if (res.ok) {
          const data = await res.json() as { content?: string }
          const content = data?.content
          if (typeof content === 'string' && content.length > 0) {
            try {
              await container.start({ envVars: { NOTEBOOK_CONTENT: content } })
            } catch (e) {
              // Ignore start errors if already running
            }
          }
        }
      } catch (e) {
        console.error('Failed to restore notebook content for id', idParam, e)
      }
    }

    // If we're at root with ?id=..., redirect to the editor path so relative assets resolve correctly
    if (idParam && url.pathname === '/' && request.method === 'GET') {
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/edit/marimo_notebook.py',
          'Cache-Control': 'no-store',
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    try {
      // Forward ALL requests to the Marimo container
      // Normalize some paths so Marimo editor resolves correctly
      let reqToSend: Request = request;
      const path = url.pathname;
      if (path === '/marimo_notebook.py' || path === '/edit' || path === '/edit/') {
        const forwardTo = path === '/marimo_notebook.py' ? '/edit/marimo_notebook.py' : '/edit/marimo_notebook.py';
        const target = new URL(`http://localhost:2718${forwardTo}`);
        // Preserve search params except our own id param if present
        for (const [k, v] of url.searchParams) {
          if (k !== 'id') target.searchParams.set(k, v);
        }
        reqToSend = new Request(target.toString(), request);
      }

      // Important: Preserve WebSocket/SSE upgrades by returning the original response
      const response = await container.fetch(reqToSend);

      const isWs = request.headers.get('Upgrade') === 'websocket' || response.status === 101;
      const accept = request.headers.get('Accept') || '';
      const isSseReq = accept.includes('text/event-stream');
      const ct = response.headers.get('Content-Type') || '';
      const isSseResp = ct.includes('text/event-stream');

      if (isWs || isSseReq || isSseResp) {
        // Return untouched response so the upgrade/stream stays intact
        return response;
      }

      // Add CORS headers for regular HTTP responses
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      headers.set('Cache-Control', 'no-store');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      console.error('Error forwarding request to container:', error);
      
      // Return a proper error response with CORS headers
      const body = {
        error: 'Container not ready',
        hint: 'Use /api/save first to start the container with your notebook content.',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
      return new Response(JSON.stringify(body), {
        status: 503,
        statusText: 'Service Unavailable',
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
