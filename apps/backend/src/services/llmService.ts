import { PLAIN_PYTHON_GENERATOR_PROMPT } from '../prompts/plainPythonGenerator'

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

interface FlowGraphNode {
  id: string
  label?: string
  type?: string
}

interface FlowGraphEdge {
  from: string
  to: string
  label?: string
}

interface FlowGraph {
  nodes: FlowGraphNode[]
  edges?: FlowGraphEdge[]
}

const MAX_FLOW_SUMMARY_LENGTH = 4000
const MAX_PATH_DEPTH = 25
const MAX_RECORDED_PATHS = 12
const MAX_GUIDANCE_COMMENTS = 10

export async function generatePlainFromFlow(
  prompt: string,
  mermaid: string,
  language: string,
  apiKey: string,
  flowGraph?: FlowGraph | null
): Promise<string> {
  try {
    const flowSummary = summarizeFlowGraph(flowGraph)
    const userPromptSections = [
      `Requirement:\n${prompt}`,
      `Mermaid flowchart:\n${mermaid}`,
      `Language: ${language}`,
      'Rules: generate plain Python only (no marimo), functions return values.'
    ]

    if (flowSummary) {
      userPromptSections.push('Flowchart breakdown:\n' + flowSummary)
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1',
        temperature: 0.3,
        messages: [
          { role: 'system', content: PLAIN_PYTHON_GENERATOR_PROMPT },
          { role: 'user', content: userPromptSections.join('\n\n') }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`LLM ${response.status}`)
    }

    const data = await response.json() as OpenAIResponse
    let content = data.choices?.[0]?.message?.content || ''

    content = content
      .replace(/^```(?:python)?\n?/i, '')
      .replace(/```$/, '')
      .trim()

    if (!content) {
      throw new Error('Received empty response from LLM')
    }

    if (flowGraph) {
      content = ensureFlowCoverage(content, flowGraph)
    }

    return content
  } catch (error) {
    console.error('Error generating plain Python from flow:', error)
    throw error
  }
}

function summarizeFlowGraph(flowGraph?: FlowGraph | null): string | null {
  if (!flowGraph || !Array.isArray(flowGraph.nodes) || flowGraph.nodes.length === 0) {
    return null
  }

  const nodeLines = flowGraph.nodes.slice(0, 50).map((node, index) => {
    const pieces: string[] = []
    const label = node.label?.trim()
    const nodeLabel = label || node.id

    pieces.push(`${index + 1}. ${nodeLabel}`)

    if (node.type) {
      pieces.push(`[${node.type}]`)
    }

    if (!label || label !== node.id) {
      pieces.push(`(id: ${node.id})`)
    }

    return pieces.join(' ')
  })

  const edges = Array.isArray(flowGraph.edges) ? flowGraph.edges : []
  const edgeLines = edges.slice(0, 100).map(edge => {
    const parts = [`${edge.from} -> ${edge.to}`]
    if (edge.label) {
      parts.push(`(${edge.label.trim()})`)
    }
    return `- ${parts.join(' ')}`.trim()
  })

  const pathLines = buildFlowPaths(flowGraph).map((path, index) => `${index + 1}. ${path}`)

  const sections: string[] = ['Nodes:', ...nodeLines]

  if (edgeLines.length) {
    sections.push('', 'Edges:', ...edgeLines)
  }

  if (pathLines.length) {
    sections.push('', 'Representative paths:', ...pathLines)
  }

  const summary = sections.join('\n').trim()
  if (!summary) {
    return null
  }

  return summary.length > MAX_FLOW_SUMMARY_LENGTH
    ? summary.slice(0, MAX_FLOW_SUMMARY_LENGTH) + '\n...'
    : summary
}

function buildFlowPaths(flowGraph: FlowGraph): string[] {
  if (!Array.isArray(flowGraph.nodes) || flowGraph.nodes.length === 0) {
    return []
  }

  const nodeMap = new Map(flowGraph.nodes.map(node => [node.id, node]))
  const adjacency = new Map<string, FlowGraphEdge[]>()
  const indegree = new Map<string, number>()

  for (const node of flowGraph.nodes) {
    adjacency.set(node.id, [])
    indegree.set(node.id, 0)
  }

  for (const edge of flowGraph.edges || []) {
    if (!adjacency.has(edge.from)) {
      adjacency.set(edge.from, [])
    }
    adjacency.get(edge.from)!.push(edge)
    indegree.set(edge.to, (indegree.get(edge.to) || 0) + 1)
  }

  const startNodes = flowGraph.nodes.filter(node => {
    if (node.type) {
      return node.type.toLowerCase() === 'start'
    }
    return (indegree.get(node.id) || 0) === 0
  })

  const traversalStarts = startNodes.length > 0 ? startNodes : [flowGraph.nodes[0]]
  const paths: string[] = []

  const describeNode = (nodeId: string): string => {
    const node = nodeMap.get(nodeId)
    if (!node) {
      return nodeId
    }
    if (node.type) {
      return `${node.label || node.id} [${node.type}]`
    }
    return node.label || node.id
  }

  const dfs = (currentId: string, currentPath: string, visited: Set<string>, depth: number) => {
    if (paths.length >= MAX_RECORDED_PATHS) {
      return
    }
    if (depth > MAX_PATH_DEPTH) {
      paths.push(currentPath + ' ...')
      return
    }

    const nextEdges = adjacency.get(currentId) || []
    if (nextEdges.length === 0) {
      paths.push(currentPath)
      return
    }

    for (const edge of nextEdges) {
      const edgeLabel = edge.label ? ` --[${edge.label.trim()}]--> ` : ' --> '
      const nextNodeLabel = describeNode(edge.to)

      if (visited.has(edge.to)) {
        paths.push(currentPath + edgeLabel + nextNodeLabel + ' (loop)')
        continue
      }

      const nextVisited = new Set(visited)
      nextVisited.add(edge.to)
      dfs(edge.to, currentPath + edgeLabel + nextNodeLabel, nextVisited, depth + 1)
      if (paths.length >= MAX_RECORDED_PATHS) {
        return
      }
    }
  }

  for (const start of traversalStarts) {
    dfs(start.id, describeNode(start.id), new Set([start.id]), 0)
    if (paths.length >= MAX_RECORDED_PATHS) {
      break
    }
  }

  return paths
}

function ensureFlowCoverage(code: string, flowGraph: FlowGraph): string {
  if (!Array.isArray(flowGraph.nodes) || flowGraph.nodes.length === 0) {
    return code
  }

  const missingLabels = flowGraph.nodes
    .map(node => node.label?.trim())
    .filter((label): label is string => Boolean(label && !new RegExp(escapeRegExp(label), 'i').test(code)))

  if (missingLabels.length === 0) {
    return code
  }

  const limitedLabels = missingLabels.slice(0, MAX_GUIDANCE_COMMENTS)
  console.warn('LLM output missing flow steps, adding guidance comments for:', limitedLabels)

  const guidance = limitedLabels
    .map(label => `# TODO: Implement flow step "${label}" exactly as described in the diagram.`)
    .join('\n')

  return `${guidance}\n\n${code}`
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
