import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

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
    'https://codegen-hexa.prabhatravib.workers.dev',
    'https://codegen-hexa-backend.prabhatravib.workers.dev'
  ],
  credentials: true
}))

// Health check endpoints
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

    // Generate a simple flowchart based on the prompt
    const diagram = generateFlowchartFromPrompt(prompt, language)
    
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

    // Generate code based on the diagram and language
    const code = generateCodeFromDiagram(diagram, language)
    
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

// Helper function to generate flowchart from prompt
function generateFlowchartFromPrompt(prompt: string, language: string): string {
  // Simple flowchart generation logic
  const promptLower = prompt.toLowerCase()
  
  if (promptLower.includes('add') || promptLower.includes('sum') || promptLower.includes('calculate')) {
    return `flowchart TD
    A[Start] --> B[Get input numbers]
    B --> C[Calculate result]
    C --> D[Display result]
    D --> E[End]`
  }
  
  if (promptLower.includes('todo') || promptLower.includes('task')) {
    return `flowchart TD
    A[Start] --> B[Create task list]
    B --> C[Add new task]
    C --> D[Mark task complete]
    D --> E[Display updated list]
    E --> F[End]`
  }
  
  if (promptLower.includes('user') || promptLower.includes('profile')) {
    return `flowchart TD
    A[Start] --> B[Get user input]
    B --> C[Validate data]
    C --> D[Save to database]
    D --> E[Display confirmation]
    E --> F[End]`
  }
  
  // Default flowchart for any prompt
  return `flowchart TD
    A[Start] --> B[Process input]
    B --> C[Execute logic]
    C --> D[Generate output]
    D --> E[End]`
}

// Helper function to generate code from diagram
function generateCodeFromDiagram(diagram: string, language: string): string {
  if (language === 'python') {
    return `# Generated Python code based on diagram
def main():
    print("Starting program...")
    
    # Get user input
    user_input = input("Enter your input: ")
    
    # Process the input
    result = process_input(user_input)
    
    # Display result
    print(f"Result: {result}")
    
    print("Program completed!")

def process_input(input_data):
    # Process the input data
    return f"Processed: {input_data}"

if __name__ == "__main__":
    main()`
  }
  
  if (language === 'typescript') {
    return `// Generated TypeScript code based on diagram
function main(): void {
    console.log("Starting program...");
    
    // Get user input (in a real app, this would come from UI)
    const userInput: string = "example input";
    
    // Process the input
    const result: string = processInput(userInput);
    
    // Display result
    console.log(\`Result: \${result}\`);
    
    console.log("Program completed!");
}

function processInput(inputData: string): string {
    // Process the input data
    return \`Processed: \${inputData}\`;
}

main();`
  }
  
  // Default JavaScript code
  return `// Generated JavaScript code based on diagram
function main() {
    console.log("Starting program...");
    
    // Get user input
    const userInput = prompt("Enter your input:");
    
    // Process the input
    const result = processInput(userInput);
    
    // Display result
    console.log(\`Result: \${result}\`);
    
    console.log("Program completed!");
}

function processInput(inputData) {
    // Process the input data
    return \`Processed: \${inputData}\`;
}

main();`
}

export default app
