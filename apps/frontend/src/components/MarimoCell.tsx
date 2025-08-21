import { motion } from 'framer-motion'
import { Play, ChevronDown, ChevronUp, Copy, RefreshCw } from 'lucide-react'

interface MarimoCellProps {
  cell: {
    id: string
    code: string
    output: string
    isRunning: boolean
    hasError: boolean
    status: 'pending' | 'running' | 'success' | 'error'
    collapsed?: boolean
    executionCount?: number
  }
  index: number
  onRun: (index: number) => void
  onToggle: (index: number) => void
  onCopy: (code: string) => void
  pyodide: any
}

export default function MarimoCell({ 
  cell, 
  index, 
  onRun, 
  onToggle, 
  onCopy, 
  pyodide 
}: MarimoCellProps) {
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

  return (
    <motion.div 
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
            onClick={() => onRun(index)}
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
            onClick={() => onCopy(cell.code)}
            className="p-2 hover:bg-gray-600/50 rounded-md transition-colors"
            title="Copy cell code"
          >
            <Copy className="w-4 h-4 text-gray-400" />
          </button>
          
          <button
            onClick={() => onToggle(index)}
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
  )
}
