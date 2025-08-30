import { Container } from "@cloudflare/containers";

export class MarimoContainer extends Container {
  defaultPort = 8080;   // container's HTTP port
  sleepAfter = "60s";
}

export class MarimoContainerV2 extends Container {
  defaultPort = 8080;   // container's HTTP port
  sleepAfter = "60s";
}

type Env = {
  NOTEBOOKS: KVNamespace;
  MARIMO: DurableObjectNamespace;
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));
    const url = new URL(request.url);
    const { pathname } = url;

    try {
      // Create or update notebook in KV via POST body
      if (pathname === "/api/save" && request.method === "POST") {
        const { content, id } = await request.json() as { content: string; id: string };
        if (!content || typeof content !== "string") return cors(json({ error: "content required" }, 400));
        const nbId = id ?? crypto.randomUUID();
          await env.NOTEBOOKS.put(nbId, content, { metadata: { bytes: new TextEncoder().encode(content).byteLength } });
  return cors(json({ success: true, id: nbId }, 201));
      }

      // Read notebook from KV
      if (pathname.startsWith("/api/notebooks/") && request.method === "GET") {
        const nbId = pathname.split("/").pop()!;
        const content = await env.NOTEBOOKS.get(nbId);
        if (content === null) return cors(json({ error: "not found" }, 404));
        return cors(new Response(content, { headers: { "content-type": "text/plain" } }));
      }

      // Create notebook inside the container from KV content
      if (pathname.startsWith("/container/create/") && request.method === "POST") {
        const nbId = pathname.split("/").pop()!;
        const content = await env.NOTEBOOKS.get(nbId);
        if (content === null) return cors(json({ error: "not found" }, 404));

        const stub = env.MARIMO.get(env.MARIMO.newUniqueId());
        // optional warm start
        // await stub.start();

        const body = JSON.stringify({ id: nbId, content });
        const containerReq = new Request("http://container/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body
        });
        
        const resp = await stub.fetch(containerReq);
        
        // If we get a 401, log more details
        if (resp.status === 401) {
          console.error("Container returned 401:", await resp.text());
        }
        
        return cors(resp);
      }

      // Handle notebook display - create in container from KV
      if (pathname.startsWith('/notebooks/')) {
        const notebookId = pathname.replace('/notebooks/', '').split('?')[0];
        
        try {
      // Get the notebook content from KV
      const notebookContent = await env.NOTEBOOKS.get(notebookId);
      
      if (notebookContent) {
            // Get or create a container instance
            const containerId = env.MARIMO.idFromName(notebookId);
            const container = env.MARIMO.get(containerId);
            
            // First, create the notebook in the container
            const createRequest = new Request("http://container/create", {
              method: "POST",
          headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ 
                id: notebookId, 
                content: notebookContent 
              })
            });
            
            // Send create request and wait for Marimo to start
            await container.fetch(createRequest);
            
            // Now proxy the actual request to Marimo interface
            const marimoRequest = new Request("http://container/", {
              method: "GET",
              headers: request.headers
            });
            
            return container.fetch(marimoRequest);
      } else {
        return new Response('Notebook not found', { 
          status: 404,
          headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
              }
            });
          }
        } catch (error) {
          console.error('Error loading notebook:', error);
          return new Response('Error loading notebook', { 
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
          }
        });
      }
    }
    
      // Debug 1: echo Worker inbound headers and body size
      if (pathname === "/debug/worker-echo" && request.method === "POST") {
        const headers = [...request.headers.entries()];
        const buf = await request.arrayBuffer();
        return cors(json({ workerReceivedHeaders: headers, workerBodyBytes: buf.byteLength }));
      }

      // Debug 2: forward a test payload to container echo
      if (pathname.startsWith("/debug/forward/") && request.method === "POST") {
        const nbId = pathname.split("/").pop()!;
        const payload = await request.text();
        const workerHeaders = [...request.headers.entries()];
        const workerBodyBytes = new TextEncoder().encode(payload).byteLength;

        const stub = env.MARIMO.get(env.MARIMO.newUniqueId());
        const containerReq = new Request("http://container/debug/echo", {
          method: "POST",
          headers: { "content-type": "application/json", "x-test": "ok" },
          body: JSON.stringify({ test: "ping", echoed: payload })
        });
        const containerResp = await stub.fetch(containerReq);
        const containerJson = await containerResp.json();

        return cors(json({ worker: { headers: workerHeaders, bodyBytes: workerBodyBytes }, container: containerJson }));
      }

      return cors(json({ error: "route not found" }, 404));
    } catch (err) {
      return cors(json({ error: String(err) }, 500));
    }
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

function cors(resp: Response) {
  const h = new Headers(resp.headers);
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  return new Response(resp.body, { headers: h, status: resp.status });
}

