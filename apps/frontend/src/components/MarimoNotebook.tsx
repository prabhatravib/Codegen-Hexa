import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Download, Code, CheckCircle, AlertCircle } from 'lucide-react'

interface MarimoNotebookProps {
  marimoNotebook: string
  onBack: () => void
}

export default function MarimoNotebook({ marimoNotebook, onBack }: MarimoNotebookProps) {
  const [marimoUrl, setMarimoUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  useEffect(() => {
    // Use the real Marimo container with Cloudflare KV storage
    const generateInteractiveNotebook = async () => {
      try {
        setStatus('loading')
        setError(null)
        
        const notebookId = `notebook_${Date.now()}_${Math.random().toString(36).substring(2, 11).replace(/[^a-z0-9]/g, '')}`
        
        // Use your Cloudflare Container URL directly
        const response = await fetch('https://twilight-cell-b373.prabhatravib.workers.dev/api/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: marimoNotebook,
            id: notebookId
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            // Use the container URL for the iframe with embedded=true to eliminate double iframe
            const marimoUrl = `https://twilight-cell-b373.prabhatravib.workers.dev/notebooks/${data.id}?embedded=true`
            setMarimoUrl(marimoUrl)
            setStatus('ready')
          } else {
            throw new Error(data.error || 'Failed to save notebook to Marimo container')
          }
        } else {
          const errorText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }
      } catch (error) {
        console.error('Error saving notebook to Marimo container:', error)
        setError(error instanceof Error ? error.message : 'Unknown error occurred')
        setStatus('error')
      } finally {
        setIsLoading(false)
      }
    }
    
    generateInteractiveNotebook()
  }, [marimoNotebook])

  const handleDownload = () => {
    const blob = new Blob([marimoNotebook], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'marimo_notebook.py'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleOpenInNewTab = () => {
    if (marimoUrl) {
      window.open(marimoUrl, '_blank')
    }
  }

  const handleRetry = () => {
    setError(null)
    setStatus('loading')
    setIsLoading(true)
    setMarimoUrl(null)
    
    // Retry saving to container
    setTimeout(() => {
      const saveToMarimoContainer = async () => {
        try {
          const notebookId = `notebook_${Date.now()}_${Math.random().toString(36).substring(2, 11).replace(/[^a-z0-9]/g, '')}`
          
          const response = await fetch('https://twilight-cell-b373.prabhatravib.workers.dev/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: marimoNotebook,
              id: notebookId
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              // Use the container URL for the iframe with embedded=true to eliminate double iframe
              const marimoUrl = `https://twilight-cell-b373.prabhatravib.workers.dev/notebooks/${data.id}?embedded=true`
              setMarimoUrl(marimoUrl)
              setStatus('ready')
            } else {
              throw new Error(data.error || 'Failed to save notebook to Marimo container')
            }
          } else {
            const errorText = await response.text()
            throw new Error(`HTTP ${response.status}: ${errorText}`)
          }
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to save notebook to Marimo container')
          setStatus('error')
        } finally {
          setIsLoading(false)
        }
      }
      saveToMarimoContainer()
    }, 100)
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white">Creating Marimo Notebook...</p>
        </div>
      </div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="marimo-notebook-container"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">Interactive Marimo Notebook</h3>
        <div className="flex gap-2">
          <button onClick={handleDownload} className="btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Download
          </button>
          {marimoUrl && (
            <button onClick={handleOpenInNewTab} className="btn-secondary">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </button>
          )}
          <button onClick={onBack} className="btn-secondary">
            Back to Flowchart
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="mb-4 p-3 rounded-lg border">
        {status === 'loading' && (
          <div className="flex items-center gap-2 text-yellow-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
            <span>Creating Marimo Notebook...</span>
          </div>
        )}
        {status === 'ready' && (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span>Notebook saved to Cloudflare Container! Interactive interface ready.</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>Error: {error}</span>
            <button onClick={handleRetry} className="ml-2 px-2 py-1 bg-red-600 text-white rounded text-sm">
              Retry
            </button>
          </div>
        )}
      </div>
      
      {marimoUrl ? (
        <div className="relative w-full">
          <iframe
            ref={iframeRef}
            src={marimoUrl}
            className="w-full min-h-[800px] h-full border border-gray-600 rounded-lg bg-gray-900"
            style={{ height: '800px', minHeight: '800px', width: '100%' }}
            title="Real Interactive Marimo Notebook"
            sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
          />
        </div>
      ) : (
        <div className="text-center p-8 text-gray-400">
          <Code className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Failed to load interactive notebook from Marimo container</p>
          <p className="text-sm mt-2">You can still download the notebook file</p>
          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
              <p className="text-xs text-gray-500 mt-1">
                The "kernel not found" error typically indicates a server startup issue, not a code syntax problem.
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
