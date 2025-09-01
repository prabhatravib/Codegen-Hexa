interface FlowNode {
  id: string
  label: string
  type?: string
}

interface FlowEdge {
  from: string
  to: string
  label?: string
}

interface FlowGraph {
  nodes: FlowNode[]
  edges: FlowEdge[]
}

export function parseMermaidToFlowGraph(mermaidText: string): FlowGraph {
  const nodes: FlowNode[] = []
  const edges: FlowEdge[] = []
  
  // Clean the mermaid text
  const cleanText = mermaidText
    .replace(/^```mermaid\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  
  // Split into lines
  const lines = cleanText.split('\n')
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // Skip empty lines, comments, and configuration
    if (!trimmedLine || 
        trimmedLine.startsWith('%') || 
        trimmedLine.startsWith('%%') ||
        trimmedLine.startsWith('classDef') ||
        trimmedLine.startsWith('class ') ||
        trimmedLine.startsWith('subgraph') ||
        trimmedLine.startsWith('end') ||
        trimmedLine.startsWith('direction')) {
      continue
    }
    
    // Parse node definitions (e.g., "Start[Start Process]")
    const nodeMatch = trimmedLine.match(/^(\w+)\[([^\]]+)\]/)
    if (nodeMatch) {
      const [, id, label] = nodeMatch
      nodes.push({
        id,
        label: label.trim(),
        type: determineNodeType(label)
      })
      continue
    }
    
    // Parse decision nodes (e.g., "Decision{Is valid?}")
    const decisionMatch = trimmedLine.match(/^(\w+)\{([^}]+)\}/)
    if (decisionMatch) {
      const [, id, label] = decisionMatch
      nodes.push({
        id,
        label: label.trim(),
        type: 'decision'
      })
      continue
    }
    
    // Parse edge definitions (e.g., "Start --> Process")
    const edgeMatch = trimmedLine.match(/^(\w+)\s*-->\s*(\w+)/)
    if (edgeMatch) {
      const [, from, to] = edgeMatch
      edges.push({ from, to })
      continue
    }
    
    // Parse labeled edges (e.g., "Process -->|Yes| Next")
    const labeledEdgeMatch = trimmedLine.match(/^(\w+)\s*-->\s*\|([^|]+)\|\s*(\w+)/)
    if (labeledEdgeMatch) {
      const [, from, label, to] = labeledEdgeMatch
      edges.push({ from, to, label: label.trim() })
      continue
    }
  }
  
  return { nodes, edges }
}

function determineNodeType(label: string): string {
  const lowerLabel = label.toLowerCase()
  
  if (lowerLabel.includes('start') || lowerLabel.includes('begin')) {
    return 'start'
  }
  if (lowerLabel.includes('end') || lowerLabel.includes('finish')) {
    return 'end'
  }
  if (lowerLabel.includes('input') || lowerLabel.includes('get') || lowerLabel.includes('enter')) {
    return 'input'
  }
  if (lowerLabel.includes('validate') || lowerLabel.includes('check')) {
    return 'validation'
  }
  if (lowerLabel.includes('process') || lowerLabel.includes('calculate') || lowerLabel.includes('add') || lowerLabel.includes('multiply')) {
    return 'process'
  }
  if (lowerLabel.includes('display') || lowerLabel.includes('show') || lowerLabel.includes('output')) {
    return 'output'
  }
  
  return 'generic'
}
