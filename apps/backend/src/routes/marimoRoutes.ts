// routes/marimoRoutes.ts
import { Hono } from 'hono'
import { marimoService } from '../services/marimoService'
import { generateMarimoNotebookWithAI } from '../services/aiService'

// Define the environment interface
interface Env {
  PYTHON_API_URL?: string
  OPENAI_API_KEY?: string
  OPENAI_REALTIME_MODEL?: string
}

const marimoRouter = new Hono<{ Bindings: Env }>()

// Generate Marimo notebook
marimoRouter.post('/generate', async (c) => {
  try {
    const body = await c.req.json()
    const { diagram, language = 'python', prompt } = body
    
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

    // Generate Marimo notebook using AI
    const marimoNotebook = await generateMarimoNotebookWithAI(prompt, diagram, language, openaiApiKey)
    
    // Generate a unique ID for this notebook
    const serverId = `marimo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log('Generating notebook with ID:', serverId)
    
    return c.json({
      success: true,
      marimoNotebook: marimoNotebook,
      serverId: serverId,
      // Pass the notebook content directly for frontend rendering
      notebookContent: marimoNotebook,
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

// Cleanup expired servers
marimoRouter.post('/cleanup', async (c) => {
  try {
    const cleanedCount = marimoService.cleanupExpiredServers()
    return c.json({
      success: true,
      message: 'Cleanup completed',
      cleanedCount: cleanedCount,
      activeServers: marimoService.getActiveServerCount()
    })
  } catch (error) {
    console.error('Error during cleanup:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to cleanup servers' 
    }, 500)
  }
})

export default marimoRouter
