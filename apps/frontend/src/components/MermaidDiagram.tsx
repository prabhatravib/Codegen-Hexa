import React, { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

interface MermaidDiagramProps {
  diagram: string
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ diagram }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current && diagram) {
      // Initialize Mermaid
      mermaid.initialize({
        startOnLoad: true,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'monospace',
        fontSize: 14,
        flowchart: {
          useMaxWidth: true,
          htmlLabels: true,
          curve: 'basis'
        }
      })

      // Clear previous content
      containerRef.current.innerHTML = ''

      // Render the diagram
      mermaid.render('mermaid-diagram', diagram).then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg
        }
      }).catch((error) => {
        console.error('Error rendering Mermaid diagram:', error)
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="text-center p-8 text-red-600">
              <p>Error rendering diagram</p>
              <p class="text-sm text-gray-500 mt-2">${error.message}</p>
            </div>
          `
        }
      })
    }
  }, [diagram])

  if (!diagram) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>No diagram to display</p>
      </div>
    )
  }

  return (
    <div className="mermaid-container">
      <div 
        ref={containerRef} 
        className="w-full overflow-auto"
        style={{ minHeight: '300px' }}
      />
    </div>
  )
}
