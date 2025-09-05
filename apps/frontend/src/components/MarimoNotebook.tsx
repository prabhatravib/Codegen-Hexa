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
    // The marimoNotebook is now a URL to the interactive Marimo container
    const setupNotebook = async () => {
      try {
        setStatus('loading')
        setError(null)
        
        if (marimoNotebook) {
          if (marimoNotebook.startsWith('http')) {
            // It's a URL to the Marimo container, use it directly
            console.log('Setting up Marimo notebook with URL:', marimoNotebook)
            setMarimoUrl(marimoNotebook)
            setStatus('ready')
          } else {
            // Fallback: if it's still raw content, show error
            throw new Error('Received raw notebook content instead of interactive URL. Please try again.')
          }
        } else {
          throw new Error('No notebook URL received from server')
        }
      } catch (error) {
        console.error('Error setting up notebook:', error)
        setError(error instanceof Error ? error.message : 'Unknown error occurred')
        setStatus('error')
      } finally {
        setIsLoading(false)
      }
    }
    
    setupNotebook()
  }, [marimoNotebook])

  const handleDownload = async () => {
    try {
      // Since marimoNotebook is now a URL, we need to fetch the content
      if (marimoNotebook && marimoNotebook.startsWith('http')) {
        const response = await fetch(marimoNotebook)
        const content = await response.text()
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'marimo_notebook.py'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        console.error('Cannot download: marimoNotebook is not a valid URL')
      }
    } catch (error) {
      console.error('Error downloading notebook:', error)
    }
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
    
    // Retry - check if we have notebook URL
    setTimeout(() => {
      if (marimoNotebook && marimoNotebook.startsWith('http')) {
        setMarimoUrl(marimoNotebook)
        setStatus('ready')
      } else {
        setError('No valid notebook URL received from server')
        setStatus('error')
      }
      setIsLoading(false)
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
