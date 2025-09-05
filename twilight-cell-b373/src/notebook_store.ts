// Lightweight Durable Object for storing notebook content by id.
// Avoids explicit type dependencies to keep build simple.
export class NotebookStore {
  state: any
  constructor(state: any) {
    this.state = state
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const method = request.method.toUpperCase()

    if (url.pathname === '/state' && method === 'POST') {
      const { id, content } = await request.json() as { id?: string; content?: string }
      if (!id || typeof content !== 'string') {
        return new Response(JSON.stringify({ ok: false, error: 'id and content required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      }
      await this.state.storage.put('content', content)
      await this.state.storage.put('id', id)
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    if (url.pathname === '/state' && method === 'GET') {
      const content = await this.state.storage.get('content') as string | undefined
      const id = await this.state.storage.get('id') as string | undefined
      if (!content) {
        return new Response(JSON.stringify({ ok: false, error: 'not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
      }
      return new Response(JSON.stringify({ ok: true, id, length: content.length, content }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    return new Response('Not Found', { status: 404 })
  }
}
