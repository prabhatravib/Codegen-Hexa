import React, { createContext, useContext } from 'react'
import { create } from 'zustand'

interface CodeGenStore {
  // Current workflow state
  currentStep: 'input' | 'diagram' | 'code'
  
  // User input
  userPrompt: string
  selectedLanguage: string
  
  // Generated content
  diagram: string | null
  generatedCode: string | null
  
  // UI state
  isLoading: boolean
  error: string | null
  
  // Actions
  setCurrentStep: (step: 'input' | 'diagram' | 'code') => void
  setUserPrompt: (prompt: string) => void
  setSelectedLanguage: (language: string) => void
  setDiagram: (diagram: string | null) => void
  setGeneratedCode: (code: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
  
  // Computed values
  canGenerateDiagram: boolean
  canGenerateCode: boolean
  workflowProgress: number
}

const useCodeGenStore = create<CodeGenStore>((set, get) => ({
  // Initial state
  currentStep: 'input',
  userPrompt: '',
  selectedLanguage: 'python',
  diagram: null,
  generatedCode: null,
  isLoading: false,
  error: null,
  
  // Actions
  setCurrentStep: (step) => set({ currentStep: step }),
  setUserPrompt: (prompt) => set({ userPrompt: prompt }),
  setSelectedLanguage: (language) => set({ selectedLanguage: language }),
  setDiagram: (diagram) => set({ diagram }),
  setGeneratedCode: (code) => set({ generatedCode: code }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  reset: () => set({
    currentStep: 'input',
    userPrompt: '',
    selectedLanguage: 'python',
    diagram: null,
    generatedCode: null,
    isLoading: false,
    error: null
  }),
  
  // Computed values
  get canGenerateDiagram() {
    const { userPrompt } = get()
    return userPrompt.trim().length > 0
  },
  
  get canGenerateCode() {
    const { diagram } = get()
    return diagram !== null
  },
  
  get workflowProgress() {
    const { currentStep } = get()
    switch (currentStep) {
      case 'input': return 0
      case 'diagram': return 50
      case 'code': return 100
      default: return 0
    }
  }
}))

// Context for React components
const CodeGenContext = createContext<CodeGenStore | null>(null)

export const CodeGenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <CodeGenContext.Provider value={useCodeGenStore.getState()}>
      {children}
    </CodeGenContext.Provider>
  )
}

export const useCodeGenStoreContext = () => {
  const context = useContext(CodeGenContext)
  if (!context) {
    throw new Error('useCodeGenStoreContext must be used within a CodeGenProvider')
  }
  return context
}

// Export the store for direct use
export { useCodeGenStore }
