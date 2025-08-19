import React from 'react'
import { motion } from 'framer-motion'

interface AnimatedGlowProps {
  isActive: boolean
}

export const AnimatedGlow: React.FC<AnimatedGlowProps> = ({ isActive }) => {
  return (
    <>
      {/* Outer Glow Ring */}
      <motion.div
        className="absolute inset-0 w-10 h-10 rounded-full"
        animate={{
          scale: isActive ? [1, 1.3, 1] : 1,
          opacity: isActive ? [0.1, 0.3, 0.1] : 0,
        }}
        transition={{
          duration: 3,
          repeat: isActive ? Infinity : 0,
          ease: "easeInOut"
        }}
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
        }}
      />
      
      {/* Inner Glow Ring */}
      <motion.div
        className="absolute inset-0 w-10 h-10 rounded-full"
        animate={{
          scale: isActive ? [0.8, 1.1, 0.8] : 0.8,
          opacity: isActive ? [0.2, 0.5, 0.2] : 0,
        }}
        transition={{
          duration: 2,
          repeat: isActive ? Infinity : 0,
          ease: "easeInOut",
          delay: 0.5
        }}
        style={{
          background: 'radial-gradient(circle, rgba(147, 197, 253, 0.4) 0%, transparent 60%)',
        }}
      />
      
      {/* Pulse Points */}
      {isActive && (
        <>
          <motion.div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full"
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full"
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          <motion.div
            className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full"
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
          <motion.div
            className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full"
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5
            }}
          />
        </>
      )}
    </>
  )
}
