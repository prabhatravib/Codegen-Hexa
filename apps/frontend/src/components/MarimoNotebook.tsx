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
    // Create a temporary notebook file and serve it through the container
    const createAndServeNotebook = async () => {
      try {
        setStatus('loading')
        setError(null)
        
        // Generate a unique notebook ID
        const notebookId = `notebook_${Date.now()}_${Math.random().toString(36).substring(2, 11).replace(/[^a-z0-9]/g, '')}`
        

        
        // For now, we'll use a simple approach - create a temporary notebook file
        // that can be served by the container
        const tempNotebookContent = `# Temporary Marimo Notebook
${marimoNotebook}

# This notebook was generated from your flowchart
# It will be available for this session only
`
        
        // Create a temporary notebook file using the container's file creation mechanism
        try {
          // Try to create the notebook file in the container
          const createResponse = await fetch('https://twilight-cell-b373.prabhatravib.workers.dev/create-notebook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: tempNotebookContent,
              id: notebookId
            })
          })
          
          if (createResponse.ok) {
            const data = await createResponse.json()
            if (data.success) {
              // Use the container URL for the iframe
              const marimoUrl = `https://twilight-cell-b373.prabhatravib.workers.dev/notebooks/${notebookId}?embedded=true`
              setMarimoUrl(marimoUrl)
              setStatus('ready')
            } else {
              throw new Error('Failed to create notebook in container')
            }
          } else {
            throw new Error('Failed to create notebook in container')
          }
        } catch (createError) {
          console.warn('Could not create notebook in container, falling back to direct content display:', createError)
          
          // Fallback: Create a simple HTML page with the notebook content
          const fallbackHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Marimo Notebook - ${notebookId}</title>
    <style>
        body { font-family: 'Courier New', monospace; background: #1e1e1e; color: #d4d4d4; padding: 20px; }
        .notebook-content { background: #2d2d2d; padding: 20px; border-radius: 8px; white-space: pre-wrap; }
        .header { color: #4ec9b0; margin-bottom: 20px; }
        .info { color: #9cdcfe; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="header"> Marimo Notebook Generated from Your Flowchart</div>
    <div class="info">Notebook ID: ${notebookId}</div>
    <div class="notebook-content">${marimoNotebook.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    <script>
        // Auto-resize iframe to content
        if (window.parent && window.parent !== window) {
            const height = document.body.scrollHeight;
            window.parent.postMessage({ type: 'resize', height: height + 50 }, '*');
        }
    </script>
</body>
</html>`
          
          const fallbackBlob = new Blob([fallbackHtml], { type: 'text/html' })
          const fallbackUrl = URL.createObjectURL(fallbackBlob)
          setMarimoUrl(fallbackUrl)
          setStatus('ready')
        }
      } catch (error) {
        console.error('Error creating notebook:', error)
        setError(error instanceof Error ? error.message : 'Unknown error occurred')
        setStatus('error')
      } finally {
        setIsLoading(false)
      }
    }
    
    createAndServeNotebook()
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
    
    // Retry creating the notebook
    setTimeout(() => {
      const createAndServeNotebook = async () => {
        try {
          const notebookId = `notebook_${Date.now()}_${Math.random().toString(36).substring(2, 11).replace(/[^a-z0-9]/g, '')}`
          
          // Try to create the notebook file in the container
          const createResponse = await fetch('https://twilight-cell-b373.prabhatravib.workers.dev/create-notebook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: marimoNotebook,
              id: notebookId
            })
          })
          
          if (createResponse.ok) {
            const data = await createResponse.json()
            if (data.success) {
              const marimoUrl = `https://twilight-cell-b373.prabhatravib.workers.dev/notebooks/${notebookId}?embedded=true`
              setMarimoUrl(marimoUrl)
              setStatus('ready')
            } else {
              throw new Error('Failed to create notebook in container')
            }
          } else {
            throw new Error('Failed to create notebook in container')
          }
        } catch (error) {
          setError('Failed to create notebook in container')
          setStatus('error')
        } finally {
          setIsLoading(false)
        }
      }
      createAndServeNotebook()
    }, 100)
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white">Creating Marimo Notebook...</p>
          <p className="text-sm text-gray-400 mt-2">Setting up interactive interface</p>
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
            <span>Creating notebook...</span>
          </div>
        )}
        {status === 'ready' && (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span>Notebook created successfully! Interactive interface ready.</span>
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
        <div className="relative">
          <iframe
            ref={iframeRef}
            src={marimoUrl}
            className="w-full min-h-[800px] h-full border border-gray-600 rounded-lg bg-gray-900"
            style={{ height: '800px', minHeight: '800px' }}
            title="Interactive Marimo Notebook"
            sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
            onLoad={() => {
              // Handle iframe load events
              console.log('Notebook iframe loaded successfully')
            }}
            onError={() => {
              console.error('Failed to load notebook iframe')
              setError('Failed to load notebook content')
              setStatus('error')
            }}
          />
        </div>
      ) : (
        <div className="text-center p-8 text-gray-400">
          <Code className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Failed to create interactive notebook</p>
          <p className="text-sm mt-2">You can still download the notebook file</p>
          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}
