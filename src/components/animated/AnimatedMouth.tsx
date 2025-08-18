import React from 'react'
import { motion } from 'framer-motion'

interface AnimatedMouthProps {
  isActive: boolean
}

export const AnimatedMouth: React.FC<AnimatedMouthProps> = ({ isActive }) => {
  return (
    <motion.div
      className="w-2 h-1 bg-white rounded-full relative overflow-hidden"
      animate={{
        scaleY: isActive ? [1, 1.3, 1] : 1,
        scaleX: isActive ? [1, 0.8, 1] : 1,
      }}
      transition={{
        duration: 1.5,
        repeat: isActive ? Infinity : 0,
        ease: "easeInOut"
      }}
    >
      <motion.div
        className="absolute inset-0 bg-red-500 rounded-full"
        animate={{
          scaleY: isActive ? [0.3, 0.8, 0.3] : 0.3,
          y: isActive ? [0, -0.3, 0] : 0,
        }}
        transition={{
          duration: 2,
          repeat: isActive ? Infinity : 0,
          ease: "easeInOut"
        }}
      />
      
      {/* Tongue */}
      <motion.div
        className="absolute inset-0.5 bg-pink-400 rounded-full"
        animate={{
          scaleY: isActive ? [0.2, 0.6, 0.2] : 0.2,
          y: isActive ? [0, -0.2, 0] : 0,
        }}
        transition={{
          duration: 2.5,
          repeat: isActive ? Infinity : 0,
          ease: "easeInOut",
          delay: 0.3
        }}
      />
    </motion.div>
  )
}
