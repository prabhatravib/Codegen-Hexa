"""
AI Service for Python Workers
Handles OpenAI API calls to generate Marimo notebooks
"""

import openai
import asyncio
from typing import Optional

class AIService:
    def __init__(self):
        """Initialize the AI service."""
        self.client = None
    
    async def generate_marimo_notebook(self, prompt: str, diagram: str, language: str, api_key: str) -> str:
        """Generate a Marimo notebook using OpenAI."""
        try:
            # Initialize OpenAI client
            if not self.client:
                self.client = openai.AsyncOpenAI(api_key=api_key)
            
            # Create the system prompt for Marimo notebook generation
            system_prompt = f"""
You are an expert Python developer specializing in Marimo notebooks. 
Create a complete, executable Marimo notebook based on the user's request.

Requirements:
1. Use proper Marimo syntax with @app.cell decorators
2. Import marimo as mo and create app = mo.App()
3. Break down the logic into logical cells
4. Include proper error handling and documentation
5. Make sure the code is executable and follows Python best practices
6. Use the flowchart/diagram provided to understand the logic flow

Language: {language}
Flowchart/Diagram: {diagram}

Generate a complete Marimo notebook that implements the requested functionality.
"""
            
            # Create the user prompt
            user_prompt = f"""
Please create a Marimo notebook for the following request:

{prompt}

The notebook should:
- Be fully executable
- Follow Marimo best practices
- Include proper cell structure
- Handle errors gracefully
- Be well-documented

Please provide the complete notebook code.
"""
            
            # Call OpenAI API
            response = await self.client.chat.completions.create(
                model="gpt-4.1",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            # Extract the generated notebook
            notebook_content = response.choices[0].message.content.strip()
            
            # Ensure it starts with proper Marimo imports
            if not notebook_content.startswith("# /// script"):
                notebook_content = f"""# /// script
import marimo as mo

app = mo.App()

{notebook_content}

# ///"""
            
            # Ensure it ends with proper Marimo footer
            if not notebook_content.endswith("# ///"):
                notebook_content += "\n\n# ///"
            
            return notebook_content
            
        except Exception as e:
            # Fallback to a basic Marimo notebook if AI generation fails
            return self._create_fallback_notebook(prompt, diagram, language)
    
    def _create_fallback_notebook(self, prompt: str, diagram: str, language: str) -> str:
        """Create a fallback Marimo notebook if AI generation fails."""
        return f"""# /// script
import marimo as mo

app = mo.App()

@app.cell
def setup():
    \"\"\"
    Setup cell for the Marimo notebook.
    \"\"\"
    print("🚀 Marimo Notebook Initialized")
    print(f"Prompt: {prompt}")
    print(f"Language: {language}")
    return "Setup complete"

@app.cell
def process_diagram():
    \"\"\"
    Process the provided diagram/flowchart.
    \"\"\"
    diagram = \"\"\"
{diagram}
    \"\"\"
    print("📊 Processing diagram:")
    print(diagram)
    return diagram

@app.cell
def main_logic():
    \"\"\"
    Main logic cell for the requested functionality.
    \"\"\"
    print("⚡ Executing main logic...")
    print("This is a fallback notebook - AI generation failed")
    print("But you still get a real Marimo notebook!")
    return "Main logic executed"

# ///"""
