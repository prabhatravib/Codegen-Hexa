#!/usr/bin/env python3
"""
Test script to verify UUID notebook creation works locally
"""

import uuid
from pathlib import Path

def test_uuid_notebook_creation():
    """Test UUID notebook creation locally"""
    print("🧪 Testing UUID notebook creation...")
    
    # Create a test notebooks directory
    test_dir = Path("test_notebooks")
    test_dir.mkdir(exist_ok=True)
    
    try:
        # Generate UUID and take first 8 characters
        notebook_id = str(uuid.uuid4())[:8]
        notebook_name = f"{notebook_id}_marimo_notebook.py"
        
        # Create the notebook file
        notebook_path = test_dir / notebook_name
        
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
        notebook_path.write_text(content, encoding='utf-8')
        
        print(f"✅ Created notebook: {notebook_name}")
        print(f"📁 File path: {notebook_path.absolute()}")
        
        # Verify it was created
        if notebook_path.exists():
            print(f"✅ Success! Created notebook: {notebook_name}")
            print(f"📁 File size: {notebook_path.stat().st_size} bytes")
            
            # Show first few lines
            with open(notebook_path, 'r', encoding='utf-8') as f:
                content = f.read()
                print(f"📝 First 200 characters:")
                print(content[:200] + "..." if len(content) > 200 else content)
                
            return True
        else:
            print(f"❌ Failed! Notebook {notebook_name} was not created")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Clean up
        import shutil
        if test_dir.exists():
            shutil.rmtree(test_dir)
            print("🧹 Cleaned up test directory")

if __name__ == "__main__":
    success = test_uuid_notebook_creation()
    if success:
        print("\n🎉 UUID notebook creation test PASSED!")
    else:
        print("\n❌ UUID notebook creation test FAILED!")
