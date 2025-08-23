import marimo as mo

# Initialize the Marimo app
app = mo.App()

@app.cell
def __():
    """Welcome to Marimo Notebook! 🚀"""
    mo.md("""
    # Marimo Notebook a1b2c3d4 🚀
    
    This notebook is running on Cloudflare Containers.
    Each session gets a unique notebook ID for isolation.
    
    **Notebook ID:** a1b2c3d4
    """)
    return "Notebook a1b2c3d4 is ready!"

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
    mo.md(f"**Slider value:** {slider_value}")
    return slider_value
