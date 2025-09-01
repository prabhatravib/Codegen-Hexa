import React from 'react'

export const VoiceAgent: React.FC = () => {
  return (
    <div className="fixed top-4 right-4 z-50 voice-agent-container" style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 50 }}>
      <iframe
        src="https://hexa-worker.prabhatravib.workers.dev/"
        width="200"
        height="200"
        style={{
          border: 'none',
          borderRadius: '50%',
          backgroundColor: 'transparent',
          pointerEvents: 'auto'
        }}
        title="Hexa Voice Agent"
        allow="microphone"
      />
    </div>
  )
}
