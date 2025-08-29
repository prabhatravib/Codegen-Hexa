import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Code, Send } from 'lucide-react'
import { useCodeGen } from '../hooks/useCodeGen'
import { MermaidDiagram } from './MermaidDiagram'
import { DeepDivePanel } from './DeepDivePanel'
import MarimoNotebook from './MarimoNotebook'

export const CodeGenInterface: React.FC = () => {
  const [prompt, setPrompt] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('python')
  const [step, setStep] = useState<'input' | 'diagram' | 'marimo'>('input')
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  
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

  const handleGenerateDiagram = async () => {
    if (!prompt.trim()) return
    const success = await generateDiagram(prompt)
    if (success) setStep('diagram')
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

  const handleNodeSelect = (nodeName: string) => {
    if (nodeName) {
      setSelectedNode(nodeName)
    } else {
      setSelectedNode(null)
    }
  }

  const clearAll = () => {
    setStep('input')
    setPrompt('')
    setSelectedNode(null)
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
            <h3 className="text-xl font-semibold mb-4 text-white">Proposed Code Flow</h3>
            <div className="diagram-layout">
              {/* Left side - Flowchart and Action Buttons */}
              <div className="diagram-main">
                <div className="diagram-container">
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
        <MarimoNotebook
          marimoNotebook={marimoNotebook}
          onBack={backToFlowchart}
        />
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="error-message">
          <p className="text-sm">{error}</p>
        </motion.div>
      )}
    </div>
  )
}
