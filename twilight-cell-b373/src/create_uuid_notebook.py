#!/usr/bin/env python3
import uuid
import os
from pathlib import Path

def create_uuid_notebook():
    """Create a notebook with UUID-based name"""
    try:
        # Generate UUID and take first 8 characters
        notebook_id = str(uuid.uuid4())[:8]
        notebook_name = f"{notebook_id}_marimo_notebook.py"
        
        print(f"🔧 Generated UUID: {notebook_id}")
        print(f"📝 Notebook name: {notebook_name}")
        
        # Create notebooks directory
        notebooks_dir = Path("/app/notebooks")
        notebooks_dir.mkdir(exist_ok=True)
        print(f"✅ Created notebooks directory: {notebooks_dir}")
        
        # Create the notebook file
        notebook_path = notebooks_dir / notebook_name
        
        # Notebook content
        content = f'''import marimo as mo

# Initialize the Marimo app
app = mo.App()

@app.cell
def __():
    """Welcome to Marimo Notebook {notebook_id}! 🚀"""
    mo.md(f"""
    # Marimo Notebook {notebook_id} 🚀
    
    This notebook is running on Cloudflare Containers.
    Each session gets a unique notebook ID for isolation.
    
    **Notebook ID:** {notebook_id}
    **Status:** ✅ Ready and running!
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

@app.cell
def __():
    """System information"""
    import sys
    import platform
    mo.md(f"""
    ## System Information
    
    - **Python Version:** {sys.version}
    - **Platform:** {platform.platform()}
    - **Notebook ID:** {notebook_id}
    """)
    return "System info displayed above"
'''
        
        # Write the notebook
        notebook_path.write_text(content, encoding='utf-8')
        
        print(f"✅ Created notebook: {notebook_name}")
        print(f"📁 File path: {notebook_path}")
        print(f"📊 File size: {notebook_path.stat().st_size} bytes")
        print(f"🌐 Access directly at: /{notebook_name}")
        
        # Verify the file was created
        if notebook_path.exists():
            print(f"✅ Success! Notebook {notebook_name} was created successfully")
            return notebook_name
        else:
            print(f"❌ Error: Notebook file was not created!")
            return None
            
    except Exception as e:
        print(f"❌ Error creating notebook: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    result = create_uuid_notebook()
    if result:
        print(f"🎉 Notebook creation successful: {result}")
    else:
        print("❌ Notebook creation failed!")
        exit(1)
