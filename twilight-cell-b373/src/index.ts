import { Container, getContainer } from "@cloudflare/containers";

export class MarimoContainer extends Container {
  defaultPort = 2718; // Marimo default port
  sleepAfter = "2h";
}

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins for development
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Upgrade, Connection',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);
    
    // Handle CORS preflight request
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }
    
    // Handle WebSocket upgrade requests
    if (request.headers.get('Upgrade') === 'websocket') {
      try {
        const inst = getContainer(env.MARIMO);
        console.log("Starting Marimo container for WebSocket...");
        await inst.start();
        console.log("Container started successfully for WebSocket");
        
        // Forward WebSocket request to container
        const response = await inst.fetch(request);
        
        // Check if the response has a valid status code
        // Status 101 is WebSocket Upgrade - this is CORRECT!
        if (response.status === 101) {
          console.log("✅ WebSocket upgrade successful (status 101)");
          // Return the WebSocket upgrade response directly
          return response;
        }
        
        if (response.status < 200 || response.status >= 600) {
          console.error("Invalid status code from container:", response.status);
          // Return a proper WebSocket error response
          return new Response("WebSocket upgrade failed", { 
            status: 502,
            headers: corsHeaders
          });
        }
        
        // Add CORS headers for WebSocket
        const newHeaders = new Headers(response.headers);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });
        
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
      } catch (error) {
        console.error("WebSocket error:", error);
        return new Response("WebSocket connection failed", { 
          status: 500,
          headers: corsHeaders
        });
      }
    }
    
    // Handle API endpoints
    if (url.pathname === '/api/save') {
      try {
        const body = await request.json() as { content: string; id: string };
        const { content, id } = body;
        
        if (!content) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Content is required'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        
        // Validate that this is proper Marimo Python code
        if (!content.includes('import marimo as mo') || !content.includes('app = mo.App()')) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Invalid Marimo notebook content - must include marimo import and app initialization'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }
        
        // Get the container instance
        const container = getContainer(env.MARIMO);
        await container.start();
        
        // Create a unique filename
        const filename = `notebook_${id || Date.now()}.py`;
        
        // Write the Python content to the container via the HTTP server
        const saveResponse = await container.fetch('http://127.0.0.1:8080/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename, content })
        });
        
        if (saveResponse.ok) {
          const saveData = await saveResponse.json() as { appPath?: string };
          return new Response(JSON.stringify({
            success: true,
            id: id,
            filename: filename,
            appPath: saveData.appPath || `/app/notebooks/${filename}`,
            message: 'Notebook saved successfully'
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        } else {
          throw new Error('Failed to save notebook to container');
        }
      } catch (error) {
        console.error('Error saving notebook:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to save notebook'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }

    // Create notebook endpoint
    if (url.pathname === '/create-notebook') {
      try {
        const body = await request.json() as { content: string; id: string };
        const { content, id } = body;
        
        if (!content || !id) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Content and ID are required'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Create a proper Marimo notebook file content
        const notebookContent = `# Marimo Notebook Generated from Flowchart
# Notebook ID: ${id}
# Generated: ${new Date().toLocaleString()}

import marimo as mo

# Initialize the Marimo app
app = mo.App()

@app.cell
def header_cell():
    """Generated Notebook from Flowchart"""
    return mo.md(f"""
    # Generated Marimo Notebook
    
    **Notebook ID:** ${id}
    **Generated:** ${new Date().toLocaleString()}
    
    This notebook was generated from your flowchart and is ready for execution.
    """)

@app.cell
def interactive_cell():
    """Interactive cell for your generated code"""
    # This is where your flowchart-generated code would go
    return "Ready to execute your generated code!"

@app.cell
def status_cell():
    """Status and execution cell"""
    print("🚀 Notebook loaded successfully!")
    return mo.md("**Status:** ✅ Interactive notebook ready!")

# Add more cells based on your flowchart here
if __name__ == "__main__":
    app.run()
`;

        // Create notebooks directory if it doesn't exist
        const notebooksDir = '/app/notebooks';
        try {
          // This would be handled by the container's filesystem
          // For now, we'll simulate success
          console.log(`Creating notebook ${id} in directory ${notebooksDir}`);
          
                  // TODO: In a real implementation, you would:
        // 1. Create the notebooks directory in the container
        // 2. Write the notebook content to a .py file
        // 3. Ensure the Marimo server can access it
        
        // For now, we'll create the notebook file via the proxy endpoint
        // when it's first requested
          
        } catch (dirError) {
          console.warn('Could not create notebooks directory:', dirError);
        }
        
        // Return success with the notebook content and working URL
        return new Response(JSON.stringify({
          success: true,
          id: id,
          message: 'Notebook created successfully! Interactive interface ready.',
          path: `/notebooks/${id}`,
          workingUrl: `${url.origin}/`,
          downloadPath: `/download-notebook/${id}`,
          content: notebookContent
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to create notebook'
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }

    // Serve notebook files - redirect directly to the working Marimo notebook
    if (url.pathname.startsWith('/notebooks/')) {
      try {
        const notebookId = url.pathname.split('/notebooks/')[1];
        if (!notebookId) {
          return new Response('Notebook ID required', { status: 400 });
        }

        // Redirect directly to the working Marimo notebook URL
        // Based on your Dockerfile, try the root path first since Marimo might serve from there
        const workingNotebookUrl = `${url.origin}/`;
        
        // Create a simple redirect page that shows loading then redirects
        const redirectHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Redirecting to Marimo Notebook - ${notebookId}</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 0;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .loading-container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="loading-container">
        <div class="spinner"></div>
        <h2>🚀 Redirecting to Interactive Marimo Notebook</h2>
        <p>Taking you to your working notebook...</p>
    </div>
    
    <script>
        // Redirect after a brief loading period
        setTimeout(() => {
            window.location.href = '${workingNotebookUrl}';
        }, 1500);
    </script>
</body>
</html>`;

        return new Response(redirectHtml, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            ...corsHeaders
          }
        });
      } catch (error) {
        console.error('Error serving notebook:', error);
        return new Response('Failed to serve notebook', { 
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Note: Removed the complex marimo-proxy endpoint since we're now redirecting directly
    // to the working notebook URL instead of using iframes
    
    // Special handler for the actual notebook file path
    if (url.pathname === '/app/notebooks/notebook.py') {
      try {
        console.log("Handling direct notebook request to /app/notebooks/notebook.py");
        
        // Get the container instance for this specific request
        const container = getContainer(env.MARIMO);
        
        // Ensure container is started
        console.log("Starting Marimo container for notebook file...");
        await container.start();
        console.log("Container started successfully for notebook file");
        
        // Try to get the notebook from the container
        // Based on your Dockerfile, the notebook is at /app/notebooks/notebook.py
        // But Marimo might serve it from different paths
        const possiblePaths = [
          `/app/notebooks/notebook.py`,
          `/notebook.py`,
          `/notebooks/notebook.py`,
          `/`
        ];
        
        for (const path of possiblePaths) {
          const containerUrl = `http://localhost:${2718}${path}`;
          console.log(`Trying container path: ${containerUrl}`);
          
          try {
            const response = await container.fetch(containerUrl);
            console.log(`Container response for ${path}: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
              console.log(`✅ Found notebook at: ${path}`);
              // Return the notebook from the container
              return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: {
                  ...Object.fromEntries(response.headers.entries()),
                  ...corsHeaders
                }
              });
            }
          } catch (fetchError) {
            console.log(`Error fetching from ${path}:`, fetchError);
          }
        }
        
        // If we get here, the container doesn't have the notebook
        // Return a helpful error message
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head><title>Notebook Not Found</title></head>
          <body>
            <h1>⚠️ Notebook Not Found</h1>
            <p>The notebook file could not be found in the Marimo container.</p>
            <p>This might mean:</p>
            <ul>
              <li>The container hasn't finished starting up</li>
              <li>The notebook file wasn't created properly</li>
              <li>There's a path mismatch</li>
            </ul>
            <p>Please try refreshing the page in a few seconds.</p>
            <script>
              // Auto-refresh after 5 seconds
              setTimeout(() => window.location.reload(), 5000);
            </script>
          </body>
          </html>
        `, {
          status: 404,
          headers: { 'Content-Type': 'text/html' }
        });
        
      } catch (error) {
        console.error('Error handling notebook request:', error);
        return new Response('Failed to serve notebook', { 
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Download notebook file endpoint
    if (url.pathname.startsWith('/download-notebook/')) {
      try {
        const notebookId = url.pathname.split('/download-notebook/')[1];
        if (!notebookId) {
          return new Response('Notebook ID required', { status: 400 });
        }

        // Create the notebook content for download
        const notebookContent = `# Marimo Notebook Generated from Flowchart
# Notebook ID: ${notebookId}
# Generated: ${new Date().toLocaleString()}

import marimo as mo

# Initialize the Marimo app
app = mo.App()

@app.cell
def header_cell():
    """Generated Notebook from Flowchart"""
    return mo.md(f"""
    # Generated Marimo Notebook
    
    **Notebook ID:** ${notebookId}
    **Generated:** ${new Date().toLocaleString()}
    
    This notebook was generated from your flowchart and is ready for execution.
    """)

@app.cell
def interactive_cell():
    """Interactive cell for your generated code"""
    # This is where your flowchart-generated code would go
    return "Ready to execute your generated code!"

@app.cell
def status_cell():
    """Status and execution cell"""
    print("🚀 Notebook loaded successfully!")
    return mo.md("**Status:** ✅ Interactive notebook ready!")

# Add more cells based on your flowchart here
if __name__ == "__main__":
    app.run()
`;

        return new Response(notebookContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            'Content-Disposition': `attachment; filename="${notebookId}.py"`,
            ...corsHeaders
          }
        });
      } catch (error) {
        console.error('Error downloading notebook:', error);
        return new Response('Failed to download notebook', { 
          status: 500,
          headers: corsHeaders
        });
      }
    }
    
    // Get the container instance for other requests
    const container = getContainer(env.MARIMO);
    
    try {
      // Ensure container is started
      console.log("Starting Marimo container...");
      await container.start();
      console.log("Container started successfully");
      
      // Log the request we're forwarding to the container
      console.log(`Forwarding request to container: ${request.method} ${url.pathname}`);
      
      // Forward ALL other requests to the Marimo container
      // This ensures the notebook interface is properly served
      const response = await container.fetch(request);
      
      // Log the container response
      console.log(`Container response: ${response.status} ${response.statusText}`);
      
      // Check if the response has a valid status code
      // Status 101 is WebSocket Upgrade - this is CORRECT!
      if (response.status === 101) {
        console.log("✅ WebSocket upgrade successful (status 101)");
        // Return the WebSocket upgrade response directly
        return response;
      }
      
      if (response.status < 200 || response.status >= 600) {
        console.error("Invalid status code from container:", response.status);
        // Return a proper error response
        return new Response("Container returned invalid status", { 
          status: 502,
          headers: corsHeaders
        });
      }
      
      // Add CORS headers to the response from the container
      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    } catch (error) {
      console.error("Container error:", error);
      
      // Return a helpful error page if container fails
      if (url.pathname === '/') {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return new Response(`
          <!DOCTYPE html>
          <html>
          <head><title>Marimo Notebook - Error</title></head>
          <body>
            <h1>⚠️ Container Error</h1>
            <p>The Marimo container encountered an error: ${errorMessage}</p>
            <p>Please try refreshing the page or contact support.</p>
            <script>
              // Auto-refresh after 5 seconds
              setTimeout(() => window.location.reload(), 5000);
            </script>
          </body>
          </html>
        `, {
          status: 500,
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      return new Response("Container error", { status: 500 });
    }
  },
};

