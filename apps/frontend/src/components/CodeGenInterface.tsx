import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Code, Play, Download } from 'lucide-react'
import { useCodeGen } from '../hooks/useCodeGen'
import { MermaidDiagram } from './MermaidDiagram'
import { CodeDisplay } from './CodeDisplay'
import { useVoiceInteraction } from '../hooks/useVoiceInteraction'

export const CodeGenInterface: React.FC = () => {
  const [prompt, setPrompt] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('python')
  const [step, setStep] = useState<'input' | 'diagram' | 'code'>('input')
  
  const {
    generateDiagram,
    generateCode,
    diagram,
    generatedCode,
    isLoading,
    error
  } = useCodeGen()

  const { askQuestion } = useVoiceInteraction()

  const languages = [
    { value: 'python', label: 'Python', icon: '🐍' },
    { value: 'typescript', label: 'TypeScript', icon: '📘' },
    { value: 'javascript', label: 'JavaScript', icon: '🟨' },
    { value: 'go', label: 'Go', icon: '🔵' },
    { value: 'rust', label: 'Rust', icon: '🦀' }
  ]

  const handleGenerateDiagram = async () => {
    if (!prompt.trim()) return
    const success = await generateDiagram(prompt)
    if (success) setStep('diagram')
  }

  const handleGenerateCode = async () => {
    if (!diagram) return
    const success = await generateCode(diagram, selectedLanguage)
    if (success) setStep('code')
  }

  const handleAskVoiceQuestion = async (question: string) => {
    if (diagram || generatedCode) {
      const context = generatedCode ? 'generated code' : 'flowchart'
      await askQuestion(`About the ${context}: ${question}`)
    }
  }

  const resetToInput = () => {
    setStep('input')
    setPrompt('')
  }

  return (
    <div className="space-y-6 text-left">
      {/* Input Area */}
      {step === 'input' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="section-glass">
          <div className="space-y-4">
            <div className="input-area">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the code you want to generate..."
                rows={4}
                className="w-full p-3 rounded-lg bg-black/30 border focus:ring-2 focus:ring-[hsl(50_100%_50%)] focus:border-transparent"
                disabled={isLoading}
              />
              <div className="flex items-center gap-3 mt-3">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="p-3 rounded-lg bg-black/30 border focus:ring-2 focus:ring-[hsl(50_100%_50%)]"
                  disabled={isLoading}
                >
                  {languages.map(lang => (
                    <option key={lang.value} value={lang.value}>
                      {lang.icon} {lang.label}
                    </option>
                  ))}
                </select>
                <button onClick={handleGenerateDiagram} disabled={!prompt.trim() || isLoading} className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
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
          </div>
        </motion.div>
      )}

      {/* Diagram Section */}
      {step === 'diagram' && diagram && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="section-glass">
          <h3 className="text-center text-[hsl(50_100%_50%)] text-xl mb-4">Proposed Code Flow</h3>
          <div className="diagram-layout">
            <div className="diagram-main">
              <MermaidDiagram diagram={diagram} />
            </div>
            <div className="diagram-sidebar">
              <div className="space-y-3">
                <button onClick={handleGenerateCode} disabled={isLoading} className="btn-primary w-full flex items-center justify-center disabled:opacity-50">
                  {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" /> : (<><Code className="w-4 h-4 mr-2"/>Generate Code</>)}
                </button>
                <button onClick={() => handleAskVoiceQuestion('Explain this flowchart')} className="btn-secondary w-full flex items-center justify-center">
                  <Play className="w-4 h-4 mr-2"/>Ask Voice Assistant
                </button>
                <button onClick={resetToInput} className="w-full text-sm text-white/70 hover:text-white">Start Over</button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Code Section */}
      {step === 'code' && generatedCode && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="section-glass">
          <h3 className="text-xl mb-4">Generated Code</h3>
          <CodeDisplay code={generatedCode} language={selectedLanguage} />
          <div className="mt-4 flex gap-3">
            <button onClick={() => handleAskVoiceQuestion('Explain the main function')} className="btn-secondary flex items-center"><Play className="w-4 h-4 mr-2"/>Ask Voice Assistant</button>
            <button
              onClick={() => {
                const blob = new Blob([generatedCode], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `generated_code.${selectedLanguage === 'typescript' ? 'ts' : selectedLanguage}`
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2"/>Download Code
            </button>
            <button onClick={resetToInput} className="ml-auto text-sm text-white/70 hover:text-white">Start Over</button>
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50/10 border border-red-400/40 text-red-200 rounded-lg p-4">
          <p className="text-sm">{error}</p>
        </motion.div>
      )}
    </div>
  )
}
