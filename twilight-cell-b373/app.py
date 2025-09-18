import marimo as mo

# Initialize the Marimo app
app = mo.App()

@app.cell
def __():
    mo.md("""
    # Marimo Notebook 🚀
    
    Welcome to your Marimo notebook running on Cloudflare Containers!
    This is a fresh session with a clean workspace.
    """)
    return "Notebook is ready!"

@app.cell
def __():
    import numpy as np
    data = np.random.randn(100)
    return data

@app.cell
def __():
    slider = mo.ui.slider(0, 100, value=50, label="Value")
    return slider

@app.cell
def __(slider):
    slider_value = slider.value
    mo.md(f"**Slider value:** {slider_value}")
    return slider_value

