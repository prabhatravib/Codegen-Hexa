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
    console.log('generateMarimoNotebook called with:', { 
      diagram: diagram.substring(0, 200) + '...', 
      language, 
      prompt 
    })
    
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Parse the Mermaid diagram to extract flow graph data
      const { parseMermaidToFlowGraph } = await import('../services/mermaidParser')
      const flow = parseMermaidToFlowGraph(diagram)
      
      console.log('Parsed flow graph:', flow)

      // Call the backend API for Marimo generation
      const response = await fetch('https://codegen-hexa-backend.prabhatravib.workers.dev/api/marimo/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          language, 
          diagram,
          flowGraph: flow
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.marimoNotebook) {
        console.log('Generated Marimo notebook using AI-powered generation')
        setState(prev => ({
          ...prev,
          marimoNotebook: data.marimoNotebook, // This is the generated notebook content
          isLoading: false,
          error: null
        }))
        return true
      } else {
        throw new Error(data.error || 'Failed to generate Marimo notebook')
      }
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
