import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useVoiceConnection } from './useVoiceConnection'

interface VoiceContextType {
  isListening: boolean
  isSpeaking: boolean
  isConnected: boolean
  isMuted: boolean
  currentMessage: string
  connectionStatus: 'disconnected' | 'connecting' | 'connected'
  startListening: () => void
  stopListening: () => void
  toggleMute: () => void
  askQuestion: (question: string) => Promise<void>
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined)

export const useVoiceInteraction = () => {
  const context = useContext(VoiceContext)
  if (!context) {
    throw new Error('useVoiceInteraction must be used within a VoiceProvider')
  }
  return context
}

interface VoiceProviderProps {
  children: React.ReactNode
}

export const VoiceProvider: React.FC<VoiceProviderProps> = ({ children }) => {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentMessage, setCurrentMessage] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')

  const {
    connect,
    isConnected,
    connectionState
  } = useVoiceConnection()

  // Update connection status based on connection state
  useEffect(() => {
    setConnectionStatus(connectionState)
  }, [connectionState])

  const startListening = useCallback(async () => {
    if (!isConnected) {
      setConnectionStatus('connecting')
      await connect()
    }
    
    try {
      // Request microphone access
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setIsListening(true)
      
      // Start audio recording and streaming
      // This would integrate with the voice connection service
      console.log('Started listening...')
    } catch (error) {
      console.error('Error starting listening:', error)
      setIsListening(false)
    }
  }, [isConnected, connect])

  const stopListening = useCallback(() => {
    setIsListening(false)
    // Stop audio recording and streaming
    console.log('Stopped listening...')
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted)
  }, [isMuted])

  const askQuestion = useCallback(async (question: string) => {
    if (!isConnected) {
      console.warn('Voice connection not established')
      return
    }

    try {
      setIsSpeaking(true)
      setCurrentMessage('Processing your question...')
      
      // Send question to voice agent via WebSocket
      // This would integrate with the voice connection service
      console.log('Asking question:', question)
      
      // Simulate response for now
      setTimeout(() => {
        setCurrentMessage('I can help explain the code! The main function handles...')
        setIsSpeaking(false)
      }, 2000)
      
    } catch (error) {
      console.error('Error asking question:', error)
      setCurrentMessage('Sorry, I encountered an error processing your question.')
      setIsSpeaking(false)
    }
  }, [isConnected])

  const value: VoiceContextType = {
    isListening,
    isSpeaking,
    isConnected,
    isMuted,
    currentMessage,
    connectionStatus,
    startListening,
    stopListening,
    toggleMute,
    askQuestion
  }

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  )
}
