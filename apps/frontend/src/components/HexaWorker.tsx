import React, { useState } from 'react'

interface DiagramData {
  mermaidCode: string
  diagramImage: string
  prompt: string
}

interface HexaWorkerProps {
  diagramData?: DiagramData | null
  codeFlowStatus: 'sent' | 'not-sent'
}

export const HexaWorker: React.FC<HexaWorkerProps> = ({ diagramData, codeFlowStatus }) => {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false) // Start with voice OFF

  const toggleVoice = () => {
    setIsVoiceEnabled(!isVoiceEnabled)
  }

  return (
    <div className="fixed top-4 right-4 z-50 hexa-worker-container" style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 50 }}>
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
          src="https://hexa-worker.prabhatravib.workers.dev/"
          width="240"
          height="240"
          style={{
            border: 'none',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            transition: 'opacity 0.3s ease',
            transform: 'scale(1)',
            transformOrigin: 'center'
          }}
          title="Hexa Voice Agent"
          allow="microphone"
          // Pass diagram data to the iframe via URL parameters or postMessage
          onLoad={() => {
            if (diagramData) {
              console.log('Voice interface has access to diagram data:', diagramData)
              // The iframe can now access the diagram data for discussions
            }
          }}
        />
      ) : (
        /* Disabled state - show placeholder with same dimensions */
        <div
          style={{
            width: '240px',
            height: '240px',
            border: 'none',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.5,
            transition: 'opacity 0.3s ease'
          }}
        >
          <div className="text-white text-sm font-medium">Voice Disabled</div>
        </div>
      )}
    </div>
  )
}
