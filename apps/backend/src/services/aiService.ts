// AI Service for generating various content using OpenAI API
import { promptManager } from '../utils/promptManager'

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export async function generateFlowchartWithAI(
  prompt: string, 
  language: string, 
  openaiApiKey: string
): Promise<string> {
  try {
    const systemPrompt = promptManager.formatPrompt('flowchart_generator', { language })
    const userPrompt = `Generate a flowchart for: ${prompt}`
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json() as OpenAIResponse
    return data.choices[0]?.message?.content || 'Failed to generate flowchart'
  } catch (error) {
    console.error('Error generating flowchart with AI:', error)
    throw error
  }
}

export async function generateCodeWithAI(
  diagram: string, 
  language: string, 
  openaiApiKey: string
): Promise<string> {
  try {
    const systemPrompt = promptManager.formatPrompt('code_generator', { language })
    const userPrompt = `Generate ${language} code based on this flowchart: ${diagram}`
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json() as OpenAIResponse
    return data.choices[0]?.message?.content || 'Failed to generate code'
  } catch (error) {
    console.error('Error generating code with AI:', error)
    throw error
  }
}

export async function generateDeepDiveWithAI(
  nodeName: string, 
  question: string, 
  originalPrompt: string, 
  flowchart: string, 
  openaiApiKey: string
): Promise<string> {
  try {
    const systemPrompt = promptManager.getPrompt('deepdive')
    const userPrompt = `Node: ${nodeName}\nQuestion: ${question}\nOriginal Prompt: ${originalPrompt}\nFlowchart: ${flowchart}`
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json() as OpenAIResponse
    return data.choices[0]?.message?.content || 'Failed to generate deep dive explanation'
  } catch (error) {
    console.error('Error generating deep dive with AI:', error)
    throw error
  }
}

export async function generateMarimoNotebookWithAI(
  prompt: string, 
  diagram: string, 
  language: string, 
  openaiApiKey: string
): Promise<string> {
  try {
    const systemPrompt = promptManager.formatPrompt('marimo_generator', { language })
    const userPrompt = `Generate a Marimo notebook for: ${prompt}\nBased on this flowchart: ${diagram}`
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json() as OpenAIResponse
    const notebookContent = data.choices[0]?.message?.content || 'Failed to generate Marimo notebook'
    
    // Validate that the generated content looks like a Marimo notebook
    if (!notebookContent.includes('# /// script') || !notebookContent.includes('import marimo')) {
      console.warn('Generated content may not be a valid Marimo notebook, attempting to fix...')
      
      // Try to fix common issues
      let fixedContent = notebookContent
      if (!fixedContent.includes('# /// script')) {
        fixedContent = '# /// script\n' + fixedContent
      }
      if (!fixedContent.includes('import marimo')) {
        fixedContent = fixedContent.replace(/^/, 'import marimo as mo\n\napp = mo.App()\n\n')
      }
      
      return fixedContent
    }
    
    return notebookContent
  } catch (error) {
    console.error('Error generating Marimo notebook with AI:', error)
    throw error
  }
}
