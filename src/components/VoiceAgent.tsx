import React from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { useVoiceInteraction } from '../hooks/useVoiceInteraction'
import { AnimatedHexagon } from './animated/AnimatedHexagon'
import { AnimatedEyes } from './animated/AnimatedEyes'
import { AnimatedMouth } from './animated/AnimatedMouth'
import { AnimatedGlow } from './animated/AnimatedGlow'

export const VoiceAgent: React.FC = () => {
  const {
    isListening,
    isSpeaking,
    isConnected,
    startListening,
    stopListening,
    toggleMute,
    isMuted,
    currentMessage,
    connectionStatus
  } = useVoiceInteraction()

  return (
    <>
      {/* Floating Hexagon - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <motion.div
          className="relative"
          animate={{
            scale: isListening ? 1.1 : 1,
            rotate: isListening ? [0, -5, 5, 0] : 0
          }}
          transition={{
            duration: 0.5,
            repeat: isListening ? Infinity : 0
          }}
        >
          <AnimatedHexagon 
            isActive={isListening || isSpeaking}
            className="w-10 h-10"
          />
          
          {/* Eyes */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            <AnimatedEyes isActive={isListening || isSpeaking} />
          </div>
          
          {/* Mouth */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
            <AnimatedMouth isActive={isListening || isSpeaking} />
          </div>
          
          {/* Glow Effect */}
          <AnimatedGlow isActive={isListening || isSpeaking} />
        </motion.div>
      </div>

      {/* Voice Controls Panel */}
      <div className="bg-card rounded-lg border p-6 h-fit">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Voice Assistant
          </h2>
          <p className="text-sm text-muted-foreground">
            Ask me anything about your code!
          </p>
        </div>

      {/* Connection Status */}
      <div className="text-center mb-4">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          connectionStatus === 'connected' 
            ? 'bg-green-100 text-green-800' 
            : connectionStatus === 'connecting'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            connectionStatus === 'connected' 
              ? 'bg-green-500' 
              : connectionStatus === 'connecting'
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`} />
          {connectionStatus === 'connected' ? 'Connected' : 
           connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
        </div>
      </div>

      {/* Voice Controls */}
      <div className="space-y-3">
        {/* Listen Button */}
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={!isConnected}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4 mr-2" />
              Stop Listening
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Start Listening
            </>
          )}
        </button>

        {/* Mute Button */}
        <button
          onClick={toggleMute}
          disabled={!isConnected}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
            isMuted
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 mr-2" />
              Unmute
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 mr-2" />
              Mute
            </>
          )}
        </button>
      </div>

      {/* Current Message Display */}
      {currentMessage && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-foreground">
            <span className="font-medium">Assistant:</span> {currentMessage}
          </p>
        </div>
      )}

      {/* Status Indicators */}
      <div className="mt-4 space-y-2">
        {isListening && (
          <div className="flex items-center text-sm text-blue-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse" />
            Listening...
          </div>
        )}
        {isSpeaking && (
          <div className="flex items-center text-sm text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            Speaking...
          </div>
        )}
      </div>
    </div>
    </>
  )
}
