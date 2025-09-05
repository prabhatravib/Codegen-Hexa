// routes/marimo.ts
import { Hono } from 'hono'
import { generateMarimoNotebookWithAI } from '../services/aiService'

// Define the environment interface
interface Env {
  PYTHON_API_URL?: string
  OPENAI_API_KEY?: string
  OPENAI_REALTIME_MODEL?: string
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
    
    // Save to container and get interactive URL
    const containerUrl = 'https://twilight-cell-b373.prabhatravib.workers.dev/api/save'
    const containerResponse = await fetch(containerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: marimoNotebook,
        id: serverId
      })
    })
    
    if (!containerResponse.ok) {
      const errText = await containerResponse.text().catch(() => '')
      console.error('Marimo container save failed', {
        status: containerResponse.status,
        statusText: containerResponse.statusText,
        body: errText?.slice(0, 500)
      })
      return c.json({
        success: false,
        error: 'Failed to save notebook to container',
        details: {
          status: containerResponse.status,
          statusText: containerResponse.statusText
        }
      }, 502)
    }
    
    const containerData = await containerResponse.json() as { success: boolean; id: string; url: string }
    
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
