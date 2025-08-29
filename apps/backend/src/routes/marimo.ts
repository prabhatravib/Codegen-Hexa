// routes/marimo.ts
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

// Create Marimo viewer for existing notebook content
marimoRouter.post('/create-viewer', async (c) => {
  try {
    const body = await c.req.json()
    const { notebookContent } = body
    
    if (!notebookContent) {
      return c.json({ 
        success: false, 
        error: 'Notebook content is required' 
      }, 400)
    }

    // Generate a unique ID for this notebook
    const serverId = `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    console.log('Creating interactive notebook with ID:', serverId)
    
    // Generate the interactive notebook HTML instead of just a viewer
    const interactiveHTML = marimoService.generateInteractiveNotebookHTML(notebookContent, serverId)
    
    return new Response(interactiveHTML, {
      headers: {
        'Content-Type': 'text/html'
      }
    })
  } catch (error) {
    console.error('Error creating interactive Marimo notebook:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to create interactive Marimo notebook' 
    }, 500)
  }
})

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

// Get viewer HTML for a specific notebook
marimoRouter.get('/viewer/:serverId', async (c) => {
  try {
    const serverId = c.req.param('serverId')
    
    if (!serverId) {
      return c.json({ 
        success: false, 
        error: 'Server ID is required' 
      }, 400)
    }

    // Get the notebook content from the create-viewer request
    // Since Cloudflare Workers don't persist in-memory data between requests,
    // we need to get the content from the URL or use a different approach
    const notebookContent = marimoService.getNotebookContent(serverId)
    
    if (!notebookContent) {
      // Fallback: try to get from the stored notebooks map
      // This won't work due to worker instance isolation, but let's try
      return c.json({ 
        success: false, 
        error: 'Notebook not found - this is expected due to Cloudflare Workers stateless nature' 
      }, 404)
    }

    // Generate the viewer HTML
    const viewerHTML = marimoService.generateViewerHTML(notebookContent, serverId)
    
    return new Response(viewerHTML, {
      headers: {
        'Content-Type': 'text/html'
      }
    })
  } catch (error) {
    console.error('Error getting viewer:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to get viewer' 
    }, 500)
  }
})

// Save notebook to Marimo container (using twilight-cell-b373 approach)
marimoRouter.post('/save-to-container', async (c) => {
  try {
    const body = await c.req.json()
    console.log('Received request body:', body)
    console.log('Body type:', typeof body)
    console.log('Body keys:', Object.keys(body))
    
    const { notebookContent, serverId } = body
    
    console.log('Extracted fields:', { notebookContent: !!notebookContent, serverId: !!serverId })
    console.log('Field lengths:', { 
      notebookContentLength: notebookContent ? notebookContent.length : 0, 
      serverIdLength: serverId ? serverId.length : 0 
    })
    
    if (!notebookContent || !serverId) {
      console.log('Missing fields detected:', { 
        hasNotebookContent: !!notebookContent, 
        hasServerId: !!serverId 
      })
      return c.json({ 
        success: false, 
        error: 'Missing required fields: notebookContent and serverId' 
      }, 400)
    }
    
    console.log('Saving notebook to container:', { serverId, contentLength: notebookContent.length })
    
    // Forward to your Cloudflare Container
    const response = await fetch('https://twilight-cell-b373.prabhatravib.workers.dev/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: notebookContent,
        id: serverId
      })
    })
    
    if (response.ok) {
      const data = await response.json() as { success: boolean; id: string }
      return c.json({
        success: true,
        marimoUrl: `https://twilight-cell-b373.prabhatravib.workers.dev/notebooks/${data.id}`,
        notebookId: data.id
      })
    }
    
    throw new Error('Failed to save to container')
  } catch (error) {
    console.error('Error saving notebook to container:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return c.json({ success: false, error: errorMessage }, 500)
  }
})

// Serve notebook from backend (for Marimo container to fetch)
marimoRouter.get('/notebook/:notebookId', async (c) => {
  try {
    const notebookId = c.req.param('notebookId')
    
    if (!notebookId) {
      return c.json({ 
        success: false, 
        error: 'Notebook ID is required' 
      }, 400)
    }

    const notebook = marimoService.getNotebook(notebookId)
    
    if (!notebook) {
      return c.json({ 
        success: false, 
        error: 'Notebook not found' 
      }, 404)
    }

    return c.json({
      success: true,
      notebook: {
        id: notebookId,
        content: notebook.content,
        timestamp: notebook.timestamp
      }
    })
  } catch (error) {
    console.error('Error getting notebook:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to get notebook' 
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
