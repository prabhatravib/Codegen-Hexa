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
    if (!isConnected) {
      return <MicOff className="w-3 h-3" />
    }
    
    if (isListening) {
      return <Mic className="w-3 h-3 animate-pulse" />
    }
    
    if (isSpeaking) {
      return <Volume2 className="w-3 h-3 animate-pulse" />
    }
    
    return <Mic className="w-3 h-3" />
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
    <>
      {/* Floating Hexagon - Top Right (10% of current size) */}
      <div className="fixed top-4 right-4 z-50">
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
          {/* Main hexagon with hexa folder styling */}
          <div className="relative w-6 h-6 cursor-pointer" onClick={handleVoiceToggle}>
            <svg 
              width="100%" 
              height="100%" 
              viewBox="0 0 200 200" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="hexagonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a7f3d0" />
                  <stop offset="30%" stopColor="#6ee7b7" />
                  <stop offset="70%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                
                <radialGradient id="centerHighlight" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#6ee7b7" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Animated glow background */}
              <motion.circle 
                cx="100" 
                cy="100" 
                r="95" 
                fill="url(#centerHighlight)"
                animate={{
                  opacity: isListening ? [0.4, 0.6, 0.4] : 0.4,
                  scale: isListening ? [1, 1.05, 1] : 1
                }}
                transition={{
                  duration: 2,
                  repeat: isListening ? Infinity : 0,
                  ease: "easeInOut"
                }}
              />
              
              {/* Main hexagon */}
              <motion.polygon 
                points="100,20 180,60 180,140 100,180 20,140 20,60" 
                fill="url(#hexagonGradient)" 
                stroke={isListening ? '#10b981' : '#059669'}
                strokeWidth={isListening ? '2.5' : '1.5'}
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
              
              {/* Animated breathing effect rings */}
              {isListening && (
                <motion.circle
                  cx="100"
                  cy="100"
                  r="40"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: [0.8, 1.2, 0.8],
                    opacity: [0, 0.5, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </svg>

            {/* Voice status indicator in the center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`${getVoiceStatusColor()} ${isListening || isSpeaking ? 'animate-pulse' : ''}`}>
                {getVoiceStatusIcon()}
              </div>
            </div>

            {/* Connection status indicator */}
            {!isConnected && (
              <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>

          {/* Voice active pulse ring around the entire hexagon */}
          {(isListening || isSpeaking) && (
            <motion.div
              className="absolute inset-0 border border-green-500 rounded-full"
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{
                scale: [1, 1.1, 1.1],
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
    </>
  )
}
