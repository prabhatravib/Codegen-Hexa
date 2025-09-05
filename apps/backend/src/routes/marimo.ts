// routes/marimo.ts
import { Hono } from 'hono'
import { generateMarimoNotebookWithAI } from '../services/aiService'

// Define the environment interface
interface Env {
  PYTHON_API_URL?: string
  OPENAI_API_KEY?: string
  OPENAI_REALTIME_MODEL?: string
  MARIMO_CONTAINER_URL?: string
  MARIMO_SERVICE?: Fetcher
}

const marimoRouter = new Hono<{ Bindings: Env }>()


// Generate Marimo notebook and save to container in one step
marimoRouter.post('/generate', async (c) => {
  try {
    const body = await c.req.json()
    const { diagram, language = 'python', prompt, flowGraph } = body
    
    if (!diagram || !prompt) {
      return c.json({ 
        success: false, 
        error: 'Diagram and prompt are required' 
      }, 400)
    }

    // Get OpenAI API key from environment
    const openaiApiKey = c.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return c.json({ 
        success: false, 
        error: 'OpenAI API key not configured' 
      }, 500)
    }

    // Generate Marimo notebook using AI-powered generation
    console.log('Marimo: starting generation', {
      diagram_len: typeof diagram === 'string' ? diagram.length : 0,
      language,
      has_flowGraph: !!flowGraph
    })
    const marimoNotebook = await generateMarimoNotebookWithAI(prompt, diagram, language, openaiApiKey, flowGraph)
    console.log('Marimo: generated notebook length', marimoNotebook?.length || 0)
    
    // Generate a unique ID for this notebook
    const serverId = `marimo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log('Generating notebook with ID:', serverId)
    
    // Save to container and get interactive URL (prefer service binding, fallback to HTTP)
    let containerData: { success: boolean; id: string; url: string } | null = null
    let attempts: Array<{ via: string; status?: number; statusText?: string; body?: string; url?: string }> = []

    const bodyJson = JSON.stringify({ content: marimoNotebook, id: serverId })

    // 1) Try service binding if available
    if (c.env.MARIMO_SERVICE && 'fetch' in c.env.MARIMO_SERVICE) {
      try {
        const svcUrl = 'https://service/api/save'
        const resp = await (c.env.MARIMO_SERVICE as Fetcher).fetch(svcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: bodyJson
        })
        if (resp.ok) {
          containerData = await resp.json() as any
          console.log('Saved notebook via service binding', { id: serverId })
        } else {
          const errText = await resp.text().catch(() => '')
          attempts.push({ via: 'service', status: resp.status, statusText: resp.statusText, body: errText?.slice(0, 500) })
          console.error('Marimo save via service failed', attempts[attempts.length - 1])
        }
      } catch (e) {
        attempts.push({ via: 'service', body: e instanceof Error ? e.message : String(e) })
        console.error('Marimo save via service error', attempts[attempts.length - 1])
      }
    }

    // 2) If service binding didn’t work, try HTTP endpoints
    if (!containerData) {
      const primaryBase = c.env.MARIMO_CONTAINER_URL || 'https://twilight-cell-b373.prabhatravib.workers.dev'
      const fallbacks = ['https://codegen-hexa.prabhatravib.workers.dev']
      const endpoints = [primaryBase, ...fallbacks]

      // Try a quick health check before save
      for (const base of endpoints) {
        const health = base.replace(/\/$/, '') + '/api/health'
        try {
          const h = await fetch(health, { method: 'GET' })
          const ok = h.ok
          const text = await h.text().catch(() => '')
          console.log('Health check', { base, ok })
          attempts.push({ via: 'http-health', url: health, status: h.status, statusText: h.statusText, body: text?.slice(0, 200) })
        } catch (e) {
          attempts.push({ via: 'http-health', url: health, body: e instanceof Error ? e.message : String(e) })
        }
      }

      for (const base of endpoints) {
        const url = base.replace(/\/$/, '') + '/api/save'
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: bodyJson
        })
        if (resp.ok) {
          containerData = await resp.json() as any
          console.log('Saved notebook to container', { target: base, id: serverId })
          break
        }
        const errText = await resp.text().catch(() => '')
        attempts.push({ via: 'http', url, status: resp.status, statusText: resp.statusText, body: errText?.slice(0, 500) })
        console.error('Marimo container save failed', attempts[attempts.length - 1])
      }
    }

    if (!containerData) {
      return c.json({ success: false, error: 'Failed to save notebook to container', attempts }, 502)
    }
    
    return c.json({
      success: true,
      marimoUrl: containerData.url,
      notebookId: containerData.id,
      diagram: diagram,
      language: language,
      prompt: prompt
    })
  } catch (error) {
    console.error('Error generating Marimo notebook:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to generate Marimo notebook' 
    }, 500)
  }
})


export default marimoRouter
