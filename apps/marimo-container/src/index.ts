interface Env {
  NOTEBOOKS: KVNamespace;
}

interface NotebookData {
  content: string;
  timestamp: number;
  language: string;
  prompt: string;
}

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

class MarimoWorker {
  private env: Env;

  constructor(env: Env) {
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight requests immediately
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    try {
      let response: Response;

      // Health check endpoint
      if (path === '/health') {
        response = new Response('OK', { status: 200 });
      }
      // Save notebook endpoint
      else if (path === '/marimo/api/save' && request.method === 'POST') {
        response = await this.handleSaveNotebook(request);
      }
      // List notebooks endpoint
      else if (path === '/marimo/api/list' && request.method === 'GET') {
        response = await this.handleListNotebooks(request);
      }
      // Serve notebook endpoint - proxy to real Marimo server
      else if (path.startsWith('/marimo/notebook/')) {
        response = await this.handleServeNotebook(request, path);
      }
      // Demo endpoint - serve a sample notebook
      else if (path === '/demo') {
        response = await this.handleDemoNotebook(request);
      }
      // Default: redirect to container server
      else {
        return Response.redirect('http://localhost:8000', 302);
      }

      // Add CORS headers to the response
      const responseWithCors = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...corsHeaders,
          // Preserve any existing headers from the original response
          'Content-Type': response.headers.get('Content-Type') || 'text/plain',
        },
      });

      return responseWithCors;

    } catch (error) {
      console.error('Error handling request:', error);
      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal Server Error',
        success: false 
      }), { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }
  }

  private async handleSaveNotebook(request: Request): Promise<Response> {
    try {
      const body = await request.json() as { content: string; language?: string; prompt?: string };
      const { content, language, prompt } = body;

      if (!content) {
        return new Response(JSON.stringify({
          error: 'Missing notebook content',
          success: false
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const notebookId = `notebook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const notebookData: NotebookData = {
        content,
        timestamp: Date.now(),
        language: language || 'python',
        prompt: prompt || ''
      };

      // Save to KV
      await this.env.NOTEBOOKS.put(notebookId, JSON.stringify(notebookData));

      return new Response(JSON.stringify({
        success: true,
        notebookId,
        message: 'Notebook saved successfully'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error saving notebook:', error);
      return new Response(JSON.stringify({
        error: 'Failed to save notebook',
        success: false
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleListNotebooks(request: Request): Promise<Response> {
    try {
      const listResult = await this.env.NOTEBOOKS.list();
      const notebooks: Array<{ id: string; timestamp: number }> = [];

      for (const key of listResult.keys) {
        const data = await this.env.NOTEBOOKS.get(key.name);
        if (data) {
          const notebookData: NotebookData = JSON.parse(data);
          notebooks.push({
            id: key.name,
            timestamp: notebookData.timestamp
          });
        }
      }

      // Sort by timestamp (newest first)
      notebooks.sort((a, b) => b.timestamp - a.timestamp);

      return new Response(JSON.stringify({
        success: true,
        notebooks
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error listing notebooks:', error);
      return new Response(JSON.stringify({
        error: 'Failed to list notebooks',
        success: false
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleServeNotebook(request: Request, path: string): Promise<Response> {
    try {
      const notebookId = path.split('/marimo/notebook/')[1];
      if (!notebookId) {
        return new Response(JSON.stringify({
          error: 'Invalid notebook ID',
          success: false
        }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const data = await this.env.NOTEBOOKS.get(notebookId);
      if (!data) {
        return new Response(JSON.stringify({
          error: 'Notebook not found',
          success: false
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const notebookData: NotebookData = JSON.parse(data);

      // Generate and serve the notebook HTML directly
      const html = this.generateNotebookHTML(notebookData.content, notebookId);
      
      return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });

    } catch (error) {
      console.error('Error serving notebook:', error);
      return new Response(JSON.stringify({
        error: 'Failed to serve notebook',
        success: false
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private async handleDemoNotebook(request: Request): Promise<Response> {
    try {
      const demoContent = `# Demo Marimo Notebook
import marimo as mo

@mo.md
def welcome():
    """Welcome to the interactive Marimo notebook!"""
    return """
    # 🚀 Welcome to Marimo!
    
    This is a **real interactive Python notebook** running in the container.
    
    You can:
    - Write and execute Python code
    - Create interactive widgets
    - Generate plots and visualizations
    - And much more!
    """

@mo.md
def interactive_example():
    """Let's try some interactive Python!"""
    return "Click the play button to run this cell!"

# This is real Python code that will execute!
print("🎉 Marimo is working!")
print("You can edit and run this code interactively!")

# You can add more cells and code here
`;

      // Save demo notebook to KV
      const notebookId = 'demo_notebook';
      const notebookData: NotebookData = {
        content: demoContent,
        timestamp: Date.now(),
        language: 'python',
        prompt: 'Demo notebook'
      };

      await this.env.NOTEBOOKS.put(notebookId, JSON.stringify(notebookData));

      // Generate and serve the demo notebook HTML directly
      const html = this.generateNotebookHTML(demoContent, notebookId);
      
      return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      });

    } catch (error) {
      console.error('Error serving demo notebook:', error);
      return new Response(JSON.stringify({
        error: 'Failed to serve demo notebook',
        success: false
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  private generateNotebookHTML(notebookContent: string, notebookId: string): string {
    // Escape the notebook content for safe embedding
    const escapedContent = notebookContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

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
            max-width: 1200px;
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
        .controls {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 1rem;
        }
        .btn {
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }
        .btn:hover {
            background: rgba(255,255,255,0.3);
            border-color: rgba(255,255,255,0.5);
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
        .status {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: #10b981;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">
                📓 Marimo Notebook Viewer
            </h1>
            <div class="controls">
                <button class="btn" onclick="downloadNotebook()">
                    💾 Download .py File
                </button>
                <button class="btn" onclick="copyToClipboard()">
                    📋 Copy Code
                </button>
            </div>
        </div>
        
        <div class="status">
            ✅ Notebook loaded successfully from Cloudflare KV storage
        </div>
        
        <div class="notebook-content">
            <div class="info-bar">
                <span>📄 Notebook ID: ${notebookId}</span>
                <span>🗄️ Stored in Cloudflare KV</span>
            </div>
            <pre class="code-block">${escapedContent}</pre>
        </div>
        
        <div class="note">
            <strong>📝 About this viewer:</strong> This is a read-only preview of your Marimo notebook stored in Cloudflare KV. 
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
            a.download = 'marimo_notebook_${notebookId}.py';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }

        function copyToClipboard() {
            const content = \`${notebookContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
            navigator.clipboard.writeText(content).then(() => {
                alert('Notebook code copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy to clipboard:', err);
                alert('Failed to copy to clipboard');
            });
        }
    </script>
</body>
</html>`;
  }
}

// Export the worker
export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => {
    const worker = new MarimoWorker(env);
    return worker.fetch(request);
  }
};


