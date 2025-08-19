import React from 'react'
import { motion } from 'framer-motion'

interface AnimatedEyesProps {
  isActive: boolean
}

export const AnimatedEyes: React.FC<AnimatedEyesProps> = ({ isActive }) => {
  return (
    <div className="flex space-x-4">
      {/* Left Eye */}
      <motion.div
        className="w-1.5 h-1.5 bg-white rounded-full relative"
        animate={{
          scale: isActive ? [1, 1.2, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: isActive ? Infinity : 0,
          ease: "easeInOut"
        }}
      >
        <motion.div
          className="absolute inset-0.5 bg-blue-600 rounded-full"
          animate={{
            x: isActive ? [0, 1, 0] : 0,
            y: isActive ? [0, -0.5, 0] : 0,
          }}
          transition={{
            duration: 3,
            repeat: isActive ? Infinity : 0,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute inset-0.5 bg-black rounded-full"
          animate={{
            scale: isActive ? [1, 0.8, 1] : 1,
          }}
          transition={{
            duration: 1.5,
            repeat: isActive ? Infinity : 0,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Right Eye */}
      <motion.div
        className="w-1.5 h-1.5 bg-white rounded-full relative"
        animate={{
          scale: isActive ? [1, 1.2, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: isActive ? Infinity : 0,
          ease: "easeInOut",
          delay: 0.5
        }}
      >
        <motion.div
          className="absolute inset-0.5 bg-blue-600 rounded-full"
          animate={{
            x: isActive ? [0, -1, 0] : 0,
            y: isActive ? [0, -0.5, 0] : 0,
          }}
          transition={{
            duration: 3,
            repeat: isActive ? Infinity : 0,
            ease: "easeInOut",
            delay: 0.5
          }}
        />
        <motion.div
          className="absolute inset-0.5 bg-black rounded-full"
          animate={{
            scale: isActive ? [1, 0.8, 1] : 1,
          }}
          transition={{
            duration: 1.5,
            repeat: isActive ? Infinity : 0,
            ease: "easeInOut",
            delay: 0.5
          }}
        />
      </motion.div>
    </div>
  )
}
