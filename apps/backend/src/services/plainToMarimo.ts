export function plainToMarimo(py: string): string {
  const header = `import marimo

__generated_with = "0.9.11"
app = marimo.App()

`

  const chunks = py.split(/\n{2,}/).filter(chunk => chunk.trim())

  const cells = chunks.map(chunk => {
    const body = chunk
      .split('\n')
      .map(line => '    ' + line)
      .join('\n')

    return `@app.cell
def __():
${body}
    return`
  })

  cells.unshift(`@app.cell
def __():
    import marimo as mo
    return mo,`)

  return (
    header +
    cells.join('\n\n') +
    '\n\nif __name__ == "__main__":\n    app.run()'
  )
}
