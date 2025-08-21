// services/marimoService.ts
export interface MarimoServer {
  id: string
  port: number
  notebookPath: string
  process: any
  createdAt: Date
  lastAccessed: Date
}

export class MarimoService {
  private servers = new Map<string, MarimoServer>()
  private basePort = 8000

  findFreePort(): number {
    for (let i = 0; i < 100; i++) {
      const port = this.basePort + i
      if (!Array.from(this.servers.values()).some(server => server.port === port)) {
        return port
      }
    }
    throw new Error('No free ports available')
  }

  async launchServer(notebookContent: string, serverId: string): Promise<MarimoServer> {
    const port = this.findFreePort()
    const notebookPath = `/tmp/marimo_${serverId}.py`
    
    const notebook = {
      id: serverId,
      content: notebookContent,
      path: notebookPath,
      port: port
    }
    
    const server: MarimoServer = {
      id: serverId,
      port: port,
      notebookPath: notebookPath,
      process: notebook,
      createdAt: new Date(),
      lastAccessed: new Date()
    }
    
    this.servers.set(serverId, server)
    return server
  }

  getServer(serverId: string): MarimoServer | undefined {
    const server = this.servers.get(serverId)
    if (server) {
      server.lastAccessed = new Date()
    }
    return server
  }

  cleanupExpiredServers(): number {
    const now = new Date()
    const maxAge = 30 * 60 * 1000 // 30 minutes
    let cleanedCount = 0
    
    for (const [id, server] of this.servers.entries()) {
      if (now.getTime() - server.lastAccessed.getTime() > maxAge) {
        this.servers.delete(id)
        cleanedCount++
      }
    }
    
    return cleanedCount
  }

  getActiveServerCount(): number {
    return this.servers.size
  }

  createViewerHTML(notebookContent: string, serverId: string): string {
    // Create a self-contained HTML page that can run Marimo notebooks
    // This uses Pyodide to run Python code in the browser
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interactive Marimo Notebook</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #f8f9fa;
            color: #333;
            line-height: 1.6;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 15px 15px;
            margin-bottom: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 2rem;
            margin-bottom: 8px;
        }
        
        .header p {
            opacity: 0.9;
            font-size: 1rem;
        }
        
        .notebook-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .cell {
            background: white;
            border: 1px solid #e1e5e9;
            border-radius: 12px;
            margin: 20px 0;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            transition: all 0.3s ease;
        }
        
        .cell:hover {
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }
        
        .cell-header {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 15px 20px;
            border-bottom: 1px solid #e1e5e9;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .cell-title {
            font-weight: 600;
            color: #495057;
            font-size: 1.1rem;
        }
        
        .run-button {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,123,255,0.3);
        }
        
        .run-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,123,255,0.4);
        }
        
        .run-button:disabled {
            background: #6c757d;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .cell-code {
            padding: 20px;
            background: #f8f9fa;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
            font-size: 14px;
            line-height: 1.6;
            white-space: pre-wrap;
            overflow-x: auto;
            border-bottom: 1px solid #e1e5e9;
        }
        
        .cell-output {
            padding: 20px;
            background: white;
            min-height: 60px;
            border-radius: 0 0 12px 12px;
        }
        
        .loading {
            color: #6c757d;
            font-style: italic;
            text-align: center;
            padding: 20px;
        }
        
        .error {
            color: #dc3545;
            background: #f8d7da;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #f5c6cb;
            margin: 10px 0;
        }
        
        .success {
            color: #155724;
            background: #d4edda;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #c3e6cb;
            margin: 10px 0;
        }
        
        .output-content {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e9ecef;
            font-family: monospace;
            white-space: pre-wrap;
            overflow-x: auto;
        }
        
        .status-bar {
            background: white;
            border: 1px solid #e1e5e9;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
            color: #6c757d;
        }
        
        .progress-indicator {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 10px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .cell-status {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .status-success {
            color: #28a745;
        }
        
        .status-error {
            color: #dc3545;
        }
        
        .status-pending {
            color: #ffc107;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Interactive Marimo Notebook</h1>
        <p>Run your Python code in real-time with full interactivity</p>
    </div>
    
    <div class="notebook-container" id="notebook">
        <div class="loading">
            <div class="progress-indicator"></div>
            Loading interactive notebook...
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js"></script>
    <script>
        let pyodide;
        let cells = [];
        let executionOrder = [];
        
        // Parse the notebook content into cells
        function parseNotebook(content) {
            const lines = content.split('\\n');
            const cellList = [];
            let currentCell = null;
            let inHeader = false;
            let cellIndex = 0;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const stripped = line.trim();
                
                // Skip Marimo header
                if (stripped.startsWith('# /// script')) {
                    inHeader = true;
                    continue;
                }
                if (inHeader && (stripped === '///' || stripped === '# ///')) {
                    inHeader = false;
                    continue;
                }
                if (inHeader) continue;
                
                // Check for @app.cell decorator
                if (stripped.includes('@app.cell')) {
                    if (currentCell) {
                        cellList.push(currentCell);
                    }
                    currentCell = { 
                        id: \`cell_\${cellIndex}\`,
                        code: '', 
                        output: '', 
                        isRunning: false,
                        hasError: false,
                        status: 'pending'
                    };
                    cellIndex++;
                    continue;
                }
                
                // Add to current cell
                if (currentCell) {
                    currentCell.code += line + '\\n';
                }
            }
            
            if (currentCell) {
                cellList.push(currentCell);
            }
            
            return cellList;
        }
        
        // Render cells
        function renderCells() {
            const container = document.getElementById('notebook');
            container.innerHTML = '';
            
            cells.forEach((cell, index) => {
                const cellElement = document.createElement('div');
                cellElement.className = 'cell';
                cellElement.innerHTML = \`
                    <div class="cell-header">
                        <div class="cell-title">Cell \${index + 1}</div>
                        <div class="cell-status">
                            <span class="status-\${cell.status}">\${getStatusText(cell.status)}</span>
                            <button class="run-button" onclick="runCell(\${index})" \${cell.isRunning ? 'disabled' : ''}>
                                \${cell.isRunning ? 'Running...' : 'Run Cell'}
                            </button>
                        </div>
                    </div>
                    <div class="cell-code">\${cell.code}</div>
                    <div class="cell-output" id="output-\${index}">
                        \${cell.output || 'Click "Run Cell" to execute this code'}
                    </div>
                \`;
                container.appendChild(cellElement);
            });
            
            // Add status bar
            const statusBar = document.createElement('div');
            statusBar.className = 'status-bar';
            statusBar.innerHTML = \`
                <strong>Notebook Status:</strong> \${cells.length} cells ready • 
                \${cells.filter(c => c.status === 'success').length} executed • 
                \${cells.filter(c => c.status === 'error').length} errors
            \`;
            container.appendChild(statusBar);
        }
        
        function getStatusText(status) {
            switch(status) {
                case 'pending': return '⏳ Pending';
                case 'running': return '🔄 Running';
                case 'success': return '✅ Success';
                case 'error': return '❌ Error';
                default: return '⏳ Pending';
            }
        }
        
        // Run a cell
        async function runCell(index) {
            const cell = cells[index];
            if (cell.isRunning) return;
            
            cell.isRunning = true;
            cell.status = 'running';
            const outputElement = document.getElementById(\`output-\${index}\`);
            outputElement.innerHTML = '<div class="loading"><div class="progress-indicator"></div>Executing cell...</div>';
            
            try {
                // Execute the Python code
                const result = await pyodide.runPythonAsync(cell.code);
                
                // Display the result
                if (result !== undefined) {
                    cell.output = String(result);
                    cell.status = 'success';
                    outputElement.innerHTML = \`
                        <div class="success">✅ Cell executed successfully!</div>
                        <div class="output-content">\${cell.output}</div>
                    \`;
                } else {
                    cell.output = 'Cell executed successfully (no output)';
                    cell.status = 'success';
                    outputElement.innerHTML = \`
                        <div class="success">✅ Cell executed successfully!</div>
                        <div class="output-content">\${cell.output}</div>
                    \`;
                }
            } catch (error) {
                cell.output = \`Error: \${error.message}\`;
                cell.status = 'error';
                outputElement.innerHTML = \`
                    <div class="error">❌ Execution failed</div>
                    <div class="output-content">\${cell.output}</div>
                \`;
            } finally {
                cell.isRunning = false;
                renderCells(); // Re-render to update status
            }
        }
        
        // Initialize Pyodide and load notebook
        async function initNotebook() {
            try {
                // Show loading state
                document.getElementById('notebook').innerHTML = \`
                    <div class="loading">
                        <div class="progress-indicator"></div>
                        Initializing Python environment...
                    </div>
                \`;
                
                // Load Pyodide
                pyodide = await loadPyodide();
                
                // Install required packages
                document.getElementById('notebook').innerHTML = \`
                    <div class="loading">
                        <div class="progress-indicator"></div>
                        Installing Python packages...
                    </div>
                \`;
                
                await pyodide.loadPackage(['numpy', 'pandas']);
                
                // Parse and render the notebook
                const notebookContent = \`${notebookContent.replace(/`/g, '\\`')}\`;
                cells = parseNotebook(notebookContent);
                renderCells();
                
            } catch (error) {
                document.getElementById('notebook').innerHTML = \`
                    <div class="error">
                        ❌ Failed to initialize notebook: \${error.message}
                        <br><br>
                        <small>This might be due to network issues or browser compatibility problems.</small>
                    </div>
                \`;
            }
        }
        
        // Start loading when page loads
        window.addEventListener('load', initNotebook);
    </script>
</body>
</html>
    `;
  }
}

// Export singleton instance
export const marimoService = new MarimoService()
