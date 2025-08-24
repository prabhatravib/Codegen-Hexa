import { useState, useCallback } from 'react'

interface CodeGenState {
  diagram: string | null
  marimoNotebook: string | null
  isLoading: boolean
  error: string | null
}

export const useCodeGen = () => {
  const [state, setState] = useState<CodeGenState>({
    diagram: null,
    marimoNotebook: null,
    isLoading: false,
    error: null
  })

  const generateDiagram = useCallback(async (prompt: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Call Cloudflare Workers backend API to generate diagram
      const response = await fetch('https://codegen-hexa-backend.prabhatravib.workers.dev/api/generate-diagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.diagram) {
        setState(prev => ({
          ...prev,
          diagram: data.diagram,
          isLoading: false,
          error: null
        }))
        return true
      } else {
        throw new Error(data.error || 'Failed to generate diagram')
      }
    } catch (error) {
      console.error('Error generating diagram:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }))
      return false
    }
  }, [])

  const generateMarimoNotebook = useCallback(async (diagram: string, language: string, prompt: string): Promise<boolean> => {
    console.log('generateMarimoNotebook called with:', { diagram: diagram.substring(0, 50), language, prompt: prompt.substring(0, 50) })
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Generate a simple Marimo notebook directly in the frontend
      // This bypasses the backend service that was generating fallback HTML
      const marimoNotebook = `# Generated Marimo Notebook
# Generated from diagram: ${diagram.substring(0, 100)}...

import marimo as mo

@mo.md
def diagram_info():
    """Information about the generated diagram"""
    return f"""
    ## Diagram Analysis
    
    **Language**: {language}
    
    **Prompt**: {prompt}
    
    **Diagram**: {diagram}
    """

@mo.md
def interactive_example():
    """Interactive example based on the diagram"""
    return "This is an interactive Marimo notebook generated from your diagram!"

# You can add more interactive cells here based on your specific needs
print("🚀 Marimo notebook generated successfully!")
print(f"Language: {language}")
print(f"Diagram length: {len(diagram)} characters")
`

      console.log('Generated Marimo notebook directly in frontend')
      setState(prev => ({
        ...prev,
        marimoNotebook: marimoNotebook,
        isLoading: false,
        error: null
      }))
      return true
    } catch (error) {
      console.error('Error generating Marimo notebook:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }))
      return false
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      diagram: null,
      marimoNotebook: null,
      isLoading: false,
      error: null
    })
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const checkHealth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('https://codegen-marimo.prabhatravib.workers.dev/health')
      return response.ok
    } catch (error) {
      console.error('Health check failed:', error)
      return false
    }
  }, [])

  return {
    ...state,
    generateDiagram,
    generateMarimoNotebook,
    reset,
    clearError,
    checkHealth
  }
}
