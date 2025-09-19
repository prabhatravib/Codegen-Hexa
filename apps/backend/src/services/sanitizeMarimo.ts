export function sanitizeMarimo(code: string): string {
  if (!code || code.trim().length === 0) {
    return getSafeFallbackNotebook()
  }

  const hasImport = code.includes('import marimo')
  const hasApp = code.includes('app = mo.App()') || code.includes('app = marimo.App()')

  if (!hasImport || !hasApp) {
    console.warn('Generated notebook missing Marimo structure, adding wrapper')
    return wrapInMarimoStructure(code)
  }

  return code
}

function wrapInMarimoStructure(code: string): string {
  const indented = code
    .split('\n')
    .map(line => '    ' + line)
    .join('\n')

  return `import marimo

__generated_with = "0.9.11"
app = marimo.App()

@app.cell
def __():
    import marimo as mo
    return mo,

@app.cell
def __():
${indented}
    return

if __name__ == "__main__":
    app.run()`
}

function getSafeFallbackNotebook(): string {
  return `import marimo

__generated_with = "0.9.11"
app = marimo.App()

@app.cell
def __():
    import marimo as mo
    mo.md("# Error: Could not generate notebook")
    return mo,

if __name__ == "__main__":
    app.run()`
}
