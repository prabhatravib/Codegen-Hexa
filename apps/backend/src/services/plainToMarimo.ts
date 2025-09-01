export function plainToMarimo(py: string): string {
  const header = "# /// script\nimport marimo as mo\n\napp = mo.App()\n\n"
  
  // Split the code into logical chunks (separated by double newlines)
  const chunks = py.split(/\n{2,}/)
  
  const cells = chunks.map((chunk, i) => {
    // Skip empty chunks
    if (!chunk.trim()) return null
    
    // Indent the body lines
    const body = chunk.split("\n").map(line => line ? "    " + line : "").join("\n")
    
    // Check if the chunk already has a return statement
    const needsReturn = !/\breturn\s+/.test(chunk) && /\S/.test(chunk)
    
    // Create the cell structure
    const cellLines = [
      "@app.cell",
      `def cell_${i + 1}():`,
      body || "    # Default cell",
      needsReturn ? "    return None" : ""
    ]
    
    return cellLines.join("\n").trimEnd()
  }).filter(Boolean) // Remove null entries
  
  return header + cells.join("\n\n") + "\n"
}
