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

  // Send diagram data to voice worker via API when it changes (regardless of voice state)
  const lastSentDataRef = useRef<string | null>(null)
  
  useEffect(() => {
    if (diagramData) {
      // Create a hash to prevent duplicate sends
      const dataHash = JSON.stringify({
        mermaidCode: diagramData.mermaidCode,
        prompt: diagramData.prompt
      })
      
      if (dataHash === lastSentDataRef.current) {
        console.log('⏭️ Skipping duplicate diagram data send')
        return
      }
      
      lastSentDataRef.current = dataHash
      console.log('📤 Sending diagram data to voice worker via API:', diagramData)
      
      // Send diagram data to voice worker via API call
      fetch('https://hexa-worker.prabhatravib.workers.dev/api/external-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mermaidCode: diagramData.mermaidCode,
          diagramImage: diagramData.diagramImage,
          prompt: diagramData.prompt,
          type: 'diagram'
        })
      }).then(response => {
        if (response.ok) {
          console.log('✅ Diagram data sent to voice worker successfully')
        } else {
          console.error('❌ Failed to send diagram data to voice worker:', response.status)
          // Reset hash on failure so it can be retried
          lastSentDataRef.current = null
        }
      }).catch(error => {
        console.error('❌ Error sending diagram data to voice worker:', error)
        // Reset hash on error so it can be retried
        lastSentDataRef.current = null
      })
    }
  }, [diagramData])

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
          // Handle iframe load
          onLoad={() => {
            console.log('🔄 Iframe loaded')
            if (sessionId) {
              console.log('🆔 Voice session started with session ID:', sessionId)
            }
            // Diagram data is already sent via API, no postMessage needed
            console.log('✅ Voice worker iframe loaded - diagram data should be available via API')
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
