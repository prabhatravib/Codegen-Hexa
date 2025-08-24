#!/usr/bin/env python3
import uuid
import os
import json
from pathlib import Path

def create_llm_notebook(notebook_content: str, notebook_id: str = None):
    """Create a notebook from LLM-generated content"""
    
    # Use provided ID or generate new one
    if not notebook_id:
        notebook_id = str(uuid.uuid4())[:8]
    
    notebook_name = f"{notebook_id}_marimo_notebook.py"
    
    # Create notebooks directory
    notebooks_dir = Path("/app/notebooks")
    notebooks_dir.mkdir(exist_ok=True)
    
    # Create the notebook file
    notebook_path = notebooks_dir / notebook_name
    
    # Write the LLM-generated content
    notebook_path.write_text(notebook_content, encoding='utf-8')
    
    print(f"✅ Created LLM notebook: {notebook_name}")
    print(f"🌐 Access directly at: /{notebook_name}")
    print(f"📝 Content length: {len(notebook_content)} characters")
    
    return notebook_name, notebook_id

def create_from_json(json_data: str):
    """Create notebook from JSON data containing notebook content"""
    try:
        data = json.loads(json_data)
        notebook_content = data.get('notebookContent', '')
        notebook_id = data.get('serverId', None)
        
        if not notebook_content:
            raise ValueError("No notebook content provided")
        
        return create_llm_notebook(notebook_content, notebook_id)
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {e}")
        return None, None
    except Exception as e:
        print(f"❌ Error creating notebook: {e}")
        return None, None

if __name__ == "__main__":
    # Test with sample content
    test_content = '''import marimo as mo

# Initialize the Marimo app
app = mo.App()

@app.cell
def __():
    """Test LLM-generated notebook"""
    mo.md("# Test Notebook")
    return "Hello from LLM-generated notebook!"

@app.cell
def __():
    """Sample data"""
    import numpy as np
    data = np.random.randn(50)
    return data
'''
    
    create_llm_notebook(test_content, "test123")
