import { generatePlainFromFlow } from './llmService'
import { plainToMarimo } from './plainToMarimo'
import { sanitizeMarimo } from './sanitizeMarimo'

export async function generateMarimoNotebook(
  prompt: string,
  mermaid: string,
  language: string,
  flowGraph: any, // Keep for backward compatibility but not used
  openaiApiKey: string
): Promise<string> {
  try {
    // AI-powered generation only
    console.log('Using AI-powered Marimo generation')
    const plainPython = await generatePlainFromFlow(prompt, mermaid, language, openaiApiKey)
    const marimoFromPlain = plainToMarimo(plainPython)
    const sanitizedMarimo = sanitizeMarimo(marimoFromPlain)
    
    return sanitizedMarimo
  } catch (error) {
    console.error('Error in AI-powered Marimo generation:', error)
    throw error // Let the calling code handle the error
  }
}
