import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Code, Send } from 'lucide-react'
import { useCodeGen } from '../hooks/useCodeGen'
import { MermaidDiagram } from './MermaidDiagram'
import { DeepDivePanel } from './DeepDivePanel'
import { prepareDiagramData, DiagramData } from '../services/diagramCapture'
import MarimoNotebook from './MarimoNotebook'

interface CodeGenInterfaceProps {
  onDiagramDataChange?: (data: DiagramData | null) => void
  onCodeFlowStatusChange?: (status: 'sent' | 'not-sent') => void
}

export const CodeGenInterface: React.FC<CodeGenInterfaceProps> = ({ onDiagramDataChange, onCodeFlowStatusChange }) => {
  const [prompt, setPrompt] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('python')
  const [step, setStep] = useState<'input' | 'diagram' | 'marimo'>('input')
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  
  const diagramContainerRef = useRef<HTMLDivElement>(null)
  const lastSentDataRef = useRef<string | null>(null)
  
  const {
    generateDiagram,
    generateMarimoNotebook,
    diagram,
    marimoNotebook,
    isLoading,
    error,
    reset
  } = useCodeGen()

  const languages = [
    { value: 'python', label: 'Python', icon: '🐍' },
    { value: 'typescript', label: 'TypeScript', icon: '📘' },
    { value: 'javascript', label: 'JavaScript', icon: '🟨' },
    { value: 'SQL', label: 'SQL', icon: '🗄️' },
    { value: 'rust', label: 'Rust', icon: '🦀' }
  ]

  // Update diagram data when diagram changes
  useEffect(() => {
    if (diagram && prompt) {
      const updateDiagramData = async () => {
        try {
          const data = await prepareDiagramData(
            diagram,
            prompt,
            diagramContainerRef.current || undefined
          )
          // Pass diagram data up to parent component for voice interface
          onDiagramDataChange?.(data)
        } catch (error) {
          console.error('Error preparing diagram data:', error)
          // Fallback without image
          const fallbackData = {
            mermaidCode: diagram,
            diagramImage: '',
            prompt: prompt
          }
          onDiagramDataChange?.(fallbackData)
        }
      }
      
      // Small delay to ensure diagram is rendered
      setTimeout(updateDiagramData, 500)
    } else {
      onDiagramDataChange?.(null)
    }
  }, [diagram, prompt])

  const handleNodeSelect = (nodeName: string) => {
    if (nodeName) {
      setSelectedNode(nodeName)
    } else {
      setSelectedNode(null)
    }
  }

  // Track pending requests to prevent concurrent calls
  const pendingRequestRef = useRef<Promise<void> | null>(null)

  const handleDiscussionRequest = async (diagramContext: DiagramData) => {
    console.log('Hexagon discussion started for diagram:', diagramContext)
    
    // Check if there's already a pending request
    if (pendingRequestRef.current) {
      console.log('⏳ Waiting for previous request to complete')
      await pendingRequestRef.current
    }
    
    // Create new request promise
    pendingRequestRef.current = (async () => {
      try {
        // Send diagram data to hexagon worker external data endpoint
        const response = await fetch('https://hexa-worker.prabhatravib.workers.dev/api/external-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mermaidCode: diagramContext.mermaidCode,
            diagramImage: diagramContext.diagramImage,
            prompt: diagramContext.prompt,
            type: 'diagram'
          })
        })

        if (!response.ok) {
          // Handle 409 Conflict - investigate why hexagon worker is rejecting the data
          if (response.status === 409) {
            console.error('❌ 409 Conflict: Hexagon worker rejected the diagram data')
            const errorText = await response.text()
            console.error('Error details:', errorText)
            throw new Error(`Hexagon worker rejected data: ${errorText}`)
          }
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        console.log('✅ Diagram data sent to hexagon worker:', result)
        
        // ✅ Update status to show "Code Flow Sent" after successful API call
        onCodeFlowStatusChange?.('sent')
        
      } catch (error) {
        console.error('❌ Error sending data to hexagon worker:', error)
      } finally {
        // Clear the pending request
        pendingRequestRef.current = null
      }
    })()
    
    // Wait for the request to complete
    await pendingRequestRef.current
  }

  const handleGenerateDiagram = async () => {
    if (!prompt.trim()) return
    
    // Clear duplicate detection for new diagram generation
    lastSentDataRef.current = null
    console.log('🔄 Starting new diagram generation - cleared duplicate cache')
    
    const success = await generateDiagram(prompt)
    if (success) {
      setStep('diagram')
      // Automatically trigger hexagon discussion when diagram is generated
      // Small delay to ensure diagram is fully rendered and image can be captured
      setTimeout(async () => {
        // Get the current diagram from the hook
        const currentDiagram = diagram
        console.log('🔄 Attempting to send diagram to hexagon worker:', { 
          hasDiagram: !!currentDiagram, 
          diagramLength: currentDiagram?.length,
          prompt: prompt 
        })
        
        if (currentDiagram) {
          try {
            // Try to capture the actual diagram image if possible
            let diagramImage = ''
            if (diagramContainerRef.current) {
              // You can implement actual image capture here if needed
              // For now, we'll use the Mermaid code as the primary data
              diagramImage = '' // Placeholder for actual image capture
            }
            
            const diagramData = {
              mermaidCode: currentDiagram,
              diagramImage: diagramImage,
              prompt: prompt
            }
            
            console.log('📤 Sending diagram data to hexagon worker:', diagramData)
            await handleDiscussionRequest(diagramData)
            
          } catch (error) {
            console.error('❌ Error preparing diagram data:', error)
          }
        } else {
          console.warn('⚠️ No diagram available to send to hexagon worker')
        }
      }, 1000) // Small delay to ensure diagram is fully rendered
    }
  }

  const handleGenerateMarimoNotebook = async () => {
    if (!diagram || !prompt.trim()) return
    console.log('Generating Marimo notebook...', { diagram: !!diagram, prompt: !!prompt, language: selectedLanguage })
    const success = await generateMarimoNotebook(diagram, selectedLanguage, prompt)
    console.log('Marimo generation result:', success)
    if (success) {
      console.log('Setting step to marimo')
      setStep('marimo')
    }
  }

  const clearAll = () => {
    setStep('input')
    setPrompt('')
    setSelectedNode(null)
    onDiagramDataChange?.(null)
    // Clear duplicate detection when starting over
    lastSentDataRef.current = null
    console.log('🔄 Cleared all data - reset duplicate cache')
    reset()
  }

  const backToFlowchart = () => {
    setStep('diagram')
  }

  return (
    <div className="space-y-6 text-left">
      {/* Input Area - Always Visible */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="input-area">
        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the code you want to generate..."
            rows={4}
            className="code-input"
            disabled={isLoading}
          />
          <div className="input-options">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="language-select"
              disabled={isLoading}
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            <button onClick={handleGenerateDiagram} disabled={!prompt.trim() || isLoading} className="btn-primary flex-1">
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Create CodeFlow
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Background Panel - Starts below input panel */}
      <div className="mt-8 p-6 rounded-lg bg-gray-800/50 border border-gray-700/50">
        {/* Diagram Section - Always visible when diagram exists */}
        {diagram && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="diagram-section">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Proposed Code Flow</h3>
            </div>
            <div className="diagram-layout">
              {/* Left side - Flowchart and Action Buttons */}
              <div className="diagram-main">
                <div className="diagram-container" ref={diagramContainerRef}>
                  <MermaidDiagram 
                    diagram={diagram} 
                    onNodeSelect={handleNodeSelect}
                    selectedNode={selectedNode}
                  />
                  
                  {/* Action Buttons - Below the diagram */}
                  <div className="diagram-actions mt-4">
                    <div className="text-sm text-white/60 mb-3 text-center">
                      💡 <strong>Tip:</strong> Click on any node in the flowchart to ask deep dive questions about it!
                    </div>
                    <div className="flex gap-3 justify-center">
                      <button onClick={handleGenerateMarimoNotebook} disabled={isLoading} className="btn-primary flex items-center justify-center disabled:opacity-50">
                        {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" /> : (<><Code className="w-4 h-4 mr-2"/>Generate Marimo Notebook</>)}
                      </button>
                      <button onClick={clearAll} className="btn-secondary">Start Over</button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right side - Deep Dive Panel */}
              <div className="diagram-sidebar">
                {selectedNode ? (
                  <DeepDivePanel
                    selectedNode={selectedNode}
                    originalPrompt={prompt}
                    flowchart={diagram}
                    onClose={() => {
                      setSelectedNode(null)
                    }}
                  />
                ) : (
                  <div className="sidebar-placeholder">
                    <div className="text-center text-white/60 p-8">
                      <div className="text-4xl mb-4">🔍</div>
                      <h4 className="text-lg font-medium mb-2">Deep Dive Panel</h4>
                      <p className="text-sm">Click on any node in the flowchart to ask questions about it and get detailed explanations.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Placeholder content when no diagram exists */}
        {!diagram && (
          <div className="text-center text-white/60 py-12">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium mb-2">Ready to Generate Code</h3>
            <p className="text-sm">Enter your code description above and click "Create CodeFlow" to get started.</p>
          </div>
        )}
      </div>

      {/* Marimo Notebook Section - Appears below the flowchart when notebook is generated */}
      {step === 'marimo' && marimoNotebook && (
        <div style={{ width: '100vw', marginLeft: 'calc(-50vw + 50%)', padding: '0 1rem' }}>
          <MarimoNotebook
            marimoNotebook={marimoNotebook}
            onBack={backToFlowchart}
          />
        </div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="error-message">
          <p className="text-sm">{error}</p>
        </motion.div>
      )}
    </div>
  )
}
