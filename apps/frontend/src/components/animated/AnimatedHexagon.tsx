import React from 'react'
import { motion } from 'framer-motion'

interface DiagramData {
  mermaidCode: string
  diagramImage: string
  prompt: string
}

interface AnimatedHexagonProps {
  isActive: boolean
  className?: string
  diagramData?: DiagramData | null
  onDiscussionRequest?: (diagramContext: DiagramData) => void
}

export const AnimatedHexagon: React.FC<AnimatedHexagonProps> = ({ 
  isActive, 
  className = "w-2 h-2",
  diagramData,
  onDiscussionRequest
}) => {

  const handleHexagonClick = () => {
    if (diagramData && onDiscussionRequest) {
      onDiscussionRequest(diagramData)
    }
  }

  return (
    <motion.svg
      viewBox="0 0 10 10"
      className={className}
      animate={{
        scale: isActive ? 1.05 : 1,
        rotate: isActive ? [0, -2, 2, 0] : 0
      }}
      transition={{
        duration: 2,
        repeat: isActive ? Infinity : 0,
        ease: "easeInOut"
      }}
      onClick={handleHexagonClick}
      style={{ cursor: isActive ? 'pointer' : 'default' }}
    >
      {/* Main Hexagon */}
      <motion.path
        d="M5 0.6L8.75 2.66V6.72L5 8.75L1.25 6.72V2.66L5 0.6Z"
        fill="url(#hexagonGradient)"
        stroke="url(#hexagonStroke)"
        strokeWidth="0.3"
        animate={{
          strokeWidth: isActive ? 0.6 : 0.3,
          filter: isActive ? "drop-shadow(0 0 2.5px rgba(59, 130, 246, 0.5))" : "none"
        }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Inner Glow */}
      <motion.path
        d="M5 0.6L8.75 2.66V6.72L5 8.75L1.25 6.72V2.66L5 0.6Z"
        fill="none"
        stroke="rgba(59, 130, 246, 0.3)"
        strokeWidth="0.9"
        animate={{
          opacity: isActive ? [0.3, 0.8, 0.3] : 0,
          scale: isActive ? [0.9, 1.1, 0.9] : 1
        }}
        transition={{
          duration: 2,
          repeat: isActive ? Infinity : 0,
          ease: "easeInOut"
        }}
      />

      {/* Discussion Ready Indicator */}
      {isActive && (
        <motion.circle
          cx="7.5"
          cy="2.5"
          r="1"
          fill="#10B981"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Gradients */}
      <defs>
        <linearGradient id="hexagonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#1E40AF" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
        
        <linearGradient id="hexagonStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
    </motion.svg>
  )
}
