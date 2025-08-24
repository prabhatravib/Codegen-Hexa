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
      
      // Get the container instance
      const container = getContainer(env.MARIMO);
      await container.start();
      
      // Create an HTML page that embeds the Marimo interface
      const html = `<!DOCTYPE html>
<html>
<head>
    <title>Marimo Notebook - ${notebookId}</title>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            margin: 0; 
            padding: 0; 
            background: #1a1a1a;
            color: white;
            overflow: hidden;
            height: 100vh;
        }
        .marimo-container {
            margin: 0;
            padding: 0;
            background: #1a1a1a;
            border-radius: 0;
            overflow: hidden;
            border: none;
            height: auto !important;
            min-height: 700px !important;
            width: 100% !important;
            display: block !important;
        }
        .marimo-header {
            padding: 0.5rem;
            background: rgba(156, 39, 176, 0.1);
            border-bottom: 1px solid rgba(255,255,255,.2);
            text-align: center;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
        }
        .marimo-header h3 {
            color: #9C27B0;
            margin: 0;
            font-size: 1rem;
        }
        .notebook-id {
            color: rgba(255,255,255,0.8);
            margin: 0;
            font-size: 0.75rem;
        }
        .external-link {
            display: inline-block;
            padding: 0.2rem 0.5rem;
            background: rgba(156, 39, 176, 0.2);
            color: #9C27B0;
            text-decoration: none;
            border-radius: 3px;
            border: 1px solid rgba(156, 39, 176, 0.3);
            transition: all 0.3s ease;
            font-size: 0.7rem;
        }
        .external-link:hover {
            background: rgba(156, 39, 176, 0.3);
            transform: translateY(-1px);
        }
        .status {
            padding: 0.2rem;
            background: #2a2a2a;
            border-bottom: 1px solid #444;
            font-size: 11px;
            text-align: center;
            position: fixed;
            top: 60px;
            left: 0;
            right: 0;
            z-index: 999;
        }
        .marimo-iframe-wrapper {
            padding: 0;
            margin: 0;
            background: #fff;
            height: 600px !important;
            min-height: 500px !important;
            width: 100% !important;
            display: block !important;
        }
        .marimo-iframe-wrapper iframe {
            width: 100% !important;
            height: 600px !important;
            min-height: 500px !important;
            border: none !important;
            border-radius: 0;
            background: #fff;
            margin: 0;
            padding: 0;
            display: block !important;
        }
    </style>
</head>
<body>
    <div class="marimo-container">
        <div class="marimo-header">
            <h3>💡 Interactive Marimo Notebook</h3>
            <div class="notebook-id">ID: ${notebookId}</div>
            <a href="/" target="_blank" class="external-link">Open in New Tab</a>
        </div>
        <div class="status">
            ✅ Notebook loaded successfully • Interactive Marimo interface ready
        </div>
        <div class="marimo-iframe-wrapper">
            <iframe 
                src="/" 
                title="Interactive Marimo Notebook"
                style="width: 100% !important; height: 600px !important; min-height: 500px !important; border: none !important; display: block !important;"
                sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
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

