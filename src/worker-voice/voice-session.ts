import { DurableObject } from '@cloudflare/workers-types'

export class VoiceSession implements DurableObject {
  private sessions: Map<string, WebSocket> = new Map()
  private env: any

  constructor(private state: DurableObjectState, env: any) {
    this.env = env
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/voice-websocket') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket', { status: 400 })
      }

      const pair = new WebSocketPair()
      const [client, server] = Object.values(pair)

      // Accept the WebSocket connection
      server.accept()

      // Generate a unique session ID
      const sessionId = crypto.randomUUID()
      this.sessions.set(sessionId, server)

      // Set up WebSocket event handlers
      server.addEventListener('message', async (event) => {
        try {
          await this.handleMessage(sessionId, event.data)
        } catch (error) {
          console.error('Error handling message:', error)
          server.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process message'
          }))
        }
      })

      server.addEventListener('close', () => {
        this.sessions.delete(sessionId)
        console.log(`Session ${sessionId} closed`)
      })

      server.addEventListener('error', (error) => {
        console.error(`WebSocket error in session ${sessionId}:`, error)
        this.sessions.delete(sessionId)
      })

      // Send welcome message
      server.send(JSON.stringify({
        type: 'connection_status',
        status: 'connected',
        sessionId
      }))

      return new Response(null, {
        status: 101,
        webSocket: client
      })
    }

    return new Response('Not found', { status: 404 })
  }

  private async handleMessage(sessionId: string, data: any): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    try {
      let message
      if (typeof data === 'string') {
        message = JSON.parse(data)
      } else if (data instanceof ArrayBuffer) {
        // Handle audio data
        await this.handleAudioData(sessionId, data)
        return
      } else {
        message = data
      }

      switch (message.type) {
        case 'voice_question':
          await this.handleVoiceQuestion(sessionId, message.question)
          break
        case 'code_context':
          await this.handleCodeContext(sessionId, message.context)
          break
        case 'ping':
          session.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
          break
        default:
          console.log('Unknown message type:', message.type)
          session.send(JSON.stringify({
            type: 'error',
            message: 'Unknown message type'
          }))
      }
    } catch (error) {
      console.error('Error parsing message:', error)
      session.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }))
    }
  }

  private async handleAudioData(sessionId: string, audioData: ArrayBuffer): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    try {
      // Process audio data with OpenAI Realtime API
      const response = await this.processAudioWithOpenAI(audioData)
      
      // Send response back to client
      session.send(JSON.stringify({
        type: 'voice_response',
        text: response.text,
        audio: response.audio // Base64 encoded audio response
      }))
    } catch (error) {
      console.error('Error processing audio:', error)
      session.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process audio'
      }))
    }
  }

  private async handleVoiceQuestion(sessionId: string, question: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) return

    try {
      // Process the question with context awareness
      const response = await this.processQuestionWithContext(question)
      
      session.send(JSON.stringify({
        type: 'voice_response',
        text: response,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Error processing question:', error)
      session.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process question'
      }))
    }
  }

  private async handleCodeContext(sessionId: string, context: any): Promise<void> {
    // Store context for this session to provide better answers
    await this.state.storage.put(`context_${sessionId}`, context)
  }

  private async processAudioWithOpenAI(audioData: ArrayBuffer): Promise<{ text: string, audio: string }> {
    // This would integrate with OpenAI Realtime API
    // For now, return a mock response
    return {
      text: "I heard your audio input. How can I help you with the code?",
      audio: "" // Base64 encoded audio response
    }
  }

  private async processQuestionWithContext(question: string): Promise<string> {
    // This would use the stored context to provide better answers
    // For now, return a generic response
    return `I can help you understand the code! ${question} - Let me explain the key components...`
  }

  // Broadcast message to all connected sessions
  private broadcast(message: any): void {
    const messageStr = JSON.stringify(message)
    for (const session of this.sessions.values()) {
      try {
        session.send(messageStr)
      } catch (error) {
        console.error('Error broadcasting message:', error)
      }
    }
  }
}
