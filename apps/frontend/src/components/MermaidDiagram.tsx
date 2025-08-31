import React, { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

interface MermaidDiagramProps {
  diagram: string
  onNodeSelect?: (nodeName: string) => void
  selectedNode?: string | null
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ 
  diagram, 
  onNodeSelect,
  selectedNode 
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isRendered, setIsRendered] = useState(false)

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

      // Clean the diagram text by removing markdown code block syntax
      const cleanDiagram = diagram
        .replace(/^```mermaid\s*/i, '')  // Remove opening ```mermaid
        .replace(/```\s*$/i, '')         // Remove closing ```
        .trim()

      // Render the diagram
      mermaid.render('mermaid-diagram', cleanDiagram).then(({ svg }) => {
        if (containerRef.current) {
          containerRef.current.innerHTML = svg
          setIsRendered(true)
          
          // Add click event listeners to nodes after rendering
          if (onNodeSelect) {
            addNodeClickListeners()
          }
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
  }, [diagram, onNodeSelect])

  // Update selected node styling when selectedNode changes
  useEffect(() => {
    if (isRendered && containerRef.current) {
      updateNodeSelection()
    }
  }, [selectedNode, isRendered])

  const addNodeClickListeners = () => {
    if (!containerRef.current) return

    const svg = containerRef.current.querySelector('svg')
    if (!svg) return

    // Find all node groups and other clickable elements
    const nodes = svg.querySelectorAll('g.node, g[id*="flowchart"], g[id*="graph"], .node, .cluster')
    nodes.forEach(node => {
      // Add cursor pointer style to the node group
      if (node instanceof HTMLElement) {
        node.style.cursor = 'pointer'
      }

      // Also add cursor pointer to all child elements to ensure consistent behavior
      const childElements = node.querySelectorAll('rect, circle, ellipse, polygon, path, text')
      childElements.forEach(child => {
        if (child instanceof HTMLElement) {
          child.style.cursor = 'pointer'
        }
      })

      // Add click event listener
      node.addEventListener('click', (e) => {
        e.stopPropagation()
        
        // Get the node text
        const textElement = node.querySelector('text, .nodeLabel')
        let nodeText = ''
        
        if (textElement) {
          const tspans = textElement.querySelectorAll('tspan')
          if (tspans.length > 0) {
            nodeText = Array.from(tspans)
              .map(t => t.textContent?.trim())
              .filter(Boolean)
              .join(' ')
          } else {
            nodeText = textElement.textContent?.trim() || ''
          }
        }

        if (nodeText && onNodeSelect) {
          onNodeSelect(nodeText)
        }
      })
    })

    // Add click listener to SVG background to deselect
    svg.addEventListener('click', (e) => {
      if (e.target === svg || 
          (e.target instanceof HTMLElement && 
           e.target.tagName === 'rect' && 
           e.target.getAttribute('fill') === 'none')) {
        if (onNodeSelect) {
          onNodeSelect('')
        }
      }
    })
  }

  const updateNodeSelection = () => {
    if (!containerRef.current) return

    const svg = containerRef.current.querySelector('svg')
    if (!svg) return

    // Remove previous selection styling
    const nodes = svg.querySelectorAll('g.node')
    nodes.forEach(node => {
      if (node instanceof HTMLElement) {
        node.classList.remove('node-selected')
      }
    })

    // Add selection styling to current selected node
    if (selectedNode) {
      const nodes = svg.querySelectorAll('g.node')
      nodes.forEach(node => {
        const textElement = node.querySelector('text, .nodeLabel')
        let nodeText = ''
        
        if (textElement) {
          const tspans = textElement.querySelectorAll('tspan')
          if (tspans.length > 0) {
            nodeText = Array.from(tspans)
              .map(t => t.textContent?.trim())
              .filter(Boolean)
              .join(' ')
          } else {
            nodeText = textElement.textContent?.trim() || ''
          }
        }

        if (nodeText === selectedNode && node instanceof HTMLElement) {
          node.classList.add('node-selected')
        }
      })
    }
  }

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
      <style>{`
        .mermaid-container .node-selected {
          filter: drop-shadow(0 0 8px #FFD600);
        }
        .mermaid-container .node-selected rect {
          stroke: #FFD600 !important;
          stroke-width: 3px !important;
        }
        .mermaid-container .node-selected text {
          font-weight: bold !important;
        }
      `}</style>
    </div>
  )
}
