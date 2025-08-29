/**
 * Prompt Manager for managing AI prompt templates
 * Uses external prompt files as the single source of truth
 */

import { 
  FLOWCHART_GENERATOR_PROMPT, 
  CODE_GENERATOR_PROMPT, 
  DEEP_DIVE_PROMPT,
  MARIMO_GENERATOR_PROMPT
} from '../prompts'

interface PromptTemplates {
  flowchart_generator: string
  code_generator: string
  deepdive: string
  marimo_generator: string
}

class PromptManager {
  private prompts: PromptTemplates

  constructor() {
    this.prompts = {
      flowchart_generator: FLOWCHART_GENERATOR_PROMPT,
      code_generator: CODE_GENERATOR_PROMPT,
      deepdive: DEEP_DIVE_PROMPT,
      marimo_generator: MARIMO_GENERATOR_PROMPT
    }
  }

  getPrompt(key: keyof PromptTemplates): string {
    const prompt = this.prompts[key]
    if (!prompt) {
      throw new Error(`Prompt template '${key}' not found.`)
    }
    return prompt
  }

  formatPrompt(key: keyof PromptTemplates, variables: Record<string, string>): string {
    let prompt = this.getPrompt(key)
    
    // Replace variables in the prompt template
    Object.entries(variables).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`{${key}}`, 'g'), value)
    })
    
    return prompt
  }
}

// Export singleton instance
export const promptManager = new PromptManager()
