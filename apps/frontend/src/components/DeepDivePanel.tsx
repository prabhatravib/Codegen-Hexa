import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Copy, Download, X } from 'lucide-react'

interface DeepDivePanelProps {
  selectedNode: string | null
  originalPrompt: string
  flowchart: string
  onClose: () => void
}

interface DeepDiveResponse {
  success: boolean
  explanation: string
  node_name: string
}

export const DeepDivePanel: React.FC<DeepDivePanelProps> = ({
  selectedNode,
  originalPrompt,
  flowchart,
  onClose
}) => {
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<DeepDiveResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAskQuestion = async () => {
    if (!question.trim() || !selectedNode) return

    setIsLoading(true)
    setError(null)
    setResponse(null)

    // Debug logging
    console.log('Deep Dive Request Data:', {
      node_name: selectedNode,
      question: question.trim(),
      original_prompt: originalPrompt,
      flowchart: flowchart
    })

    try {
      const response = await fetch('https://codegen-hexa-backend.prabhatravib.workers.dev/api/deepdive-node', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          node_name: selectedNode,
          question: question.trim(),
          original_prompt: originalPrompt,
          flowchart: flowchart
        })
      })

      const data = await response.json()
      
      // Debug logging
      console.log('Deep Dive Response:', data)

      if (data.success) {
        setResponse(data)
        setQuestion('')
      } else {
        setError(data.error || 'Failed to get response')
      }
    } catch (err) {
      console.error('Deep dive error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(response.explanation)
    }
  }

  const handleDownloadResponse = () => {
    if (response) {
      const blob = new Blob([response.explanation], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `deep-dive-${selectedNode?.replace(/[^a-zA-Z0-9]/g, '-')}.txt`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAskQuestion()
    }
  }

  if (!selectedNode) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="deep-dive-panel"
    >
      {/* Close button - small and positioned at top right */}
      <button
        onClick={onClose}
        className="action-button absolute top-2 right-2 p-1"
        title="Close"
      >
        <X className="w-3 h-3" />
      </button>

      {/* Selected Node Display - smaller text */}
      <div className="mb-3">
        <div className="text-xs text-white/60 mb-1">Selected:</div>
        <div className="text-sm text-white font-medium bg-white/10 rounded px-2 py-1">
          {selectedNode}
        </div>
      </div>

      {/* Question Input */}
      <div className="mb-3">
        <div className="text-xs text-white/60 mb-1">Ask about this node:</div>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about this node..."
          className="question-input text-sm"
          disabled={isLoading}
        />
        <button
          onClick={handleAskQuestion}
          disabled={!question.trim() || isLoading}
          className="ask-button text-sm"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-black mx-auto" />
          ) : (
            <>
              <Send className="w-3 h-3 mr-1 inline" />
              Ask
            </>
          )}
        </button>
      </div>

      {/* Response Area */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="response-area border-red-400/40 bg-red-500/20"
          >
            <p className="text-xs text-red-200">{error}</p>
          </motion.div>
        )}

        {response && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="response-area"
          >
            <div className="response-header">
              <h5 className="text-sm text-white font-medium">
                Response for: {response.node_name}
              </h5>
              <div className="response-actions">
                <button
                  onClick={handleCopyResponse}
                  className="action-button"
                  title="Copy to clipboard"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={handleDownloadResponse}
                  className="action-button"
                  title="Download as text"
                >
                  <Download className="w-3 h-3" />
                </button>
              </div>
            </div>
            
            <div className="prose prose-invert prose-xs max-w-none">
              <div 
                dangerouslySetInnerHTML={{
                  __html: response.explanation
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
