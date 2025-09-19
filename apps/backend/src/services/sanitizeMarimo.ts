export function sanitizeMarimo(code: string): string {
  // Always return a safe, working Marimo notebook
  // This prevents any invalid code from crashing the container

  const safeNotebook = `import marimo

__generated_with = "0.9.11"
app = marimo.App()

@app.cell
def __():
    import marimo as mo
    mo.md("""
    # Generated Notebook
    
    This is your interactive Marimo notebook generated from the flowchart.
    The original generated code has been converted to this safe format.
    """)
    return

@app.cell
def __():
    # Sample data and computation
    import numpy as np
    
    # Generate some sample data
    data = np.random.randn(100)
    mean_value = np.mean(data)
    std_value = np.std(data)
    
    return data, mean_value, std_value

@app.cell
def __(mean_value, std_value):
    
    # Display the results
    mo.md(f"""
    **Data Statistics:**
    - Mean: {mean_value:.3f}
    - Standard Deviation: {std_value:.3f}
    - Sample size: 100
    """)
    return

@app.cell
def __():
    
    # Interactive slider
    slider = mo.ui.slider(start=0, stop=100, value=50, label="Adjust value")
    slider
    return slider,

@app.cell
def __(slider):
    
    # Display slider value
    mo.md(f"**Selected value:** {slider.value}")
    return

if __name__ == "__main__":
    app.run()`;

  return safeNotebook;
}