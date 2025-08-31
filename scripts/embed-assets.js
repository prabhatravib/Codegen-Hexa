import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the built assets
const distDir = path.join(__dirname, '../dist');
const workerFile = path.join(__dirname, '../src/worker-voice/index.ts');

// Find the actual CSS and JS files
const assetsDir = path.join(distDir, 'assets');
const files = fs.readdirSync(assetsDir);

const cssFile = files.find(f => f.endsWith('.css'));
const jsFile = 'main.js'; // This is in the root dist directory

if (!cssFile) {
  console.error('❌ Could not find CSS file in dist/assets');
  console.log('Available files:', files);
  process.exit(1);
}

console.log('📁 Found CSS file:', cssFile);
console.log('📁 Using JS file:', jsFile);

// Read the main CSS and JS files
const mainCSS = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');
const mainJS = fs.readFileSync(path.join(distDir, jsFile), 'utf8');

// Read the worker file
let workerCode = fs.readFileSync(workerFile, 'utf8');

// Create the embedded assets
const embeddedAssets = `
// Embedded React App Assets
const EMBEDDED_CSS = \`${mainCSS.replace(/`/g, '\\`')}\`;
const EMBEDDED_JS = \`${mainJS.replace(/`/g, '\\`')}\`;

// Embedded HTML template
const EMBEDDED_HTML = \`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Codegen Hexa - Voice Code Generation</title>
    <style>\${EMBEDDED_CSS}</style>
</head>
<body>
    <div id="root"></div>
    <script type="module">\${EMBEDDED_JS}</script>
</body>
</html>\`;
`;

// Replace the static file handler with embedded assets
const newStaticHandler = `
// Serve static files for the React app
app.get('*', async (c) => {
  try {
    const url = new URL(c.req.url)
    let filePath = url.pathname
    
    // Default to index.html for root path
    if (filePath === '/' || filePath === '') {
      filePath = '/index.html'
    }
    
    // Serve the embedded React app
    if (filePath === '/index.html' || filePath === '/') {
      return new Response(EMBEDDED_HTML, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache'
        }
      })
    }
    
    // For other paths, return 404
    return c.text('Not found', 404)
  } catch (error) {
    console.error('Error in static file handler:', error)
    return c.text('Internal server error', 500)
  }
})
`;

// Insert the embedded assets after the imports
const importEndIndex = workerCode.indexOf('export default app');
workerCode = workerCode.substring(0, importEndIndex) + embeddedAssets + '\n' + newStaticHandler + '\n' + workerCode.substring(importEndIndex);

// Write the updated worker file
fs.writeFileSync(workerFile, workerCode);

console.log('✅ React app assets embedded into worker successfully!');
console.log('📁 CSS size:', (mainCSS.length / 1024).toFixed(2), 'KB');
console.log('📁 JS size:', (mainJS.length / 1024).toFixed(2), 'KB');
console.log('🚀 Worker ready for deployment!');
