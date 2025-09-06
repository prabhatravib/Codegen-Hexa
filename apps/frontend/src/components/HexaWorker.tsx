import React, { useState, useEffect, useRef } from 'react'
import { sessionManager } from '../utils/sessionManager'
import { DiagramData } from '../services/diagramCapture'

interface HexaWorkerProps {
  codeFlowStatus: 'sent' | 'not-sent'
  diagramData: DiagramData | null
}

export const HexaWorker: React.FC<HexaWorkerProps> = ({ codeFlowStatus, diagramData }) => {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false) // Start with voice OFF
  const [sessionId, setSessionId] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Subscribe to session changes
  useEffect(() => {
    const unsubscribe = sessionManager.onSessionChange((newSessionId) => {
      setSessionId(newSessionId)
      console.log('🆔 HexaWorker received session ID:', newSessionId)
    })

    // Get current session ID if it exists
    const currentSessionId = sessionManager.getSessionId()
    if (currentSessionId) {
      setSessionId(currentSessionId)
    }

    return unsubscribe
  }, [])

  // Send diagram data to iframe when it changes
  useEffect(() => {
    if (diagramData && iframeRef.current && isVoiceEnabled) {
      console.log('📤 Sending diagram data to HexaWorker iframe:', diagramData)
      
      // Send diagram data to the iframe via postMessage
      iframeRef.current.contentWindow?.postMessage({
        type: 'diagram_data',
        data: diagramData
      }, 'https://hexa-worker.prabhatravib.workers.dev')
    }
  }, [diagramData, isVoiceEnabled])

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled)
    
    // Generate session ID when voice is first enabled
    if (!isVoiceEnabled && !sessionId) {
      const newSessionId = sessionManager.generateSessionId()
      console.log('🆔 Generated session ID for voice session:', newSessionId)
    }
  }

  return (
    <div className="fixed top-4 left-4 z-50 hexa-worker-container" style={{ position: 'fixed', top: '16px', left: '16px', zIndex: 50 }}>
      {/* Voice Toggle Switch */}
      <div className="flex items-center space-x-3 mb-3">
        <div className="flex items-center">
          <span className="text-white text-sm mr-2">Voice</span>
          
          {/* Toggle Switch - matches the design from the second image */}
          <button
            onClick={toggleVoice}
            className="relative inline-flex items-center focus:outline-none"
            style={{ width: '44px', height: '24px' }}
          >
            {/* Toggle Background */}
            <div
              className={`w-11 h-6 rounded-full transition-all duration-200 ease-in-out ${
                isVoiceEnabled 
                  ? 'bg-black' // Solid black when ON
                  : 'bg-transparent border-2 border-black' // Outline when OFF
              }`}
            />
            
            {/* Toggle Handle */}
            <div
              className={`absolute top-1 w-4 h-4 rounded-full transition-all duration-200 ease-in-out ${
                isVoiceEnabled 
                  ? 'bg-white right-1' // White circle on right when ON
                  : 'bg-black left-1' // Black circle on left when OFF
              }`}
            />
          </button>
          
          <span className="text-white text-sm ml-2">{isVoiceEnabled ? 'ON' : 'OFF'}</span>
        </div>
      </div>

      {/* Code Flow Status Indicator */}
      <div className="mb-3">
        <div 
          className={`text-sm font-medium ${
            codeFlowStatus === 'sent' ? 'text-yellow-400' : 'text-white'
          }`}
        >
          {codeFlowStatus === 'sent' ? 'Code Flow Sent' : 'No Code Flow Sent'}
        </div>
      </div>

      {/* Hexa Worker iframe - Only render when voice is enabled */}
      {isVoiceEnabled ? (
        <iframe
          ref={iframeRef}
          src={`https://hexa-worker.prabhatravib.workers.dev/${sessionId ? `?sessionId=${sessionId}` : ''}`}
          width="340"
          height="340"
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            transition: 'opacity 0.3s ease',
            transform: 'scale(1)',
            transformOrigin: 'center',
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          }}
          title="Hexa Voice Agent"
          allow="microphone"
          // Send diagram data to iframe when it loads
          onLoad={() => {
            console.log('🔄 Iframe loaded')
            if (sessionId) {
              console.log('🆔 Voice session started with session ID:', sessionId)
            }
            // Send diagram data immediately if available
            if (diagramData) {
              console.log('📤 Sending diagram data on iframe load:', diagramData)
              iframeRef.current?.contentWindow?.postMessage({
                type: 'diagram_data',
                data: diagramData
              }, 'https://hexa-worker.prabhatravib.workers.dev')
            }
          }}
        />
      ) : (
        /* Disabled state - show placeholder with same dimensions */
        <div
          style={{
            width: '340px',
            height: '340px',
            border: 'none',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.5,
            transition: 'opacity 0.3s ease',
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
          }}
        >
          <div className="text-white text-sm font-medium">Voice Disabled</div>
        </div>
      )}
    </div>
  )
}
