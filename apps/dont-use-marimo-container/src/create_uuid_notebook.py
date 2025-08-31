#!/usr/bin/env python3
import uuid
import os
from pathlib import Path

def create_uuid_notebook():
    """Create a notebook with UUID-based name"""
    # Generate UUID and take first 8 characters
    notebook_id = str(uuid.uuid4())[:8]
    notebook_name = f"{notebook_id}_marimo_notebook.py"
    
    # Create notebooks directory
    notebooks_dir = Path("/app/notebooks")
    notebooks_dir.mkdir(exist_ok=True)
    
    # Create the notebook file
    notebook_path = notebooks_dir / notebook_name
    
    # Notebook content
    content = f'''import marimo as mo

# Initialize the Marimo app
app = mo.App()

@app.cell
def __():
    """Welcome to Marimo Notebook {notebook_id}! 🚀"""
    import marimo as mo
    mo.md(f"""
    # Marimo Notebook {notebook_id} 🚀
    
    This notebook is running on Cloudflare Containers.
    Each session gets a unique notebook ID for isolation.
    
    **Notebook ID:** {notebook_id}
    """)
    return f"Notebook {notebook_id} is ready!"

@app.cell
def __():
    """Sample data generation"""
    import numpy as np
    data = np.random.randn(100)
    return data

@app.cell
def __():
    """Interactive elements"""
    slider = mo.ui.slider(0, 100, value=50, label="Value")
    return slider

@app.cell
def __():
    """Display the slider value"""
    slider_value = slider.value
    mo.md(f"**Slider value:** {{slider_value}}")
    return slider_value
'''
    
    # Write the notebook
    notebook_path.write_text(content)
    
    print(f"✅ Created notebook: {notebook_name}")
    print(f"🌐 Access directly at: /{notebook_name}")
    
    return notebook_name

if __name__ == "__main__":
    create_uuid_notebook()
