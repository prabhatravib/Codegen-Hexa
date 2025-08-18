import { useState, useCallback } from 'react'

interface CodeGenState {
  diagram: string | null
  generatedCode: string | null
  isLoading: boolean
  error: string | null
}

export const useCodeGen = () => {
  const [state, setState] = useState<CodeGenState>({
    diagram: null,
    generatedCode: null,
    isLoading: false,
    error: null
  })

  const generateDiagram = useCallback(async (prompt: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Call Python backend API to generate diagram
      const response = await fetch('/api/generate-diagram', {
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

  const generateCode = useCallback(async (diagram: string, language: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Call Python backend API to generate code
      const response = await fetch('/api/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ diagram, language })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.code) {
        setState(prev => ({
          ...prev,
          generatedCode: data.code,
          isLoading: false,
          error: null
        }))
        return true
      } else {
        throw new Error(data.error || 'Failed to generate code')
      }
    } catch (error) {
      console.error('Error generating code:', error)
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
      generatedCode: null,
      isLoading: false,
      error: null
    })
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    generateDiagram,
    generateCode,
    reset,
    clearError
  }
}
