import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { VoiceSession } from './voice-session'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://your-domain.com'],
  credentials: true
}))

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// WebSocket upgrade handler for voice connections
app.get('/voice', async (c) => {
  const upgradeHeader = c.req.header('Upgrade')
  
  if (upgradeHeader !== 'websocket') {
    return c.text('Expected WebSocket upgrade', 400)
  }

  const webSocketPair = new WebSocketPair()
  const [client, server] = Object.values(webSocketPair)

  // Get the Durable Object stub for this session
  const id = c.env.VOICE_SESSION.idFromName('default')
  const voiceSession = c.env.VOICE_SESSION.get(id)

  // Accept the WebSocket connection
  server.accept()

  // Forward the WebSocket to the Durable Object
  voiceSession.fetch('https://dummy.com', {
    method: 'POST',
    headers: { 'Upgrade': 'websocket' },
    body: server
  })

  return new Response(null, {
    status: 101,
    webSocket: client
  })
})

// API endpoints for code generation (proxy to Python backend)
app.post('/api/generate-diagram', async (c) => {
  try {
    const body = await c.req.json()
    const pythonApiUrl = c.env.PYTHON_API_URL || 'https://your-python-backend.com'
    
    const response = await fetch(`${pythonApiUrl}/codegen/generate-diagram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    return c.json(data)
  } catch (error) {
    console.error('Error proxying to Python backend:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to communicate with backend service' 
    }, 500)
  }
})

app.post('/api/generate-code', async (c) => {
  try {
    const body = await c.req.json()
    const pythonApiUrl = c.env.PYTHON_API_URL || 'https://your-python-backend.com'
    
    const response = await fetch(`${pythonApiUrl}/codegen/generate-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    return c.json(data)
  } catch (error) {
    console.error('Error proxying to Python backend:', error)
    return c.json({ 
      success: false, 
      error: 'Failed to communicate with backend service' 
    }, 500)
  }
})

// Serve static files for the React app
app.get('*', async (c) => {
  try {
    // This would serve the built React app from the dist directory
    // In production, you'd use Cloudflare Pages or serve static files differently
    return c.text('React app would be served here', 200)
  } catch (error) {
    return c.text('Not found', 404)
  }
})

export default app

// Export the Durable Object class
export { VoiceSession }
