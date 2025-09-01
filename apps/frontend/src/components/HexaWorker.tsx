import React, { useState } from 'react'

export const HexaWorker: React.FC = () => {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)

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

      {/* Hexa Worker iframe - Much smaller to fit the entire hexagon */}
      <iframe
        src="https://hexa-worker.prabhatravib.workers.dev/"
        width="240"
        height="240"
        style={{
          border: 'none',
          borderRadius: '50%',
          backgroundColor: 'transparent',
          pointerEvents: isVoiceEnabled ? 'auto' : 'none',
          opacity: isVoiceEnabled ? 1 : 0.5,
          transition: 'opacity 0.3s ease',
          transform: 'scale(1)', // Remove scaling to show full size
          transformOrigin: 'center'
        }}
        title="Hexa Voice Agent"
        allow="microphone"
      />
      
      {/* Disabled overlay when voice is off */}
      {!isVoiceEnabled && (
        <div 
          className="absolute inset-0 rounded-full bg-black bg-opacity-30 flex items-center justify-center"
          style={{ pointerEvents: 'none' }}
        >
          <div className="text-white text-xs font-medium">Voice Disabled</div>
        </div>
      )}
    </div>
  )
}
