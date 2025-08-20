import React from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff, Volume2 } from 'lucide-react'
import { useVoiceInteraction } from '../hooks/useVoiceInteraction'

export const VoiceAgent: React.FC = () => {
  const {
    isListening,
    isSpeaking,
    isConnected,
    startListening,
    stopListening
  } = useVoiceInteraction()

  // Get voice status icon for the center of the hexagon
  const getVoiceStatusIcon = () => {
    const iconStyle = { 
      width: '12px', 
      height: '12px', 
      minWidth: '12px', 
      minHeight: '12px', 
      maxWidth: '12px', 
      maxHeight: '12px',
      strokeWidth: 1
    }
    
    if (!isConnected) {
      return <MicOff style={iconStyle} />
    }
    
    if (isListening) {
      return <Mic style={iconStyle} className="animate-pulse" />
    }
    
    if (isSpeaking) {
      return <Volume2 style={iconStyle} className="animate-pulse" />
    }
    
    return <Mic style={iconStyle} />
  }

  // Get voice status color
  const getVoiceStatusColor = () => {
    if (!isConnected) return 'text-gray-400'
    if (isListening) return 'text-green-500'
    if (isSpeaking) return 'text-blue-500'
    return 'text-green-400'
  }

  // Handle voice toggle
  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 voice-agent-container" style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 50 }}>
      <motion.div
        className="relative"
        animate={{
          scale: isListening ? 1.1 : 1,
          rotate: isListening ? [0, -2, 2, 0] : 0
        }}
        transition={{
          duration: 0.5,
          repeat: isListening ? Infinity : 0
        }}
      >
        {/* Small hexagon container */}
        <div className="relative w-18 h-18 cursor-pointer voice-agent-hexagon" style={{ width: '72px', height: '72px', maxWidth: '72px', maxHeight: '72px' }} onClick={handleVoiceToggle}>
          <svg 
            width="72px" 
            height="72px" 
            viewBox="0 0 72 72" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: '72px', height: '72px', maxWidth: '72px', maxHeight: '72px' }}
          >
            <defs>
              <linearGradient id="hexagonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a7f3d0" />
                <stop offset="30%" stopColor="#6ee7b7" />
                <stop offset="70%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Main hexagon */}
            <motion.polygon 
              points="36,6 66,25.5 66,46.5 36,66 6,46.5 6,25.5" 
              fill="url(#hexagonGradient)" 
              stroke={isListening ? '#10b981' : '#059669'}
              strokeWidth={isListening ? '4.5' : '3'}
              filter="url(#glow)"
              animate={{
                scale: isListening ? [1, 1.02, 1] : 1,
                opacity: isListening ? [0.8, 1, 0.8] : 1
              }}
              transition={{
                duration: 2,
                repeat: isListening ? Infinity : 0,
                ease: "easeInOut"
              }}
            />
          </svg>

          {/* Voice status indicator in the center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`${getVoiceStatusColor()} ${isListening || isSpeaking ? 'animate-pulse' : ''}`}>
              {getVoiceStatusIcon()}
            </div>
          </div>

          {/* Connection status indicator */}
          {!isConnected && (
            <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>

        {/* Voice active pulse ring around the hexagon */}
        {(isListening || isSpeaking) && (
          <motion.div
            className="absolute inset-0 border border-green-500 rounded-full"
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{
              scale: [1, 1.2, 1.2],
              opacity: [0.7, 0, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity
            }}
          />
        )}
      </motion.div>
    </div>
  )
}
