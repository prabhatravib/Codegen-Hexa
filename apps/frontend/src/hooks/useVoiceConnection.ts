import { useState, useRef, useCallback } from 'react'

// Add type declaration for Vite environment variables
declare global {
  interface ImportMetaEnv {
    readonly VITE_PUBLIC_BACKEND_URL: string
  }
}

export const useVoiceConnection = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)

  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setConnectionState('connecting')
    setError(null)

    try {
      // Use environment variable for backend URL
      const backendUrl = import.meta.env.VITE_PUBLIC_BACKEND_URL || 'ws://localhost:8787'
      const wsUrl = backendUrl.replace('https://', 'wss://').replace('http://', 'ws://') + '/voice'
      
      console.log('Connecting to WebSocket:', wsUrl)
      
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        console.log('Voice WebSocket connected')
        setIsConnected(true)
        setConnectionState('connected')
        setError(null)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('Voice message received:', data)
          
          switch (data.type) {
            case 'voice_response':
              // Handle voice response
              break
            case 'connection_status':
              // Handle connection status
              break
            case 'error':
              setError(data.message)
              break
            default:
              console.log('Unknown message type:', data.type)
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      ws.onclose = (event) => {
        console.log('Voice WebSocket closed:', event.code, event.reason)
        setIsConnected(false)
        setConnectionState('disconnected')
        
        // Clear existing timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        
        // Attempt to reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (connectionState === 'disconnected') {
            connect()
          }
        }, 5000)
      }

      ws.onerror = (event) => {
        console.error('Voice WebSocket error:', event)
        setConnectionState('disconnected')
        setError('Connection failed')
      }

      wsRef.current = ws
    } catch (err) {
      console.error('Error connecting to voice service:', err)
      setConnectionState('disconnected')
      setError('Failed to establish connection')
    }
  }, [connectionState])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setIsConnected(false)
    setConnectionState('disconnected')
    setError(null)
  }, [])

  const sendAudio = useCallback((audioData: string) => {
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
    isConnected,
    connectionState,
    error,
    connect,
    disconnect,
    sendAudio,
    sendMessage
  }
}
