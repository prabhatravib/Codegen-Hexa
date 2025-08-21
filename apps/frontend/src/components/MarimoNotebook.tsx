import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, RefreshCw, PlayCircle, FileText, Folder, Database, Network, Building, FileCode, List, TrendingUp, Code, Key, Edit, HelpCircle, Menu, Settings, X } from 'lucide-react'
import MarimoCell from './MarimoCell'

interface MarimoNotebookProps {
  marimoNotebook: string
  onBack: () => void
}

interface MarimoCellData {
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
  const [cells, setCells] = useState<MarimoCellData[]>([])
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

  const parseMarimoNotebook = (content: string): MarimoCellData[] => {
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
      className="min-h-screen bg-gray-50"
    >
      {/* Professional Marimo Header */}
      <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white p-6 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-8 w-8 h-8 bg-yellow-400 rounded-full blur-sm"></div>
          <div className="absolute top-12 left-16 w-4 h-4 bg-yellow-300 rounded-full blur-sm"></div>
          <div className="absolute top-8 right-12 w-6 h-6 bg-yellow-400 rounded-full blur-sm"></div>
          <div className="absolute top-16 right-8 w-3 h-3 bg-yellow-300 rounded-full blur-sm"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-900" />
              </div>
              <h1 className="text-3xl font-bold">Interactive Marimo Notebook</h1>
            </div>
            <button
              onClick={() => window.open('#', '_blank')}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors border border-white/30"
            >
              Open in New Tab
            </button>
          </div>
        </div>
      </div>

      {/* Main Notebook Interface */}
      <div className="flex min-h-screen">
        {/* Left Sidebar */}
        <div className="w-16 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-6 space-y-6">
          <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-gray-300" />
          </div>
          <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
            <Folder className="w-5 h-5 text-gray-300" />
          </div>
          <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-gray-300" />
          </div>
          <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
            <Network className="w-5 h-5 text-gray-300" />
          </div>
          <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
            <Building className="w-5 h-5 text-gray-300" />
          </div>
          <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
            <FileCode className="w-5 h-5 text-gray-300" />
          </div>
          <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
            <List className="w-5 h-5 text-gray-300" />
          </div>
          <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-gray-300" />
          </div>
          <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
            <Code className="w-5 h-5 text-gray-300" />
          </div>
          <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
            <Key className="w-5 h-5 text-gray-300" />
          </div>
          <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
            <Edit className="w-5 h-5 text-gray-300" />
          </div>
          <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-gray-300" />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white">
          {/* Top Controls */}
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 font-mono">/tmp/marimo_notebook_25e325ae.py</span>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Menu className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Notebook Content */}
          <div className="p-6 space-y-4">
            {/* Action Bar */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    <strong>{cells.length}</strong> cells ready
                  </span>
                  <span className="text-sm text-blue-600">
                    • <strong>{executedCount}</strong> executed
                  </span>
                  <span className="text-sm text-red-600">
                    • <strong>{errorCount}</strong> errors
                  </span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={runAllCells}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Run All Cells</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cells */}
            {cells.map((cell, index) => (
              <MarimoCell
                key={cell.id}
                cell={cell}
                index={index}
                onRun={runCell}
                onToggle={toggleCell}
                onCopy={copyCellCode}
                pyodide={pyodide}
              />
            ))}

            {/* Raw Code Display */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
              <details className="group">
                <summary className="bg-gray-100 px-6 py-4 cursor-pointer hover:bg-gray-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">📝 Raw Notebook Code</h3>
                    <span className="text-gray-500 group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </div>
                </summary>
                <div className="p-6 border-t border-gray-200">
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{marimoNotebook}</code>
                  </pre>
                </div>
              </details>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 How to Use</h3>
              <div className="space-y-2 text-blue-700">
                <p>• <strong>Interactive Mode:</strong> Click "Run Cell" on any cell to execute the Python code</p>
                <p>• <strong>Real-time Output:</strong> See results immediately below each cell</p>
                <p>• <strong>Run All:</strong> Execute all cells in sequence with the "Run All Cells" button</p>
                <p>• <strong>Download:</strong> Save the notebook as a Python file for offline use</p>
                <p>• <strong>Error Handling:</strong> Any errors are clearly displayed with helpful messages</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
