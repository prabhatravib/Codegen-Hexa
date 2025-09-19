export function sanitizeMarimo(code: string): string {
  // Validate that the code has basic Marimo structure
  const hasImport = code.includes('import marimo')
  const hasApp = code.includes('app = marimo.App()') || code.includes('app = mo.App()')
  const hasCell = code.includes('@app.cell')

  // If the generated code looks valid, return it as-is
  if (hasImport && hasApp && hasCell) {
    console.log('Marimo notebook passed validation, using generated code')
    return code
  }

  // If the code doesn't have proper structure, try to fix it
  let sanitized = code

  if (!hasImport) {
    sanitized = 'import marimo\nimport marimo as mo\n\n' + sanitized
  }

  if (!hasApp) {
    const lines = sanitized.split('\n')
    let insertIndex = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.startsWith('import ') || line.startsWith('from ')) {
        insertIndex = i + 1
      }
    }

    lines.splice(insertIndex, 0, '', 'app = marimo.App()', '')
    sanitized = lines.join('\n')
  }

  const repairedHasImport = sanitized.includes('import marimo')
  const repairedHasApp = sanitized.includes('app = marimo.App()') || sanitized.includes('app = mo.App()')
  const repairedHasCell = sanitized.includes('@app.cell')

  if (repairedHasImport && repairedHasApp && repairedHasCell) {
    console.log('Marimo notebook fixed and validated')
    return sanitized
  }

  console.warn('Generated code failed validation, using safe fallback notebook')
  console.log('Failed code preview:', sanitized.substring(0, 500))

  const safeNotebook = `import marimo

__generated_with = "0.9.11"
app = marimo.App()

@app.cell
def __():
    import marimo as mo
    mo.md("""
    # Generated Notebook
    
    This is your interactive Marimo notebook generated from the flowchart.
    The original generated code failed validation and this is a safe fallback.
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
    import marimo as mo
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
    import marimo as mo
    # Interactive slider
    slider = mo.ui.slider(start=0, stop=100, value=50, label="Adjust value")
    slider
    return slider,

@app.cell
def __(slider):
    import marimo as mo
    # Display slider value
    mo.md(f"**Selected value:** {slider.value}")
    return

if __name__ == "__main__":
    app.run()`

  return safeNotebook
}