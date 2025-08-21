interface Env {
  OPENAI_API_KEY: string;
  NOTEBOOKS: KVNamespace;
}

interface NotebookData {
  id: string;
  content: string;
  timestamp: number;
}

interface SaveNotebookRequest {
  content: string;
  id: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    
    try {
      let response: Response;
      
      // Save notebook endpoint
      if (url.pathname === '/marimo/api/save' && request.method === 'POST') {
        response = await handleSaveNotebook(request, env);
      }
      // Serve notebook endpoint
      else if (url.pathname.startsWith('/marimo/notebook/')) {
        const notebookId = url.pathname.split('/').pop();
        if (notebookId) {
          response = await serveNotebook(notebookId, env);
        } else {
          response = new Response('Not Found', { status: 404 });
        }
      }
      // Health check
      else if (url.pathname === '/health') {
        response = new Response('OK', { status: 200 });
      }
      // Demo notebook endpoint
      else if (url.pathname === '/demo') {
        response = await serveDemoNotebook(env);
      }
      // List notebooks
      else if (url.pathname === '/marimo/api/notebooks') {
        response = await listNotebooks(env);
      }
      // Not found
      else {
        response = new Response('Not Found', { status: 404 });
      }
      
      // Add CORS headers to all responses
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };
      
      // Clone response and add CORS headers
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          ...corsHeaders,
        },
      });
      
      return newResponse;
    } catch (error) {
      console.error('Error handling request:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
  }
};

async function handleSaveNotebook(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as SaveNotebookRequest;
    const { content, id } = body;
    
    if (!content || !id) {
      return new Response('Missing content or id', { status: 400 });
    }
    
    // Store the notebook in Cloudflare KV
    await env.NOTEBOOKS.put(id, JSON.stringify({
      id,
      content,
      timestamp: Date.now()
    }));
    
    console.log(`Saved notebook ${id} with ${content.length} characters in KV`);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Notebook saved successfully',
      notebookId: id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error saving notebook:', error);
    return new Response('Failed to save notebook', { status: 500 });
  }
}

async function serveNotebook(notebookId: string, env: Env): Promise<Response> {
  try {
    // Get notebook from Cloudflare KV
    const notebookData = await env.NOTEBOOKS.get(notebookId, 'json') as NotebookData | null;
    
    if (!notebookData) {
      return new Response('Notebook not found', { status: 404 });
    }
    
    // Create a simple HTML viewer for the notebook
    const html = generateNotebookViewer(notebookData.content, notebookId);
    
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error('Error serving notebook:', error);
    return new Response('Failed to serve notebook', { status: 500 });
  }
}

async function serveDemoNotebook(env: Env): Promise<Response> {
  try {
    // Create a demo notebook with sample Python code
    const demoContent = `# Demo Marimo Notebook

# This is a sample notebook to test the Marimo interface
print("🚀 Welcome to Marimo!")

# Basic Python operations
x = 42
y = 10
result = x + y
print(f"x + y = {result}")

# Data visualization example
import matplotlib.pyplot as plt
import numpy as np

# Generate sample data
data = np.random.randn(100)
plt.hist(data, bins=20)
plt.title("Sample Histogram")
plt.xlabel("Value")
plt.ylabel("Frequency")
plt.show()

# Interactive widgets
@mo.md
def greeting():
    return "Hello from Marimo! 🎉"

@mo.md
def calculator():
    return "This is a demo notebook showing Marimo capabilities!"
`;

    // Create HTML viewer for the demo notebook
    const html = generateNotebookViewer(demoContent, 'demo');
    
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error('Error serving demo notebook:', error);
    return new Response('Failed to serve demo notebook', { status: 500 });
  }
}

async function listNotebooks(env: Env): Promise<Response> {
  try {
    const notebookList: { id: string; timestamp: number; contentLength: number }[] = [];
    const listResult = await env.NOTEBOOKS.list();
    
    for (const key of listResult.keys) {
      const notebookData = await env.NOTEBOOKS.get(key.name, 'json') as NotebookData | null;
      if (notebookData) {
        notebookList.push({
          id: notebookData.id,
          timestamp: notebookData.timestamp,
          contentLength: notebookData.content.length
        });
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      notebooks: notebookList
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error listing notebooks:', error);
    return new Response('Failed to list notebooks', { status: 500 });
  }
}

function generateNotebookViewer(notebookContent: string, notebookId: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Marimo Notebook - ${notebookId}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f0f23;
            color: #ffffff;
            line-height: 1.6;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            padding: 2rem;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 1.5rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            text-align: center;
        }
        .title {
            font-size: 1.8rem;
            font-weight: 600;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
        }
        .notebook-content {
            background: #1a1a2e;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
        .code-block {
            background: #16213e;
            padding: 1.5rem;
            margin: 0;
            color: #e6e6e6;
            font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', 'Menlo', monospace;
            font-size: 0.9rem;
            line-height: 1.5;
            white-space: pre-wrap;
            overflow-x: auto;
        }
        .info-bar {
            background: #252545;
            padding: 1rem 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.85rem;
            color: #a0a0a0;
            border-bottom: 1px solid #333;
        }
        .download-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            transition: background 0.2s;
        }
        .download-btn:hover {
            background: #5a6fd8;
        }
        .note {
            background: rgba(102, 126, 234, 0.1);
            border: 1px solid rgba(102, 126, 234, 0.3);
            padding: 1rem;
            border-radius: 8px;
            margin-top: 1rem;
            color: #b3c7ff;
        }
        .note strong {
            color: #667eea;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">
                📓 Marimo Notebook Viewer
            </h1>
        </div>
        
        <div class="notebook-content">
            <div class="info-bar">
                <span>📄 Notebook ID: ${notebookId}</span>
                <button class="download-btn" onclick="downloadNotebook()">
                    💾 Download .py File
                </button>
            </div>
            <pre class="code-block">${notebookContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </div>
        
        <div class="note">
            <strong>📝 About this viewer:</strong> This is a read-only preview of your Marimo notebook. 
            To run it interactively, download the .py file and open it in a local Marimo environment with 
            <code>marimo edit notebook_${notebookId}.py</code>
        </div>
    </div>

    <script>
        function downloadNotebook() {
            const content = \`${notebookContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'notebook_${notebookId}.py';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    </script>
</body>
</html>`;
}


