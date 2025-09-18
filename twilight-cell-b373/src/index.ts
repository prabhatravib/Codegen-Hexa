import { Container, getContainer } from "@cloudflare/containers";
import type { DurableObject } from "cloudflare:workers";
export { NotebookStore } from './notebook_store';

export interface Env {
  // The binding name below must match wrangler.jsonc "containers[].name"
  MARIMO: DurableObjectNamespace<MarimoContainer>;
}

export class MarimoContainer extends Container {
  // Keep these in code as an extra guard; wrangler also sets them
  defaultPort = 8080;
  requiredPorts = [8080];
  sleepAfter = "15m";

  constructor(ctx: DurableObject["ctx"], env: Env) {
    super(ctx, env);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    console.log(`🔍 Container fetch called: ${request.method} ${url.pathname}`);

    // Short-circuit service worker requests to avoid unnecessary container startup
    if (url.pathname === "/public-files-sw.js") {
      const body = `self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());`;
      return new Response(body, {
        status: 200,
        headers: { "Content-Type": "application/javascript" },
      });
    }

    // Handle minimal API inside the DO
    if (url.pathname === "/api/health" && request.method === "GET") {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/api/save" && request.method === "POST") {
      try {
        const body = await request.json() as { id?: string; filename?: string; content?: string };
        const id = body.id || crypto.randomUUID();
        const filename = body.filename || `${id}.py`;
        const content = body.content ?? "";

        if (!content || content.length === 0) {
          return new Response(JSON.stringify({ ok: false, error: "missing_content" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Restart container with the notebook content to ensure updates take effect
        try {
          await this.stop();
        } catch (_) {
          // ignore stop errors (container may not be running)
        }
        await this.start({ envVars: { NOTEBOOK_CONTENT: content } });
        await this.startAndWaitForPorts(this.defaultPort);

        // Return the Worker root; it reliably serves the Marimo UI
        const urlPath = "/";
        return new Response(JSON.stringify({ ok: true, url: urlPath, id, filename }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Marimo UI on defaultPort (proxy everything under /marimo/*)
    if (url.pathname.startsWith("/marimo/")) {
      // Rewrite /marimo/* -> /* for the container, since Marimo serves /edit/* at root
      const internalPath = url.pathname.replace(/^\/marimo/, "");
      const target = new URL(`http://localhost:${this.defaultPort}${internalPath}${url.search}`);
      const req = new Request(target.toString(), request);
      console.log(`🌐 Routing to Marimo (rewritten): ${internalPath || "/"}`);
      try {
        // Ensure container is started and ready
        await this.start();
        await this.startAndWaitForPorts(this.defaultPort);
        const resp = await this.containerFetch(req, this.defaultPort);
        return await widenHtmlIfNeeded(resp);
      } catch (e) {
        console.warn('Proxy to Marimo failed, retrying after ensuring readiness...', e);
        await this.stop();
        await this.start();
        await this.startAndWaitForPorts(this.defaultPort);
        const resp2 = await this.containerFetch(req, this.defaultPort);
        return await widenHtmlIfNeeded(resp2);
      }
    }

    // Default: route to Marimo on defaultPort
    console.log(`🌐 Default routing to Marimo on port ${this.defaultPort}: ${url.pathname}`);
    try {
      // Ensure container is started and ready
      console.log('🚀 Starting container...');
      await this.start();
      console.log('⏳ Waiting for ports to be ready...');
      await this.startAndWaitForPorts(this.defaultPort);
      console.log('✅ Container is ready, proxying request...');
      
      const resp = await this.containerFetch(request, this.defaultPort);
      return await widenHtmlIfNeeded(resp);
    } catch (e) {
      console.error('❌ Default route proxy failed:', e);
      console.log('🔄 Retrying after ensuring readiness...');
      
      try {
        // Force restart the container
        await this.stop();
        await this.start();
        await this.startAndWaitForPorts(this.defaultPort);
        
        const resp2 = await this.containerFetch(request, this.defaultPort);
        return await widenHtmlIfNeeded(resp2);
      } catch (e2) {
        console.error('❌ Retry also failed:', e2);
        throw e2;
      }
    }
  }
}




// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Upgrade, Connection, X-Requested-With',
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

// Removed getStartedContainer - now using Durable Object directly

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
  // Only block Worker-handled endpoints; proxy everything else to the container
  if (url.pathname === '/api/generate-marimo') return false;
  return true;
}

// Inject CSS to widen Marimo UI
async function widenHtmlIfNeeded(response: Response): Promise<Response> {
  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('text/html')) {
    return response;
  }
  let html = await response.text();
  // Leave Marimo config widths untouched; CSS below widens layout.
  const css = `
    html, body, #root { width: 100% !important; }
    /* Expand content width variables used by Marimo's CSS */
    :root, #root, #App, .mo-app, .mo-root {
      --content-width: 100vw !important;
      --content-width-medium: 100vw !important;
    }
    main, .mo-app, .mo-root, .mo-container, [class*="container"], [class*="content"], [class*="root"], [class*="app"] {
      max-width: 100% !important; width: 100% !important;
    }
    .cm-editor, .cell, .mo-cell, .mo-output, pre, code {
      max-width: 100% !important; width: 100% !important;
    }
    [style*="max-width"], [class*="center"] { max-width: 100% !important; }
  `;
  const injected = html.includes('</head>')
    ? html.replace('</head>', `<style>${css}</style></head>`)
    : `<style>${css}</style>` + html;
  const newHeaders = new Headers(response.headers);
  return new Response(injected, { status: response.status, statusText: response.statusText, headers: newHeaders });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // Single instance is fine; use any stable name
    const container = getContainer(env.MARIMO, "singleton");
    // Ensure the container is up and listening before proxying
    await container.startAndWaitForPorts(8080);
    // Forward the request as-is to the container (defaults to defaultPort)
    return container.fetch(req);
  },
};


