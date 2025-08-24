#!/usr/bin/env python3
import uuid
import os
from pathlib import Path

def generate_uuid_notebook():
    """Generate a random UUID and create a notebook with that name"""
    
    # Generate a random UUID and take first 8 characters
    notebook_id = str(uuid.uuid4())[:8]
    notebook_name = f"{notebook_id}_notebook.py"
    
    print(f"Generated UUID: {notebook_id}")
    print(f"Notebook name: {notebook_name}")
    
    # Create notebooks directory if it doesn't exist
    notebooks_dir = Path("notebooks")
    notebooks_dir.mkdir(exist_ok=True)
    
    # Create the notebook file
    notebook_path = notebooks_dir / notebook_name
    
    # Notebook content (without emojis to avoid encoding issues)
    content = f'''import marimo as mo

# Initialize the Marimo app
app = mo.App()

@app.cell
def __():
    """Welcome to Marimo Notebook!"""
    mo.md(f"""
    # Marimo Notebook {notebook_id}
    
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
    
    # Write the notebook with UTF-8 encoding
    notebook_path.write_text(content, encoding='utf-8')
    print(f"Created notebook: {notebook_path}")
    
    # Update the Dockerfile with the new notebook name
    dockerfile_path = Path("Dockerfile")
    if dockerfile_path.exists():
        # Read current Dockerfile
        with open(dockerfile_path, 'r', encoding='utf-8') as f:
            dockerfile_content = f.read()
        
        # Replace the notebook path in the CMD line
        old_cmd = 'CMD ["python", "-m", "marimo", "edit", "--host", "0.0.0.0", "--port", "2718", "--headless", "--no-token", "--skip-update-check", "/app/notebooks/a1b2c3d4_marimo_notebook.py"]'
        new_cmd = f'CMD ["python", "-m", "marimo", "edit", "--host", "0.0.0.0", "--port", "2718", "--headless", "--no-token", "--skip-update-check", "/app/notebooks/{notebook_name}"]'
        
        dockerfile_content = dockerfile_content.replace(old_cmd, new_cmd)
        
        # Write updated Dockerfile
        with open(dockerfile_path, 'w', encoding='utf-8') as f:
            f.write(dockerfile_content)
        
        print(f"Updated Dockerfile to use: {notebook_name}")
    
    # Update the redirect HTML to point to the new notebook
    html_path = Path("public/index.html")
    if html_path.exists():
        with open(html_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # Replace the notebook URL in the HTML
        old_url = '/a1b2c3d4_marimo_notebook.py'
        new_url = f'/{notebook_name}'
        
        html_content = html_content.replace(old_url, new_url)
        
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"Updated HTML redirect to: {new_url}")
    
    print(f"Successfully created notebook with UUID: {notebook_id}")
    print(f"Notebook file: {notebook_path}")
    print(f"Dockerfile updated")
    print(f"HTML redirect updated")
    print(f"Ready to deploy with: wrangler deploy")
    
    return notebook_id, notebook_name

if __name__ == "__main__":
    generate_uuid_notebook()
