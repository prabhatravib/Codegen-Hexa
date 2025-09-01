# Marimo Generation Pipeline Implementation

## Overview

This implementation creates an AI-powered Marimo notebook generation system that converts Mermaid flowcharts into interactive Marimo notebooks. The system uses a 2-stage approach: generate plain Python from the flowchart, then convert it to Marimo cells.

## Architecture

### AI-Powered Generation Pipeline
- **Files**: 
  - `apps/backend/src/services/llmService.ts` - Generates plain Python from flowchart
  - `apps/backend/src/services/plainToMarimo.ts` - Converts plain Python to Marimo cells
  - `apps/backend/src/services/sanitizeMarimo.ts` - Validates and cleans output
- **Purpose**: AI-powered generation of Marimo notebooks from Mermaid flowcharts
- **Process**: Plain Python → Marimo cells → Sanitization

### Orchestration Layer
- **File**: `apps/backend/src/services/marimoGenerationService.ts`
- **Purpose**: Coordinates the AI generation pipeline
- **Strategy**: Generate plain Python → Convert to Marimo → Sanitize and validate

## Key Components

### Frontend Changes

#### 1. Updated CodeGen Hook (`apps/frontend/src/hooks/useCodeGen.ts`)
- Sends Mermaid diagram directly to backend API
- Handles AI-powered generation requests
- Manages loading states and error handling

### Backend Changes

#### 1. Plain Python Generator (`apps/backend/src/prompts/plainPythonGenerator.ts`)
- New prompt designed for Marimo-friendly plain Python
- No Marimo APIs in generated code
- Functions return values for easy cell conversion

#### 2. LLM Service (`apps/backend/src/services/llmService.ts`)
```typescript
export async function generatePlainFromFlow(
  prompt: string, 
  mermaid: string, 
  language: string, 
  apiKey: string
): Promise<string>
```
- Generates plain Python from flowchart + requirements
- Uses GPT-4.1 for cost efficiency
- Cleans response and removes code fences

#### 3. Plain-to-Marimo Converter (`apps/backend/src/services/plainToMarimo.ts`)
```typescript
export function plainToMarimo(py: string): string
```
- Splits plain Python into logical chunks
- Wraps each chunk in `@app.cell` decorator
- Adds `return None` when missing
- Creates proper Marimo structure

#### 4. Marimo Sanitizer (`apps/backend/src/services/sanitizeMarimo.ts`)
```typescript
export function sanitizeMarimo(code: string): string
```
- Ensures proper Marimo header (`# /// script`)
- Validates marimo import and app instance
- Adds missing cell decorators if needed
- Removes code fences and cleans formatting

#### 5. Generation Service (`apps/backend/src/services/marimoGenerationService.ts`)
```typescript
export async function generateMarimoNotebook(
  prompt: string,
  mermaid: string,
  language: string,
  flowGraph: any, // Backward compatibility
  openaiApiKey: string
): Promise<string>
```
- Orchestrates the AI generation pipeline
- Handles error cases
- Returns validated Marimo notebook

## Pipeline Flow

### Step 1: Frontend Processing
1. User generates Mermaid diagram
2. Frontend sends diagram directly to backend API
3. Backend receives Mermaid text and user requirements

### Step 2: AI Generation
1. **Generate Plain Python**: AI creates plain Python code from flowchart
2. **Convert to Marimo**: Transform plain Python into Marimo cells
3. **Sanitize**: Validate and clean the Marimo structure

### Step 3: Container Integration
1. Generated notebook sent to Marimo container
2. Container writes notebook to file system
3. Marimo server serves the specific notebook
4. Frontend iframe displays the actual generated content

## Benefits

### 1. AI-Powered Generation
- Intelligent interpretation of flowchart logic
- Context-aware code generation
- Handles complex and unusual flow patterns

### 2. Quality Assurance
- Multiple validation layers
- Sanitization ensures proper Marimo structure
- Structured conversion process

### 3. Maintainability
- Clear separation of concerns
- Modular architecture
- Easy to extend and modify

### 4. Reliability
- Consistent 2-stage generation process
- Error handling and validation
- Structured output format

## Usage

### Frontend Integration
```typescript
// Generate Marimo notebook
const response = await fetch('/api/marimo/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    diagram: mermaidText, 
    language: 'python', 
    prompt: userPrompt
  })
})
```

### Backend API
```typescript
// POST /api/marimo/generate
{
  diagram: string,      // Mermaid diagram text
  language: string,     // Target language
  prompt: string,       // User requirements
  flowGraph?: any       // Optional: for backward compatibility
}
```

## Testing

A test file is included at `apps/backend/src/test-pipeline.ts` that validates:
- AI generation pipeline
- Plain Python to Marimo conversion
- Sanitization and validation

Run with:
```bash
cd apps/backend
npx ts-node src/test-pipeline.ts
```

## Future Enhancements

1. **Enhanced AI Prompts**: More sophisticated prompt engineering
2. **Custom Cell Templates**: User-defined cell implementations
3. **Flow Validation**: Validate flow logic before conversion
4. **Performance Optimization**: Cache generated results
5. **Error Recovery**: Better error handling and recovery strategies

## Current Status

✅ **Implemented and Tested**
- AI-powered Marimo generation
- Plain Python to Marimo conversion
- Sanitization and validation
- Frontend integration
- Backend API updates

✅ **Ready for Production**
- All components built successfully
- TypeScript compilation passes
- Pipeline architecture complete
- AI generation pipeline optimized

The implementation successfully addresses the original issue where generic notebooks were being displayed instead of flow-specific content. The AI-powered generation ensures that Marimo notebooks always reflect the actual Mermaid flowchart structure.
