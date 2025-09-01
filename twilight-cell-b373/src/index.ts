import { Container, getContainer } from "@cloudflare/containers";

export class MarimoContainer extends Container {
  defaultPort = 8080;
  sleepAfter = "2h";
}

function containerURL(req: Request, env: any): URL {
  const u = new URL(req.url);
  u.protocol = "http:";
  u.hostname = "127.0.0.1";                // match the working /api/save path
  u.port = String(Number(env.MARIMO_PORT ?? "8080"));
  console.log(`🔧 containerURL: ${u.toString()}`);
  return u;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Upgrade, Connection',
  'Access-Control-Max-Age': '86400',
};

// Helper functions
function createJsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

function createErrorResponse(error: string, status: number = 500): Response {
  return createJsonResponse({ ok: false, error }, status);
}

async function getStartedContainer(env: any) {
  const container = getContainer(env.MARIMO);
  await container.start();
  return container;
}

function addCorsHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

// Guard function to prevent proxying API endpoints
function shouldProxy(url: URL): boolean {
  if (url.pathname === '/api/generate-marimo') return false;
  if (url.pathname.startsWith('/api/')) return false;
  return true;
}

export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);
    
    console.log(`🔍 Handling request: ${request.method} ${url.pathname}`);
    
    // Debug route to check container port configuration
    if (url.pathname === '/container/port') {
      return new Response(String(env.MARIMO_PORT ?? "8080"), { headers: { "content-type": "text/plain" } });
    }
    
    // Handle CORS preflight for API endpoints
    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return new Response(null, { 
        status: 204, 
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }
    
    // ⛔ Never proxy these — handle in Worker
    if (url.pathname === '/api/generate-marimo' && request.method === 'POST') {
      console.log('🎯 Handling AI generation endpoint directly');
      try {
        const payload = await request.json() as { 
          title: string; 
          language: string; 
          mermaid?: string; 
          flow?: any 
        };
        
        if (!payload.title || !payload.language) {
          return createErrorResponse('Missing required fields: title, language', 400);
        }

        // Import the Marimo generator prompt
        console.log('📝 Importing Marimo generator prompt...');
        const { MARIMO_GENERATOR_PROMPT } = await import('../../apps/backend/src/prompts/marimoGenerator');
        console.log('✅ Prompt imported successfully');

        // Call OpenAI API
        const llm = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: env.OPENAI_MODEL_MARIMO ?? "gpt-4o-mini",
            response_format: { type: "json_object" },
            temperature: 0.2,
            messages: [
              { role: "system", content: MARIMO_GENERATOR_PROMPT },
              { role: "user", content: JSON.stringify(payload) },
            ],
          }),
        });
        
        if (!llm.ok) {
          console.error('OpenAI API error:', llm.status, llm.statusText);
          return createErrorResponse("openai", 502);
        }
        
        const data = await llm.json() as { 
          choices: Array<{ message: { content: string } }> 
        };
        const out = JSON.parse(data.choices[0].message.content || "{}");

        const filename = out.filename || `${crypto.randomUUID()}.py`;
        const content: string = out.content || "";

        // Validate Marimo content
        if (!/import\s+marimo\s+as\s+mo/.test(content) || 
            !/app\s*=\s*mo\.App\(\)/.test(content) || 
            !/(@app\.cell|@mo\.cell)/.test(content)) {
          console.error('Invalid Marimo content generated:', content.substring(0, 200));
          return createErrorResponse("invalid_marimo", 400);
        }

        // Save to container with proper contract
        const container = await getStartedContainer(env);
        const saveUrl = containerURL(new Request('http://dummy/api/save'), env);
        const saveResponse = await container.fetch(saveUrl.toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            id: filename.replace('.py', ''),
            filename: filename, 
            content 
          }),
        });
        
        if (!saveResponse.ok) {
          console.error('Container save error:', saveResponse.status, saveResponse.statusText);
          const errorText = await saveResponse.text();
          console.error('Container error details:', errorText);
          return createErrorResponse("container_save", 502);
        }

        const saveData = await saveResponse.json() as { ok: boolean; url: string; id: string; filename: string };
        
        if (!saveData.ok || !saveData.url) {
          console.error('Container returned invalid response:', saveData);
          return createErrorResponse("container_save_invalid_response", 502);
        }

        // Return the URL that the frontend can iframe
        const notebookUrl = `${url.origin}${saveData.url}`;
        return createJsonResponse({ 
          ok: true, 
          url: notebookUrl, 
          name: saveData.filename,
          id: saveData.id
        });
      } catch (error) {
        console.error('AI generation error:', error);
        return createErrorResponse(error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    // Legacy API endpoint for backward compatibility
    if (url.pathname === '/api/save') {
      try {
        const body = await request.json() as { content: string; id: string };
        const { content, id } = body;
        
        if (!content) {
          return createErrorResponse('Content is required', 400);
        }
        
        if (!content.includes('import marimo as mo') || !content.includes('app = mo.App()')) {
          return createErrorResponse('Invalid Marimo notebook content', 400);
        }
        
        const container = await getStartedContainer(env);
        const filename = `notebook_${id || Date.now()}.py`;
        
        const saveResponse = await container.fetch('http://127.0.0.1:8080/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename, content })
        });
        
        if (saveResponse.ok) {
          const saveData = await saveResponse.json() as { appPath?: string };
          return createJsonResponse({
            success: true,
            id: id,
            filename: filename,
            appPath: saveData.appPath || `/app/notebooks/${filename}`,
            message: 'Notebook saved successfully'
          });
        } else {
          throw new Error('Failed to save notebook to container');
        }
      } catch (error) {
        console.error('Error saving notebook:', error);
        return createErrorResponse('Failed to save notebook');
      }
    }
    
    // Handle WebSocket upgrade requests
    if (request.headers.get('Upgrade') === 'websocket') {
      try {
        const container = await getStartedContainer(env);
        const response = await container.fetch(request);
        
        if (response.status === 101) {
          return response; // WebSocket upgrade successful
        }
        
        return addCorsHeaders(response);
      } catch (error) {
        console.error("WebSocket error:", error);
        return new Response("WebSocket connection failed", { 
          status: 500, 
          headers: corsHeaders 
        });
      }
    }
    
    // ✅ Only proxy non-API paths to container
    if (!shouldProxy(url)) {
      console.error(`❌ Attempted to proxy API endpoint: ${url.pathname}`);
      return createErrorResponse('API endpoint not found', 404);
    }
    
    console.log(`🔄 Proxying to container: ${request.method} ${url.pathname}`);
    
    try {
      const container = await getStartedContainer(env);
      
      // Use helper to build container URL with configurable port
      const targetUrl = containerURL(request, env);
      console.log(`🎯 Target URL: ${targetUrl.toString()}`);
      
      const proxyRequest = new Request(targetUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.body
      });
      
      const port = env.MARIMO_PORT ?? "8080";
      console.log(`📡 Sending request to container on port ${port}...`);
      const response = await container.fetch(proxyRequest);
      
      if (response.status === 101) {
        return response; // WebSocket upgrade
      }
      
      if (response.status < 200 || response.status >= 600) {
        console.error("Invalid status code from container:", response.status);
        return new Response("Container returned invalid status", { 
          status: 502,
          headers: corsHeaders
        });
      }
      
      return addCorsHeaders(response);
    } catch (error) {
      console.error("Container error:", error);
      
      // Return error page for root path
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

