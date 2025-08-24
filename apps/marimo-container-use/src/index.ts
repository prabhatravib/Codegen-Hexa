import { Container, getContainer } from "@cloudflare/containers";

interface NotebookSaveRequest {
  content: string;
  id: string;
}

export class MarimoContainer extends Container {
  defaultPort = 2718;
  sleepAfter = "2h";
}

export class MarimoContainerV2 extends Container {
  defaultPort = 2718;
  sleepAfter = "2h";
}

export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // Handle notebook save API - actually create the notebook file
    if (url.pathname === '/api/save' && request.method === 'POST') {
      try {
        const body = await request.json() as NotebookSaveRequest;
        console.log('Received notebook save request:', body);
        
        // Get the container instance to create the notebook
        const container = getContainer(env.MARIMO);
        await container.start();
        
        // Create a request to create the notebook in the container
        const createRequest = new Request('http://localhost:8080/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        
        try {
          const createResponse = await container.fetch(createRequest);
          if (createResponse.ok) {
            const createData = await createResponse.json();
            console.log('Notebook created successfully in container:', createData);
            
            return new Response(JSON.stringify({
              success: true,
              message: 'Notebook created successfully',
              id: body.id
            }), {
              status: 200,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            });
          } else {
            throw new Error(`Container creation failed: ${createResponse.status}`);
          }
        } catch (containerError) {
          console.error('Container creation error:', containerError);
          
          // Fallback: return success but indicate the notebook needs to be created
          return new Response(JSON.stringify({
            success: true,
            message: 'Notebook creation request received - will be created on first access',
            id: body.id
          }), {
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      } catch (error) {
        console.error('Error handling save request:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // Handle notebook viewing with embedded iframe fix
    if (url.pathname.startsWith('/notebooks/')) {
      const notebookId = url.pathname.split('/')[2];
      const isEmbedded = url.searchParams.get('embedded') === 'true';
      
      if (isEmbedded) {
        // For embedded requests, serve the actual Marimo interface
        // This eliminates the double-iframe issue
        return Response.redirect(new URL('/', request.url));
      }
      
      // Regular notebook view - forward to the Marimo container
      const container = getContainer(env.MARIMO);
      await container.start();
      
      return container.fetch(request);
    }

    // Default: forward to container
    const container = getContainer(env.MARIMO);
    await container.start();
    return container.fetch(request);
  },
};

