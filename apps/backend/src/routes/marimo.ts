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
    const marimoNotebook = await generateMarimoNotebookWithAI(prompt, diagram, language, openaiApiKey, flowGraph)
    
    // Generate a unique ID for this notebook
    const serverId = `marimo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log('Generating notebook with ID:', serverId)
    
    // Save to container and get interactive URL
    const containerResponse = await fetch('https://twilight-cell-b373.prabhatravib.workers.dev/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: marimoNotebook,
        id: serverId
      })
    })
    
    if (!containerResponse.ok) {
      throw new Error('Failed to save notebook to container')
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
