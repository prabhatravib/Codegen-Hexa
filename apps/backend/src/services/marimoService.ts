// Marimo Service for managing notebook operations
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
    <title>Interactive Marimo Notebook</title>
    <script src="https://cdn.jsdelivr.net/npm/@marimo-team/marimo@0.3.0/dist/index.js" crossorigin="anonymous"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@marimo-team/marimo@0.3.0/dist/index.css" crossorigin="anonymous">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f0f0f;
            color: #ffffff;
            overflow: hidden;
        }
        .marimo-container {
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .marimo-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .marimo-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: white;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .marimo-controls {
            display: flex;
            gap: 0.5rem;
        }
        .marimo-btn {
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.9rem;
        }
        .marimo-btn:hover {
            background: rgba(255,255,255,0.3);
            border-color: rgba(255,255,255,0.5);
        }
        .marimo-content {
            flex: 1;
            overflow: hidden;
            position: relative;
        }
        .marimo-notebook {
            width: 100%;
            height: 100%;
            border: none;
        }
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            font-size: 1.2rem;
            color: #888;
        }
        .error {
            color: #ff6b6b;
            text-align: center;
            padding: 2rem;
        }
        .fallback-viewer {
            background: #1f1f1f;
            border: 1px solid #444;
            border-radius: 8px;
            padding: 20px;
            margin: 20px;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            overflow-x: auto;
            max-height: 70vh;
        }
        .success-message {
            color: #4ade80;
            text-align: center;
            padding: 1rem;
            background: rgba(74, 222, 128, 0.1);
            border-radius: 6px;
            margin: 1rem;
        }
        .library-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            flex-direction: column;
            gap: 1rem;
        }
        .library-loading .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #333;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="marimo-container">
        <div class="marimo-header">
            <div class="marimo-title">
                🚀 Interactive Marimo Notebook
            </div>
            <div class="marimo-controls">
                <button class="marimo-btn" onclick="showFallbackViewer()">
                    Show Code
                </button>
                <button class="marimo-btn" onclick="notifyReady()">
                    Ready
                </button>
            </div>
        </div>
        <div class="marimo-content">
            <div id="marimo-app"></div>
            <div id="fallback-viewer" class="fallback-viewer" style="display: none;">
                <h3>📝 Notebook Code</h3>
                <div style="background: #2d2d2d; padding: 15px; border-radius: 4px; margin-top: 10px;">
                    ${notebookContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                </div>
            </div>
            <div id="success-message" class="success-message" style="display: none;">
                ✅ Interactive notebook loaded successfully!
            </div>
        </div>
    </div>

    <script>
        function showFallbackViewer() {
            const app = document.getElementById('marimo-app');
            const viewer = document.getElementById('fallback-viewer');
            if (app.style.display === 'none') {
                app.style.display = 'block';
                viewer.style.display = 'none';
            } else {
                app.style.display = 'none';
                viewer.style.display = 'block';
            }
        }

        function notifyReady() {
            try {
                window.parent.postMessage({
                    type: 'marimo-ready', 
                    serverId: '${serverId}',
                    success: true
                }, '*');
                
                // Show success message
                document.getElementById('success-message').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('success-message').style.display = 'none';
                }, 3000);
            } catch (error) {
                console.error('Error notifying parent:', error);
            }
        }

        // Show loading state while waiting for Marimo
        document.getElementById('marimo-app').innerHTML = \`
            <div class="library-loading">
                <div class="spinner"></div>
                <p>Loading Marimo library...</p>
                <p style="font-size: 0.9rem; color: #888;">This may take a few moments</p>
            </div>
        \`;

        // Wait for Marimo library to load
        function waitForMarimo(maxAttempts = 30, interval = 1000) {
            let attempts = 0;
            
            const checkMarimo = () => {
                attempts++;
                
                if (typeof marimo !== 'undefined') {
                    console.log('Marimo library loaded successfully');
                    initializeMarimo();
                    return;
                }
                
                if (attempts >= maxAttempts) {
                    console.error('Marimo library failed to load after maximum attempts');
                    showLibraryError(attempts, maxAttempts);
                    return;
                }
                
                console.log(\`Waiting for Marimo library... attempt \${attempts}/\${maxAttempts}\`);
                setTimeout(checkMarimo, interval);
            };
            
            checkMarimo();
        }

        // Try alternative CDN if primary fails
        function tryAlternativeCDN() {
            console.log('Trying alternative CDN...');
            
            // Remove existing script and link tags
            const existingScript = document.querySelector('script[src*="marimo"]');
            const existingLink = document.querySelector('link[href*="marimo"]');
            
            if (existingScript) existingScript.remove();
            if (existingLink) existingLink.remove();
            
            // Try alternative CDN
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@marimo-team/marimo@0.3.0/dist/index.js';
            script.crossOrigin = 'anonymous';
            script.onload = () => {
                console.log('Alternative CDN loaded successfully');
                initializeMarimo();
            };
            script.onerror = () => {
                console.error('Alternative CDN also failed');
                showFinalError();
            };
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/@marimo-team/marimo@0.3.0/dist/index.css';
            link.crossOrigin = 'anonymous';
            
            document.head.appendChild(link);
            document.head.appendChild(script);
        }

        function showLibraryError(attempts, maxAttempts) {
            // Try alternative CDN first
            if (attempts < maxAttempts) {
                console.log('Primary CDN failed, trying alternative...');
                tryAlternativeCDN();
                return;
            }
            
            showFinalError();
        }

        function showFinalError() {
            document.getElementById('marimo-app').innerHTML = \`
                <div class="error">
                    <h3>⚠️ Marimo Library Loading Failed</h3>
                    <p>The Marimo library could not be loaded from any CDN.</p>
                    <p>This might be due to:</p>
                    <ul style="text-align: left; max-width: 400px; margin: 1rem auto;">
                        <li>Network connectivity issues</li>
                        <li>CDN access restrictions</li>
                        <li>Browser security settings</li>
                        <li>Corporate firewall blocking CDN access</li>
                    </ul>
                    <p>Showing code viewer instead. You can still download the notebook file.</p>
                    <button onclick="showFallbackViewer()" class="marimo-btn" style="margin-top: 1rem;">
                        View Code
                    </button>
                </div>
            \`;
            
            // Show fallback viewer by default on error
            showFallbackViewer();
            
            try {
                window.parent.postMessage({
                    type: 'marimo-error', 
                    serverId: '${serverId}',
                    error: 'Marimo library failed to load from all CDNs'
                }, '*');
            } catch (postError) {
                console.error('Error posting message:', postError);
            }
        }

        async function initializeMarimo() {
            try {
                console.log('Initializing Marimo app...');
                
                // Create Marimo app with the notebook content
                const app = await marimo.createApp({
                    element: document.getElementById('marimo-app'),
                    notebook: \`${notebookContent.replace(/`/g, '\\`')}\`,
                    config: {
                        theme: 'dark',
                        showCode: true,
                        showOutput: true,
                        autoReload: true
                    }
                });

                console.log('Marimo app created, running...');
                
                // Initialize the app
                await app.run();
                
                console.log('Marimo app running successfully');
                
                // Show success message
                document.getElementById('success-message').style.display = 'block';
                setTimeout(() => {
                    document.getElementById('success-message').style.display = 'none';
                }, 3000);
                
                // Notify parent that notebook is ready
                notifyReady();
                
            } catch (error) {
                console.error('Error initializing Marimo notebook:', error);
                document.getElementById('marimo-app').innerHTML = \`
                    <div class="error">
                        <h3>⚠️ Error Initializing Notebook</h3>
                        <p>\${error.message}</p>
                        <p>Showing code viewer instead. You can still download the notebook file.</p>
                        <button onclick="showFallbackViewer()" class="marimo-btn" style="margin-top: 1rem;">
                            View Code
                        </button>
                    </div>
                \`;
                
                // Show fallback viewer by default on error
                showFallbackViewer();
                
                try {
                    window.parent.postMessage({
                        type: 'marimo-error', 
                        serverId: '${serverId}',
                        error: error.message
                    }, '*');
                } catch (postError) {
                    console.error('Error posting message:', postError);
                }
            }
        }

        // Start waiting for Marimo library
        waitForMarimo();
    </script>
</body>
</html>`;
  }

  generateViewerHTML(notebookContent: string, serverId: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Marimo Notebook Viewer</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #1a1a1a;
            color: #ffffff;
        }
        .notebook-container {
            background: #2d2d2d;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .notebook-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #444;
        }
        .notebook-title {
            font-size: 1.5em;
            font-weight: bold;
            color: #4ade80;
        }
        .notebook-status {
            background: #059669;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
        }
        .code-block {
            background: #1f1f1f;
            border: 1px solid #444;
            border-radius: 4px;
            padding: 15px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            overflow-x: auto;
        }
        .info-box {
            background: #1e40af;
            border: 1px solid #3b82f6;
            border-radius: 4px;
            padding: 15px;
            margin: 10px 0;
        }
        .warning-box {
            background: #92400e;
            border: 1px solid #f59e0b;
            border-radius: 4px;
            padding: 15px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="notebook-container">
        <div class="notebook-header">
            <div class="notebook-title">🚀 Marimo Notebook</div>
            <div class="notebook-status">Ready</div>
        </div>
        
        <div class="info-box">
            <strong>Note:</strong> This is a preview of your Marimo notebook. 
            To run it interactively, use the "Open in New Tab" button in the main interface.
        </div>
        
        <div class="code-block">${notebookContent}</div>
        
        <div class="warning-box">
            <strong>Browser Execution:</strong> This notebook is currently running in your browser using Pyodide. 
            For full Marimo features, consider using the container-based deployment.
        </div>
    </div>
</body>
</html>`;
  }

  getNotebookContent(serverId: string): string | null {
    const notebook = this.notebooks.get(serverId)
    if (notebook && Date.now() - notebook.timestamp < this.EXPIRY_TIME) {
      return notebook.content
    }
    return null
  }

  cleanupExpiredServers(): number {
    const now = Date.now()
    let cleanedCount = 0
    
    for (const [serverId, notebook] of this.notebooks.entries()) {
      if (now - notebook.timestamp > this.EXPIRY_TIME) {
        this.notebooks.delete(serverId)
        cleanedCount++
      }
    }
    
    return cleanedCount
  }

  getActiveServerCount(): number {
    return this.notebooks.size
  }
}

export const marimoService = new MarimoService()
