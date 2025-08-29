import marimo

# Initialize the Marimo app
app = marimo.App()

@app.cell
def __():
    """Welcome to Marimo Notebook!"""
    import marimo as mo

    mo.md("""
    # Marimo Notebook 🚀
    
    This notebook is running on Cloudflare Containers.
    Each session gets a clean workspace for coding.
    """)
    return "Notebook is ready!"

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
