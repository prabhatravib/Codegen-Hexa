import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    try {
      const evt = { request, env, waitUntil: () => {} }
      return await getAssetFromKV(evt)
    } catch (e) {
      // Fallback to index.html for SPA routing
      try {
        const fallbackRequest = new Request(new URL('/index.html', request.url))
        const fallbackEvt = { request: fallbackRequest, env, waitUntil: () => {} }
        const indexResponse = await getAssetFromKV(fallbackEvt)
        return indexResponse
      } catch (e2) {
        return new Response('Not Found', { status: 404 })
      }
    }
  }
}
