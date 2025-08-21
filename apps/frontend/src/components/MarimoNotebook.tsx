import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, ArrowLeft, RefreshCw, Play, ChevronDown, ChevronUp, Copy, PlayCircle } from 'lucide-react'

interface MarimoNotebookProps {
  marimoNotebook: string
  onBack: () => void
}

interface MarimoCell {
  id: string
  code: string
  output: string
  isRunning: boolean
  hasError: boolean
  status: 'pending' | 'running' | 'success' | 'error'
  collapsed?: boolean
  executionCount?: number
}

export default function MarimoNotebook({ marimoNotebook, onBack }: MarimoNotebookProps) {
  const [cells, setCells] = useState<MarimoCell[]>([])
  const [pyodide, setPyodide] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [executedCount, setExecutedCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)

  // Parse the notebook content into cells
  useEffect(() => {
    if (marimoNotebook) {
      const parsedCells = parseMarimoNotebook(marimoNotebook)
      setCells(parsedCells)
    }
  }, [marimoNotebook])

  // Initialize Pyodide
  useEffect(() => {
    const initPyodide = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Load Pyodide from CDN
        const pyodideInstance = await (window as any).loadPyodide()
        
        // Install required packages
        await pyodideInstance.loadPackage(['numpy', 'pandas'])
        
        setPyodide(pyodideInstance)
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize Python environment')
        setIsLoading(false)
      }
    }

    initPyodide()
  }, [])

  const parseMarimoNotebook = (content: string): MarimoCell[] => {
    // Split by @app.cell() decorators
    const cellPattern = /@app\.cell\(\)[\s\S]*?(?=@app\.cell\(\)|$)/g
    const matches = content.match(cellPattern) || []
    
    return matches.map((cellCode, index) => {
      // Extract the function name and content
      const functionMatch = cellCode.match(/def\s+(\w+)\([^)]*\):([\s\S]*?)(?=return|$)/)
      
      let cleanCode = cellCode
      if (functionMatch) {
        // Clean up the function body
        cleanCode = functionMatch[2]
          .trim()
          .replace(/^\s{4}/gm, '') // Remove indentation
          .replace(/"""[\s\S]*?"""/g, '') // Remove docstrings
          .trim()
      }

      return {
        id: `cell_${index}`,
        code: cleanCode || cellCode,
        output: '',
        isRunning: false,
        hasError: false,
        status: 'pending',
        collapsed: false,
        executionCount: undefined
      }
    })
  }

  const runCell = async (index: number) => {
    if (!pyodide || cells[index].isRunning) return
    
    const updatedCells = [...cells]
    updatedCells[index].isRunning = true
    updatedCells[index].status = 'running'
    updatedCells[index].output = ''
    updatedCells[index].hasError = false
    setCells(updatedCells)
    
    try {
      const result = await pyodide.runPythonAsync(cells[index].code)
      
      if (result !== undefined) {
        updatedCells[index].output = String(result)
        updatedCells[index].status = 'success'
        updatedCells[index].executionCount = (updatedCells[index].executionCount || 0) + 1
        setExecutedCount(prev => prev + 1)
      } else {
        updatedCells[index].output = 'Cell executed successfully (no output)'
        updatedCells[index].status = 'success'
        updatedCells[index].executionCount = (updatedCells[index].executionCount || 0) + 1
        setExecutedCount(prev => prev + 1)
      }
    } catch (err) {
      updatedCells[index].output = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      updatedCells[index].status = 'error'
      updatedCells[index].hasError = true
      setErrorCount(prev => prev + 1)
    } finally {
      updatedCells[index].isRunning = false
      setCells([...updatedCells])
    }
  }

  const runAllCells = () => {
    cells.forEach((_, index) => {
      setTimeout(() => runCell(index), index * 300)
    })
  }

  const toggleCell = (index: number) => {
    setCells(prevCells =>
      prevCells.map((cell, i) =>
        i === index
          ? { ...cell, collapsed: !cell.collapsed }
          : cell
      )
    )
  }

  const copyCellCode = (code: string) => {
    navigator.clipboard.writeText(code)
  }

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

  const getStatusText = (status: string) => {
    switch(status) {
      case 'pending': return '⏳ Pending'
      case 'running': return '🔄 Running'
      case 'success': return '✅ Success'
      case 'error': return '❌ Error'
      default: return '⏳ Pending'
    }
  }

  const getStatusColor = (status: string): string => {
    switch(status) {
      case 'pending': return 'text-yellow-400'
      case 'running': return 'text-blue-400'
      case 'success': return 'text-green-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 text-center">
          <div className="text-yellow-400 mb-4">
            <RefreshCw className="w-12 h-12 mx-auto animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-yellow-300 mb-2">
            Initializing Python Environment...
          </h3>
          <p className="text-yellow-200">
            Loading Pyodide and installing Python packages. This may take a few moments.
          </p>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-6 text-center">
          <div className="text-red-400 mb-4">
            <RefreshCw className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-red-300 mb-2">
            Failed to Initialize Python Environment
          </h3>
          <p className="text-red-200 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">🚀 Interactive Marimo Notebook</h2>
            <p className="text-gray-300">Your Python notebook is ready to run interactively!</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={runAllCells}
              className="btn-primary flex items-center space-x-2"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Run All Cells</span>
            </button>
            <button
              onClick={handleDownload}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={onBack}
              className="btn-outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Flowchart
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center space-x-6 text-sm">
          <span className="text-green-400">
            <strong>{cells.length}</strong> cells ready
          </span>
          <span className="text-blue-400">
            • <strong>{executedCount}</strong> executed
          </span>
          <span className="text-red-400">
            • <strong>{errorCount}</strong> errors
          </span>
        </div>
      </div>

      {/* Interactive Notebook */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white p-4">
          <h3 className="text-lg font-semibold">🎯 Interactive Notebook</h3>
          <p className="text-sm opacity-90">Run your Python code in real-time with full interactivity</p>
        </div>
        
        <div className="p-6 space-y-4">
          {cells.map((cell, index) => (
            <motion.div 
              key={cell.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-600/50 rounded-lg overflow-hidden bg-gray-900/30 hover:bg-gray-900/50 transition-all duration-200"
            >
              <div className="bg-gray-800/50 px-4 py-3 border-b border-gray-600/50 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-sm text-gray-300">cell_{index}</span>
                  {cell.executionCount && (
                    <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                      [{cell.executionCount}]
                    </span>
                  )}
                  <span className={`text-sm ${getStatusColor(cell.status)}`}>
                    {getStatusText(cell.status)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => runCell(index)}
                    disabled={cell.isRunning || !pyodide}
                    className={`p-2 rounded-md text-sm font-medium transition-colors ${
                      cell.isRunning || !pyodide
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    title="Run cell"
                  >
                    {cell.isRunning ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => copyCellCode(cell.code)}
                    className="p-2 hover:bg-gray-600/50 rounded-md transition-colors"
                    title="Copy cell code"
                  >
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                  
                  <button
                    onClick={() => toggleCell(index)}
                    className="p-2 hover:bg-gray-600/50 rounded-md transition-colors"
                    title={cell.collapsed ? "Expand" : "Collapse"}
                  >
                    {cell.collapsed ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              
              {!cell.collapsed && (
                <>
                  <div className="bg-gray-900 text-green-400 p-4 font-mono text-sm">
                    <pre className="whitespace-pre-wrap">{cell.code}</pre>
                  </div>
                  
                  <div className="p-4 bg-gray-800/30">
                    {cell.output ? (
                      <div className={`p-3 rounded-md ${
                        cell.hasError ? 'bg-red-900/20 text-red-300 border border-red-700/50' : 'bg-green-900/20 text-green-300 border border-green-700/50'
                      }`}>
                        <pre className="whitespace-pre-wrap text-sm">{cell.output}</pre>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm text-center py-4">
                        Click "Run Cell" to execute this code
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Raw Code Display */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden">
        <details className="group">
          <summary className="bg-gray-700/50 px-6 py-4 cursor-pointer hover:bg-gray-700/70 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">📝 Raw Notebook Code</h3>
              <span className="text-gray-400 group-open:rotate-180 transition-transform">
                ▼
              </span>
            </div>
          </summary>
          <div className="p-6 border-t border-gray-600/50">
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{marimoNotebook}</code>
            </pre>
          </div>
        </details>
      </div>

      {/* Instructions */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-300 mb-3">💡 How to Use</h3>
        <div className="space-y-2 text-blue-200">
          <p>• <strong>Interactive Mode:</strong> Click "Run Cell" on any cell to execute the Python code</p>
          <p>• <strong>Real-time Output:</strong> See results immediately below each cell</p>
          <p>• <strong>Run All:</strong> Execute all cells in sequence with the "Run All Cells" button</p>
          <p>• <strong>Download:</strong> Save the notebook as a Python file for offline use</p>
          <p>• <strong>Error Handling:</strong> Any errors are clearly displayed with helpful messages</p>
        </div>
      </div>
    </motion.div>
  )
}
