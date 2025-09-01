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

export function flowToMarimo(
  nodes: FlowNode[],
  edges: FlowEdge[],
  language: string = 'python'
): string {
  const header = `# /// script
import marimo as mo

app = mo.App()

`

  // Helper function to create a cell
  const createCell = (name: string, args: string[], body: string, returnValue?: string) => {
    const argsStr = args.length > 0 ? args.join(", ") : ""
    const returnStmt = returnValue ? `    return ${returnValue}` : ""
    
    return `@app.cell
def ${name}(${argsStr}):
    ${body}${returnStmt ? '\n' + returnStmt : ''}`
  }

  // Map node types to Marimo implementations
  const nodeImplementations = new Map<string, string>()
  
  nodes.forEach((node, index) => {
    const nodeId = node.id
    const nodeLabel = node.label.toLowerCase()
    
    // Determine node type based on label and type
    if (nodeLabel.includes('input') || nodeLabel.includes('get') || nodeLabel.includes('enter')) {
      // Input nodes
      const inputName = `input_${index + 1}`
      const body = `# ${node.label}
${inputName} = mo.ui.number(0, label="${node.label}")
return ${inputName}`
      nodeImplementations.set(nodeId, createCell(`get_${index + 1}`, [], body, inputName))
    }
    else if (nodeLabel.includes('validate') || nodeLabel.includes('check')) {
      // Validation nodes
      const body = `# ${node.label}
# Add validation logic here
is_valid = True
return is_valid`
      nodeImplementations.set(nodeId, createCell(`validate_${index + 1}`, ['input_value'], body, 'is_valid'))
    }
    else if (nodeLabel.includes('process') || nodeLabel.includes('calculate') || nodeLabel.includes('add') || nodeLabel.includes('multiply')) {
      // Process nodes
      const body = `# ${node.label}
# Add processing logic here
result = input_value  # Replace with actual logic
return result`
      nodeImplementations.set(nodeId, createCell(`process_${index + 1}`, ['input_value'], body, 'result'))
    }
    else if (nodeLabel.includes('display') || nodeLabel.includes('show') || nodeLabel.includes('output')) {
      // Output nodes
      const body = `# ${node.label}
mo.md(f"**{node.label}: {input_value}**").callout(kind="success")`
      nodeImplementations.set(nodeId, createCell(`display_${index + 1}`, ['input_value'], body))
    }
    else if (nodeLabel.includes('start') || nodeLabel.includes('begin')) {
      // Start nodes
      const body = `# ${node.label}
mo.md("# " + "${node.label}")
mo.md("This notebook implements the flowchart logic.")`
      nodeImplementations.set(nodeId, createCell(`start_${index + 1}`, [], body))
    }
    else if (nodeLabel.includes('end') || nodeLabel.includes('finish')) {
      // End nodes
      const body = `# ${node.label}
mo.md("## Process Complete")
mo.md("The flowchart execution has finished.")`
      nodeImplementations.set(nodeId, createCell(`end_${index + 1}`, [], body))
    }
    else {
      // Default generic node
      const body = `# ${node.label}
# Generic node implementation
# Add specific logic based on the node purpose
pass`
      nodeImplementations.set(nodeId, createCell(`node_${index + 1}`, [], body, 'None'))
    }
  })

  // Create cells in order
  const cells = nodes.map(node => nodeImplementations.get(node.id) || '').filter(Boolean)
  
  // Add a main execution cell that connects the flow
  const mainCell = `@app.cell
def main_execution():
    # Main execution flow
    # This cell orchestrates the flow based on the edges
    mo.md("## Flow Execution")
    
    # Execute nodes in order (simplified)
    ${nodes.map((node, index) => `result_${index + 1} = ${node.id.replace(/[^a-zA-Z0-9]/g, '_')}()`).join('\n    ')}
    
    mo.md("### Flow completed successfully!")`

  return header + cells.join('\n\n') + '\n\n' + mainCell + '\n'
}
