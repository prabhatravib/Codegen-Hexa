// services/aiService.ts
import { promptManager } from '../utils/promptManager'

// AI-powered Marimo notebook generation function
export async function generateMarimoNotebookWithAI(prompt: string, diagram: string, language: string, apiKey: string): Promise<string> {
  const systemPrompt = promptManager.formatPrompt('marimo_generator', { language })
  const userPrompt = `Create a Marimo notebook for the following requirement in ${language}:

User Request: ${prompt}

Flowchart:
\`\`\`mermaid
${diagram}
\`\`\`

Generate a complete, interactive Marimo notebook that implements the logic shown in the flowchart. Make it educational and user-friendly.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const errorData = await response.json() as { error: { message: string } };
      throw new Error(`OpenAI API error: ${errorData.error.message}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating Marimo notebook with AI:', error);
    throw error;
  }
}

// AI-powered flowchart generation function
export async function generateFlowchartWithAI(prompt: string, language: string, apiKey: string): Promise<string> {
  const systemPrompt = promptManager.getPrompt('flowchart_generator')
  const userPrompt = `Create a Mermaid flowchart for the following requirement in ${language}:

${prompt}

Generate a flowchart that shows the logical flow of this system.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const errorData = await response.json() as { error: { message: string } };
      throw new Error(`OpenAI API error: ${errorData.error.message}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating flowchart with AI:', error);
    throw error;
  }
}

// AI-powered code generation function
export async function generateCodeWithAI(diagram: string, language: string, apiKey: string): Promise<string> {
  const systemPrompt = promptManager.getPrompt('code_generator')
  const userPrompt = `Generate ${language} code based on this Mermaid flowchart:

\`\`\`
${diagram}
\`\`\`

Create a complete, runnable ${language} program that implements the logic shown in the flowchart.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json() as { error: { message: string } };
      throw new Error(`OpenAI API error: ${errorData.error.message}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating code with AI:', error);
    throw error;
  }
}

// Helper function to generate deep dive explanation for a flowchart node
export async function generateDeepDiveWithAI(nodeName: string, question: string, originalPrompt: string, flowchart: string, apiKey: string): Promise<string> {
  const prompt = promptManager.formatPrompt('deepdive', {
    node_name: nodeName,
    question: question,
    original_prompt: originalPrompt,
    flowchart: flowchart
  })

  // Debug logging
  console.log('Generated Deep Dive Prompt:', {
    prompt_length: prompt.length,
    node_name: nodeName,
    question: question,
    original_prompt_length: originalPrompt ? originalPrompt.length : 0,
    flowchart_length: flowchart ? flowchart.length : 0
  })

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json() as { error: { message: string } };
      throw new Error(`OpenAI API error: ${errorData.error.message}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    const result = data.choices[0].message.content;
    
    // Debug logging
    console.log('OpenAI Response received:', {
      response_length: result ? result.length : 0,
      model: 'gpt-4'
    })
    
    return result;
  } catch (error) {
    console.error('Error generating deep dive with AI:', error);
    throw error;
  }
}
