import { useState, useCallback, useRef } from 'react'

interface VoiceConnectionState {
  isConnected: boolean
  connectionState: 'disconnected' | 'connecting' | 'connected'
  error: string | null
}

export const useVoiceConnection = () => {
  const [state, setState] = useState<VoiceConnectionState>({
    isConnected: false,
    connectionState: 'disconnected',
    error: null
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setState(prev => ({ ...prev, connectionState: 'connecting', error: null }))

    try {
      // Connect to Cloudflare Workers WebSocket endpoint
      const wsUrl = import.meta.env.VITE_WS_URL || 'wss://your-worker.your-subdomain.workers.dev/voice'
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('Voice WebSocket connected')
        setState({
          isConnected: true,
          connectionState: 'connected',
          error: null
        })
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('Voice message received:', data)
          
          // Handle different message types
          switch (data.type) {
            case 'voice_response':
              // Handle voice response from agent
              break
            case 'connection_status':
              // Handle connection status updates
              break
            case 'error':
              setState(prev => ({ ...prev, error: data.message }))
              break
            default:
              console.log('Unknown message type:', data.type)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.onclose = (event) => {
        console.log('Voice WebSocket closed:', event.code, event.reason)
        setState({
          isConnected: false,
          connectionState: 'disconnected',
          error: null
        })

        // Attempt to reconnect after a delay
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (state.connectionState === 'disconnected') {
            connect()
          }
        }, 5000)
      }

      ws.onerror = (error) => {
        console.error('Voice WebSocket error:', error)
        setState(prev => ({ 
          ...prev, 
          connectionState: 'disconnected',
          error: 'Connection failed'
        }))
      }

      wsRef.current = ws

    } catch (error) {
      console.error('Error connecting to voice service:', error)
      setState({
        isConnected: false,
        connectionState: 'disconnected',
        error: 'Failed to establish connection'
      })
    }
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setState({
      isConnected: false,
      connectionState: 'disconnected',
      error: null
    })
  }, [])

  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(audioData)
    } else {
      console.warn('WebSocket not connected, cannot send audio')
    }
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket not connected, cannot send message')
    }
  }, [])

  return {
    ...state,
    connect,
    disconnect,
    sendAudio,
    sendMessage
  }
}
