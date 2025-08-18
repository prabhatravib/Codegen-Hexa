import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Code, FileText, Play, Download } from 'lucide-react'
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
    if (success) {
      setStep('diagram')
    }
  }

  const handleGenerateCode = async () => {
    if (!diagram) return
    
    const success = await generateCode(diagram, selectedLanguage)
    if (success) {
      setStep('code')
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Code Generation
        </h2>
        <p className="text-muted-foreground">
          Describe your code requirements and I'll generate flowcharts and code for you
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4">
          {[
            { key: 'input', label: 'Input', icon: FileText },
            { key: 'diagram', label: 'Diagram', icon: Code },
            { key: 'code', label: 'Code', icon: Play }
          ].map((stepItem, index) => {
            const Icon = stepItem.icon
            const isActive = step === stepItem.key
            const isCompleted = ['diagram', 'code'].includes(stepItem.key) && 
              (step === 'diagram' || step === 'code')
            
            return (
              <div key={stepItem.key} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isActive 
                    ? 'border-primary bg-primary text-primary-foreground' 
                    : isCompleted
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-muted-foreground text-muted-foreground'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                {index < 2 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    isCompleted ? 'bg-green-500' : 'bg-muted-foreground'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Input Step */}
      {step === 'input' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-lg border p-6"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Describe your code requirements
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., Create a user authentication system with JWT tokens, password hashing, and role-based access control..."
                className="w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Programming Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isLoading}
              >
                {languages.map(lang => (
                  <option key={lang.value} value={lang.value}>
                    {lang.icon} {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerateDiagram}
              disabled={!prompt.trim() || isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Generate Flowchart
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Diagram Step */}
      {step === 'diagram' && diagram && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Generated Flowchart
              </h3>
              <button
                onClick={resetToInput}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Start Over
              </button>
            </div>
            
            <MermaidDiagram diagram={diagram} />
            
            <div className="mt-4 flex space-x-3">
              <button
                onClick={handleGenerateCode}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                ) : (
                  <>
                    <Code className="w-4 h-4 mr-2" />
                    Generate Code
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleAskVoiceQuestion("Explain this flowchart")}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Play className="w-4 h-4 mr-2" />
                Ask Voice Assistant
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Code Step */}
      {step === 'code' && generatedCode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-card rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Generated Code
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setStep('diagram')}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Back to Diagram
                </button>
                <button
                  onClick={resetToInput}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Start Over
                </button>
              </div>
            </div>
            
            <CodeDisplay code={generatedCode} language={selectedLanguage} />
            
            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => handleAskVoiceQuestion("Explain the main function")}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Play className="w-4 h-4 mr-2" />
                Ask Voice Assistant
              </button>
              
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
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Code
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <p className="text-red-800 text-sm">{error}</p>
        </motion.div>
      )}
    </div>
  )
}
