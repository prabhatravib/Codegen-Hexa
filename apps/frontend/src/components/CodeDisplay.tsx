import React, { useEffect, useRef } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-rust'
import 'prismjs/themes/prism.css'

interface CodeDisplayProps {
  code: string
  language: string
}

export const CodeDisplay: React.FC<CodeDisplayProps> = ({ code, language }) => {
  const codeRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current)
    }
  }, [code, language])

  const getLanguageClass = (lang: string) => {
    switch (lang) {
      case 'python':
        return 'language-python'
      case 'typescript':
        return 'language-typescript'
      case 'javascript':
        return 'language-javascript'
      case 'go':
        return 'language-go'
      case 'rust':
        return 'language-rust'
      default:
        return 'language-python'
    }
  }

  const getLanguageLabel = (lang: string) => {
    switch (lang) {
      case 'python':
        return '🐍 Python'
      case 'typescript':
        return '📘 TypeScript'
      case 'javascript':
        return '🟨 JavaScript'
      case 'go':
        return '🔵 Go'
      case 'rust':
        return '🦀 Rust'
      default:
        return '🐍 Python'
    }
  }

  return (
    <div className="space-y-4">
      {/* Language Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-foreground">
            {getLanguageLabel(language)}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">
            {code.split('\n').length} lines
          </span>
        </div>
      </div>

      {/* Code Block */}
      <div className="relative">
        <pre className="code-block">
          <code
            ref={codeRef}
            className={getLanguageClass(language)}
          >
            {code}
          </code>
        </pre>
        
        {/* Copy Button */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(code)
            // You could add a toast notification here
          }}
          className="absolute top-2 right-2 p-2 bg-muted hover:bg-muted/80 rounded-md transition-colors"
          title="Copy code"
        >
          <svg
            className="w-4 h-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>
      </div>

      {/* Code Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>Characters: {code.length}</span>
          <span>Words: {code.split(/\s+/).filter(Boolean).length}</span>
        </div>
        <span>Generated with AI</span>
      </div>
    </div>
  )
}
