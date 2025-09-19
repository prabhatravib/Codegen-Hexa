import { Container, getContainer, type StopParams } from "@cloudflare/containers";
import type { DurableObject } from "cloudflare:workers";
export { NotebookStore } from './notebook_store';

export interface Env {
  // The binding name below must match wrangler.jsonc "containers[].name"
  MARIMO: DurableObjectNamespace<MarimoContainer>;
}


function createServiceWorkerScript(): string {
  return `self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());`;
}

function createServiceWorkerResponse(): Response {
  return new Response(createServiceWorkerScript(), {
    status: 200,
    headers: { "Content-Type": "application/javascript" },
  });
}

export class MarimoContainer extends Container {
  // Keep these in code as an extra guard; wrangler also sets them
  defaultPort = 8080;
  requiredPorts = [8080];
  sleepAfter = "15m";

  private latestNotebookContent: string | null = null;
  private latestNotebookId: string | null = null;
  private readinessPromise: Promise<void> | null = null;

  constructor(ctx: DurableObject["ctx"], env: Env) {
    super(ctx, env);
  }

  private async ensureContainerReady(): Promise<void> {
    if (this.readinessPromise) {
      return this.readinessPromise;
    }
    this.readinessPromise = this._ensureContainerReady();
    try {
      await this.readinessPromise;
    } finally {
      this.readinessPromise = null;
    }
  }

  private async _ensureContainerReady(): Promise<void> {
    const envVars = { ...(this.envVars ?? {}) };
    await this.start({ envVars });
    await this.startAndWaitForPorts(this.defaultPort, {
      portReadyTimeoutMS: 60000,
      waitInterval: 500,
    });
    try {
      const probe = await this.containerFetch(`http://localhost:${this.defaultPort}/`, { method: 'GET' }, this.defaultPort);
      if (!probe.ok) {
        console.warn('[MarimoContainer] readiness probe returned', probe.status);
      }
      probe.body?.cancel?.();
    } catch (probeError) {
      console.warn('[MarimoContainer] readiness probe failed:', probeError instanceof Error ? probeError.message : probeError);
    }
    await sleep(500);
  }

  private async restartContainer(): Promise<void> {
    try {
      await this.stop();
    } catch (error) {
      console.warn('[MarimoContainer] stop during restart failed:', error instanceof Error ? error.message : error);
    }
    await this.ensureContainerReady();
  }

  override onStop(params: StopParams): void | Promise<void> {
    console.log('[MarimoContainer] container stopped', params);
    return super.onStop(params);
  }

  override onError(error: unknown): any {
    console.error('[MarimoContainer] container error', error);
    return super.onError(error);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    console.log(`🔍 Container fetch called: ${request.method} ${url.pathname}`);

    // Short-circuit service worker requests to avoid unnecessary container startup
    if (url.pathname === "/public-files-sw.js") {
      return createServiceWorkerResponse();
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
        } catch (stopError) {
          console.warn('[MarimoContainer] stop before reload failed:', stopError instanceof Error ? stopError.message : stopError);
        }
        const priorEnv = this.envVars ?? {};
        this.envVars = { ...priorEnv, NOTEBOOK_CONTENT: content };
        this.latestNotebookContent = content;
        this.latestNotebookId = id;
        try {
          await this.ensureContainerReady();
        } catch (warmError) {
          console.error('[MarimoContainer] Failed to prewarm container after save:', warmError instanceof Error ? warmError.message : warmError);
        }

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
      try {
        await this.ensureContainerReady();
      } catch (ensureError) {
        console.warn('[marimo] ensureContainerReady before /marimo proxy failed:', ensureError instanceof Error ? ensureError.message : ensureError);
      }
      // Rewrite /marimo/* -> /* for the container, since Marimo serves /edit/* at root
      const internalPath = url.pathname.replace(/^\/marimo/, "");
      const target = new URL(`http://localhost:${this.defaultPort}${internalPath}${url.search}`);
      const req = new Request(target.toString(), request);
      console.log(`[marimo] Proxy request for ${internalPath || '/'} via container`);
      const proxyRequest = async () => {
        const proxied = await this.containerFetch(req, this.defaultPort);
        return widenHtmlIfNeeded(proxied);
      };
      try {
        return await proxyRequest();
      } catch (error) {
        if (!isContainerDown(error)) {
          throw error;
        }
        console.warn('[marimo] Proxy failed, restarting container...', error);
        await this.restartContainer();
        return await proxyRequest();
      }
    }

    // Default: route to Marimo on defaultPort
    try {
      await this.ensureContainerReady();
    } catch (ensureError) {
      console.warn('[marimo] ensureContainerReady before default proxy failed:', ensureError instanceof Error ? ensureError.message : ensureError);
    }
    console.log(`[marimo] Proxy request for ${url.pathname}`);
    const proxyRoot = async () => {
      const response = await this.containerFetch(request, this.defaultPort);
      return widenHtmlIfNeeded(response);
    };
    try {
      return await proxyRoot();
    } catch (error) {
      if (!isContainerDown(error)) {
        console.error('[marimo] Proxy failed with non-recoverable error:', error);
        throw error;
      }
      console.warn('[marimo] Container appears stopped, restarting...', error);
      await this.restartContainer();
      return await proxyRoot();
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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function isContainerDown(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.includes('container is not running') || message.includes('not listening');
}

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
    const url = new URL(req.url);

    if (url.pathname === "/public-files-sw.js") {
      return createServiceWorkerResponse();
    }

    // Single instance is fine; use any stable name
    const container = getContainer(env.MARIMO, "singleton");
    // Ensure the container is up and listening before proxying
    await container.startAndWaitForPorts(8080);
    // Forward the request as-is to the container (defaults to defaultPort)
    return container.fetch(req);
  },
};






