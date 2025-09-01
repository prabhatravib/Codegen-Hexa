export function sanitizeMarimo(code: string): string {
  let sanitized = code.trim()
  
  // Remove code fences if present
  sanitized = sanitized
    .replace(/^```(?:python)?\n?/i, "")
    .replace(/```$/i, "")
    .trim()
  
  // Ensure proper Marimo header
  if (!sanitized.startsWith("# /// script")) {
    sanitized = "# /// script\n" + sanitized
  }
  
  // Ensure marimo import is present
  if (!/import\s+marimo\s+as\s+mo/.test(sanitized)) {
    sanitized = sanitized.replace(/^# \/\/\/ script\n?/, "$&import marimo as mo\n\n")
  }
  
  // Ensure app instance is created
  if (!/app\s*=\s*mo\.App\s*\(/.test(sanitized)) {
    sanitized = sanitized.replace(/import marimo as mo\n?/, "$&\napp = mo.App()\n\n")
  }
  
  // Ensure proper cell structure
  if (!/@app\.cell/.test(sanitized)) {
    // If no cells found, wrap the entire content in a cell
    const lines = sanitized.split('\n')
    const headerLines = []
    const bodyLines = []
    
    let inHeader = true
    for (const line of lines) {
      if (inHeader && (line.startsWith('#') || line.startsWith('import') || line.startsWith('app ='))) {
        headerLines.push(line)
      } else {
        inHeader = false
        bodyLines.push(line)
      }
    }
    
    const body = bodyLines.join('\n').trim()
    if (body) {
      sanitized = headerLines.join('\n') + '\n\n@app.cell\ndef main():\n    ' + 
        body.split('\n').join('\n    ') + '\n    return None\n'
    }
  }
  
  return sanitized
}
