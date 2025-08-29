// Marimo Service - Simple and Clean
interface NotebookData {
  content: string
  timestamp: number
  serverId: string
}

class MarimoService {
  private notebooks: Map<string, NotebookData> = new Map()
  private readonly EXPIRY_TIME = 30 * 60 * 1000 // 30 minutes

  storeNotebook(id: string, content: string): void {
    this.notebooks.set(id, {
      content,
      timestamp: Date.now(),
      serverId: id
    })
    console.log(`Stored notebook ${id} with ${content.length} characters`)
  }

  getNotebook(id: string): NotebookData | null {
    const notebook = this.notebooks.get(id)
    if (notebook && Date.now() - notebook.timestamp < this.EXPIRY_TIME) {
      return notebook
    }
    return null
  }

  generateInteractiveNotebookHTML(notebookContent: string, serverId: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Marimo Notebook</title>
    <script src="https://cdn.jsdelivr.net/npm/@marimo-team/marimo@0.3.0/dist/index.js" crossorigin="anonymous"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@marimo-team/marimo@0.3.0/dist/index.css" crossorigin="anonymous">
    <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; background: #0f0f0f; color: #ffffff; }
        .container { width: 100vw; height: 100vh; display: flex; flex-direction: column; }
        .header { background: #333; padding: 1rem; text-align: center; }
        .content { flex: 1; padding: 2rem; text-align: center; }
        .error { color: #ff6b6b; }
        .success { color: #4caf50; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Marimo Notebook</h1>
        </div>
        
        <div class="content">
            <div id="marimo-app">
                <p>Loading Marimo library...</p>
            </div>
        </div>
    </div>

    <script>
        // Simple: Try to load Marimo, fail fast if it doesn't work
        if (typeof marimo === 'undefined') {
            document.getElementById('marimo-app').innerHTML = \`
                <div class="error">
                    <h2>❌ Marimo Library Failed to Load</h2>
                    <p><strong>Error:</strong> marimo object is undefined</p>
                    <p><strong>CDN:</strong> https://cdn.jsdelivr.net/npm/@marimo-team/marimo@0.3.0/dist/index.js</p>
                    <p><strong>Check:</strong> Browser console for network errors</p>
                </div>
            \`;
        } else {
            // Marimo loaded, try to use it
            try {
                marimo.createApp({
                    element: document.getElementById('marimo-app'),
                    notebook: \`${notebookContent.replace(/`/g, '\\`')}\`
                }).then(app => {
                    app.run();
                    document.getElementById('marimo-app').innerHTML = \`
                        <div class="success">
                            <h2>✅ Marimo Notebook Loaded Successfully!</h2>
                            <p>Your interactive notebook is now running.</p>
                        </div>
                    \`;
                }).catch(error => {
                    document.getElementById('marimo-app').innerHTML = \`
                        <div class="error">
                            <h2>❌ Marimo App Creation Failed</h2>
                            <p><strong>Error:</strong> \${error.message}</p>
                            <p><strong>Stack:</strong> \${error.stack}</p>
                        </div>
                    \`;
                });
            } catch (error) {
                document.getElementById('marimo-app').innerHTML = \`
                    <div class="error">
                        <h2>❌ Marimo Initialization Failed</h2>
                        <p><strong>Error:</strong> \${error.message}</p>
                        <p><strong>Stack:</strong> \${error.stack}</p>
                    </div>
                \`;
            }
        }
    </script>
</body>
</html>`;
  }

  getNotebookContent(id: string): string | null {
    const notebook = this.getNotebook(id)
    return notebook ? notebook.content : null
  }

  generateViewerHTML(notebookContent: string, serverId: string): string {
    return this.generateInteractiveNotebookHTML(notebookContent, serverId)
  }

  cleanupExpiredServers(): void {
    const now = Date.now()
    for (const [id, notebook] of this.notebooks.entries()) {
      if (now - notebook.timestamp > this.EXPIRY_TIME) {
        this.notebooks.delete(id)
        console.log(`Cleaned up expired notebook: ${id}`)
      }
    }
  }

  getActiveServerCount(): number {
    return this.notebooks.size
  }
}

export const marimoService = new MarimoService()
