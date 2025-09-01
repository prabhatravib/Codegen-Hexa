import { PLAIN_PYTHON_GENERATOR_PROMPT } from '../prompts/plainPythonGenerator'

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export async function generatePlainFromFlow(
  prompt: string, 
  mermaid: string, 
  language: string, 
  apiKey: string
): Promise<string> {
  try {
    const systemPrompt = PLAIN_PYTHON_GENERATOR_PROMPT
    const userPrompt = [
      `Requirement:\n${prompt}`,
      `Mermaid flowchart:\n${mermaid}`,
      `Language: ${language}`,
      `Rules: generate plain Python only (no marimo), functions return values.`
    ].join("\n\n")
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${apiKey}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        model: "gpt-4.1", 
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt }, 
          { role: "user", content: userPrompt }
        ] 
      })
    })
    
    if (!response.ok) {
      throw new Error(`LLM ${response.status}`)
    }
    
    const data = await response.json() as OpenAIResponse
    const content = data.choices?.[0]?.message?.content || ""
    
    // Clean up the response by removing code fences
    return content
      .replace(/^```(?:python)?\n?/i, "")
      .replace(/```$/, "")
      .trim()
  } catch (error) {
    console.error('Error generating plain Python from flow:', error)
    throw error
  }
}
