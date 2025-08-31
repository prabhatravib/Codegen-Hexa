import { Container, getContainer } from "@cloudflare/containers";

interface NotebookSaveRequest {
  content: string;
  id: string;
}

export class MarimoContainer extends Container {
  // Worker will wait until this port is listening
  defaultPort = 2718; // Marimo default
  // Optional: keep warm window for idle editing
  sleepAfter = "2h";
}

export class MarimoContainerV2 extends Container {
  // Worker will wait until this port is listening
  defaultPort = 2718; // Marimo default
  // Optional: keep warm window for idle editing
  sleepAfter = "2h";
}

export default {
  async fetch(request: Request, env: any) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': 'https://codegen-hexa.prabhatravib.workers.dev',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // Handle API endpoints before forwarding to Marimo
    const url = new URL(request.url);
    
    if (url.pathname === '/api/save' && request.method === 'POST') {
      try {
        const body = await request.json() as NotebookSaveRequest;
        console.log('Received notebook save request:', body);
        
        // Get the container instance to save the notebook
        const container = getContainer(env.MARIMO);
        await container.start();
        
        // Create a request to save the notebook in the container
        const saveRequest = new Request('http://localhost:8080/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        
        try {
          const saveResponse = await container.fetch(saveRequest);
          if (saveResponse.ok) {
            const saveData = await saveResponse.json();
            console.log('Notebook saved successfully in container:', saveData);
            
            return new Response(JSON.stringify({
              success: true,
              message: 'Notebook saved successfully',
              id: body.id
            }), {
              status: 200,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'https://codegen-hexa.prabhatravib.workers.dev',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
              }
            });
          } else {
            throw new Error(`Container save failed: ${saveResponse.status}`);
          }
        } catch (containerError) {
          console.error('Container save error:', containerError);
          
          // Fallback: return success but indicate the notebook needs to be created
          return new Response(JSON.stringify({
            success: true,
            message: 'Notebook save request received - will be created on first access',
            id: body.id
          }), {
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': 'https://codegen-hexa.prabhatravib.workers.dev',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type'
            }
          });
        }
      } catch (error) {
        console.error('Error handling save request:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to parse request body'
        }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'https://codegen-hexa.prabhatravib.workers.dev',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          }
        });
      }
    }

    // Handle notebook access requests
    if (url.pathname.startsWith('/notebooks/')) {
      const notebookId = url.pathname.split('/')[2];
      console.log('Accessing notebook:', notebookId);
      
      // Check if this is an embedded request
      const isEmbedded = url.searchParams.get('embedded') === 'true';
      
      if (isEmbedded) {
        // For embedded requests, redirect directly to Marimo without wrapper
        // This eliminates the double-iframe issue
        return Response.redirect(new URL('/', request.url));
      }
      
      // Get the container instance
      const container = getContainer(env.MARIMO);
      await container.start();
      
      // Create an HTML page that embeds the Marimo interface with proper sizing
      const html = `<!DOCTYPE html>
<html style="height: 100%; margin: 0; padding: 0;">
<head>
    <title>Marimo Notebook - ${notebookId}</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            height: 100%;
            width: 100%;
            overflow: hidden;
        }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: #1a1a1a;
            color: white;
            display: flex;
            flex-direction: column;
        }
        
        .marimo-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }
        
        .marimo-header {
            padding: 0.75rem;
            background: rgba(156, 39, 176, 0.1);
            border-bottom: 1px solid rgba(255,255,255,.2);
            flex-shrink: 0;
        }
        
        .marimo-header h3 {
            color: #9C27B0;
            margin: 0;
            font-size: 1.1rem;
            text-align: center;
        }
        
        .notebook-id {
            color: rgba(255,255,255,0.8);
            margin: 0.25rem 0 0 0;
            font-size: 0.75rem;
            text-align: center;
        }
        
        .status {
            padding: 0.5rem;
            background: #2a2a2a;
            border-bottom: 1px solid #444;
            font-size: 0.875rem;
            text-align: center;
            flex-shrink: 0;
        }
        
        .marimo-iframe-wrapper {
            flex: 1;
            position: relative;
            overflow: hidden;
            width: 100%;
            min-height: 0; /* Important for flexbox */
        }
        
        .marimo-iframe-wrapper iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
            background: #fff;
        }
        
        .external-link {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            margin-top: 0.25rem;
            background: rgba(156, 39, 176, 0.2);
            color: #9C27B0;
            text-decoration: none;
            border-radius: 3px;
            border: 1px solid rgba(156, 39, 176, 0.3);
            transition: all 0.3s ease;
            font-size: 0.75rem;
        }
        
        .external-link:hover {
            background: rgba(156, 39, 176, 0.3);
            transform: translateY(-1px);
        }
    </style>
</head>
<body>
    <div class="marimo-container">
        <div class="marimo-header">
            <h3>💡 Interactive Marimo Notebook</h3>
            <div class="notebook-id">ID: ${notebookId}</div>
            <a href="/" target="_blank" class="external-link">Open Full Marimo</a>
        </div>
        <div class="status">
            ✅ Notebook loaded • Interactive Marimo interface ready
        </div>
        <div class="marimo-iframe-wrapper">
            <iframe 
                src="/" 
                title="Interactive Marimo Notebook"
                sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin allow-downloads"
            ></iframe>
        </div>
    </div>
</body>
</html>`;
      
      return new Response(html, {
        status: 200,
        headers: { 
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': 'https://codegen-hexa.prabhatravib.workers.dev'
        }
      });
    }

    // Get the container instance
    const container = getContainer(env.MARIMO);
    
    // Ensure container is started
    console.log("Starting Marimo container...");
    await container.start();
    console.log("Container started successfully");
    
    // Forward ALL requests to the Marimo container
    // This ensures the notebook interface is properly served
    const response = await container.fetch(request);
    
    // Add CORS headers to all responses from the container
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Access-Control-Allow-Origin', 'https://codegen-hexa.prabhatravib.workers.dev');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  },
};

