import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { promptManager } from './utils/promptManager'
import marimoRouter from './routes/marimo'
import { generateFlowchartWithAI, generateCodeWithAI, generateDeepDiveWithAI } from './services/aiService'

// Define the environment interface
interface Env {
  PYTHON_API_URL?: string
  OPENAI_API_KEY?: string
  OPENAI_REALTIME_MODEL?: string
}

// Define the app with proper typing
const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173',
    'https://codegen-hexa.prabhatravib.workers.dev',
    'https://codegen-hexa-backend.prabhatravib.workers.dev'
  ],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

// Mount Marimo routes
app.route('/api/marimo', marimoRouter)

// Health check endpoints
app.get('/', (c) => {
  return c.json({ 
    message: 'CodeGen Hexa Backend API', 
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/health',
      '/api/health',
      '/voice',
      '/api/generate-diagram',
      '/api/deepdive-node',
      '/api/generate-code',
      '/api/marimo/generate'
    ]
  })
})

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// WebSocket upgrade handler for voice connections
app.get('/voice', async (c) => {
  const upgradeHeader = c.req.header('Upgrade')
  
  if (upgradeHeader !== 'websocket') {
    return c.text('Expected WebSocket upgrade', 400)
  }

  const webSocketPair = new (globalThis as any).WebSocketPair()
  const [client, server] = Object.values(webSocketPair) as [WebSocket, WebSocket]

  // Accept the WebSocket connection
  ;(server as any).accept()

  // Handle WebSocket messages directly
  server.addEventListener('message', async (event: MessageEvent) => {
    try {
      console.log('Received message:', event.data)
      
      // Parse the message
      let message: any
      if (typeof event.data === 'string') {
        message = JSON.parse(event.data)
      } else {
        message = event.data
      }

      // Handle different message types
      switch (message.type) {
        case 'voice_audio':
          // Process audio with OpenAI Realtime API
          const response = await processAudioWithOpenAI(message.audio, c.env.OPENAI_API_KEY, c.env.OPENAI_REALTIME_MODEL)
          server.send(JSON.stringify({
            type: 'voice_response',
            text: response.text,
            timestamp: Date.now()
          }))
          break
        case 'ping':
          server.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
          break
        default:
          server.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type'
          }))
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error)
      server.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }))
    }
  })

  server.addEventListener('close', () => {
    console.log('WebSocket connection closed')
  })

  server.addEventListener('error', (error: Event) => {
    console.error('WebSocket error:', error)
  })

  return new Response(null, {
    status: 101,
    webSocket: client
  } as any)
})

// Function to process audio with OpenAI Realtime API
async function processAudioWithOpenAI(_audioData: string, apiKey?: string, model?: string): Promise<{ text: string }> {
  if (!apiKey || !model) {
    throw new Error('OpenAI API key or model not configured')
  }

  try {
    // This would integrate with OpenAI Realtime API
    // For now, return a mock response
    console.log('Processing audio with OpenAI Realtime API using model:', model)
    
    return {
      text: "I heard your audio input. How can I help you with the code?"
    }
  } catch (error) {
    console.error('Error processing audio with OpenAI:', error)
    throw error
  }
}

// API endpoints for code generation (implemented directly in Cloudflare Workers)
app.post('/api/generate-diagram', async (c) => {
  try {
    const body = await c.req.json()
    const { prompt, language = 'python' } = body
    
    if (!prompt) {
      return c.json({ 
        success: false, 
        error: 'Prompt is required' 
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

    // Generate flowchart using AI instead of hardcoded logic
    const diagram = await generateFlowchartWithAI(prompt, language, openaiApiKey)
    
    return c.json({
      success: true,
      diagram: diagram,
      prompt: prompt,
      language: language
    })
  } catch (error) {
    console.error('Error generating diagram:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to generate diagram' 
    }, 500)
  }
})

app.post('/api/deepdive-node', async (c) => {
  try {
    const body = await c.req.json()
    const { node_name, question, original_prompt, flowchart } = body
    
    // Debug logging
    console.log('Deep Dive Request received:', {
      node_name,
      question,
      original_prompt,
      flowchart_length: flowchart ? flowchart.length : 0
    })
    
    if (!node_name || !question) {
      return c.json({ 
        success: false, 
        error: 'Node name and question are required' 
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

    // Generate detailed explanation using OpenAI API
    const explanation = await generateDeepDiveWithAI(node_name, question, original_prompt, flowchart, openaiApiKey)
    
    // Debug logging
    console.log('Deep Dive Response generated:', {
      success: true,
      explanation_length: explanation ? explanation.length : 0,
      node_name
    })
    
    return c.json({
      success: true,
      explanation: explanation,
      node_name: node_name
    })
  } catch (error) {
    console.error('Error generating deep dive:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to generate deep dive explanation' 
    }, 500)
  }
})



app.post('/api/generate-code', async (c) => {
  try {
    const body = await c.req.json()
    const { diagram, language = 'python' } = body
    
    if (!diagram) {
      return c.json({ 
        success: false, 
        error: 'Diagram is required' 
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

    // Generate code using AI instead of hardcoded templates
    const code = await generateCodeWithAI(diagram, language, openaiApiKey)
    
    return c.json({
      success: true,
      code: code,
      diagram: diagram,
      language: language
    })
  } catch (error) {
    console.error('Error generating code:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to generate code' 
    }, 500)
  }
})

// Catch-all route for unmatched paths
app.notFound((c) => {
  return c.json({ 
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    available_endpoints: [
      '/',
      '/health',
      '/api/health',
      '/voice',
      '/api/generate-diagram',
      '/api/deepdive-node',
      '/api/generate-code',
      '/api/marimo/generate',
      '/api/marimo/notebook/:serverId',
      '/api/marimo/viewer/:serverId',
      '/api/marimo/cleanup'
    ]
  }, 404)
})

export default app
