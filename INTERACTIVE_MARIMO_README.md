# Interactive Marimo Notebook System

This document explains how the interactive Marimo notebook system works in the Codegen-Hexa project.

## Overview

The system generates interactive Marimo notebooks that can run directly in the browser, providing a rich, interactive coding experience similar to Jupyter notebooks but with Marimo's modern interface.

## How It Works

### 1. Notebook Generation
- User provides a prompt and flowchart
- AI service generates Python code using the Marimo framework
- Code is validated and formatted to ensure it's a valid Marimo notebook

### 2. Interactive Notebook Creation
- Backend creates an HTML page with embedded Marimo library
- Notebook content is injected into the HTML
- Marimo library initializes and runs the notebook in the browser

### 3. User Experience
- Users see an interactive notebook interface directly in the app
- Code cells can be executed and modified
- Output is displayed in real-time
- Fallback code viewer is available if interactive mode fails

## Key Components

### Backend Services

#### `marimoService.ts`
- `generateInteractiveNotebookHTML()`: Creates HTML with embedded Marimo
- `generateViewerHTML()`: Creates fallback viewer HTML
- Manages notebook lifecycle and cleanup

#### `aiService.ts`
- `generateMarimoNotebookWithAI()`: Uses OpenAI to generate notebook code
- Validates and fixes generated content
- Ensures proper Marimo notebook structure

#### `marimo.ts` Routes
- `/create-viewer`: Creates interactive notebook HTML
- `/generate`: Generates notebook content using AI
- Handles notebook creation and management

### Frontend Components

#### `MarimoNotebook.tsx`
- Displays interactive notebook in iframe
- Handles loading states and error handling
- Provides download and external view options
- Manages communication with embedded notebook

## Marimo Notebook Structure

Generated notebooks follow this structure:

```python
# /// script
import marimo as mo

app = mo.App()

@app.cell
def __():
    # Setup and imports
    import pandas as pd
    import numpy as np
    print("🚀 Marimo Notebook Initialized")
    return

@app.cell
def load_data():
    # Load and prepare data
    data = pd.DataFrame({'x': [1, 2, 3], 'y': [4, 5, 6]})
    print(f"Data loaded: {len(data)} rows")
    return data

@app.cell
def process_data(data):
    # Process the data
    result = data * 2
    print("Data processed successfully")
    return result
```

## Features

### Interactive Execution
- Code cells execute in real-time
- Output is displayed immediately
- Variables persist between cells
- Error handling and debugging support

### Fallback Support
- If Marimo library fails to load, shows code viewer
- Users can still download the notebook file
- Graceful degradation for different environments

### User Controls
- Download notebook as Python file
- Open in new tab for full-screen experience
- Toggle between interactive and code view
- Retry functionality if loading fails

## Technical Details

### Marimo Library
- Loaded from CDN (unpkg.com)
- Version: 0.3.0
- Supports dark theme and modern UI

### Browser Compatibility
- Modern browsers with ES6+ support
- WebAssembly support for Python execution
- Iframe sandboxing for security

### Error Handling
- Network failure detection
- Library loading validation
- Graceful fallback to code viewer
- User-friendly error messages

## Usage

### For Users
1. Generate a flowchart using the app
2. Click "Generate Marimo Notebook"
3. Wait for AI to generate the notebook
4. Interact with the notebook directly in the app
5. Download or open in new tab as needed

### For Developers
1. Ensure Marimo library CDN is accessible
2. Handle iframe communication properly
3. Implement proper error boundaries
4. Test with various notebook content types

## Troubleshooting

### Common Issues

#### Notebook Won't Load
- Check browser console for errors
- Verify Marimo library CDN access
- Try refreshing the page
- Use fallback code viewer

#### Interactive Features Not Working
- Ensure JavaScript is enabled
- Check iframe sandbox permissions
- Verify Marimo library loaded correctly
- Try opening in new tab

#### Code Generation Issues
- Check OpenAI API key configuration
- Verify prompt templates are correct
- Review generated code structure
- Use retry functionality

### Debug Mode
- Check browser developer tools
- Monitor network requests
- Review console logs
- Test with simple notebook content

## Future Improvements

### Planned Features
- Local Marimo server support
- Custom notebook templates
- Collaborative editing
- Version control integration
- Export to various formats

### Performance Optimizations
- Lazy loading of Marimo library
- Notebook content caching
- Progressive enhancement
- Better error recovery

## Security Considerations

### Iframe Sandboxing
- Restricted permissions for security
- No access to parent window by default
- Controlled communication channels
- Input validation and sanitization

### Content Security
- Validate generated code structure
- Sanitize HTML output
- Prevent code injection attacks
- Monitor for malicious content

## Dependencies

### Backend
- Node.js/TypeScript
- Hono framework
- OpenAI API integration
- HTML generation utilities

### Frontend
- React/TypeScript
- Framer Motion for animations
- Lucide React for icons
- Iframe communication handling

### External
- Marimo library (CDN)
- OpenAI GPT-4 API
- Cloudflare Workers deployment

## Deployment

### Cloudflare Workers
- Backend API endpoints
- HTML generation and serving
- CORS configuration
- Error handling and logging

### Frontend
- Vite build system
- Static asset optimization
- Environment configuration
- Production deployment

## Support

For issues or questions:
1. Check this documentation
2. Review browser console logs
3. Test with simple examples
4. Check network connectivity
5. Verify API configurations

---

This system provides a modern, interactive way to work with AI-generated Python notebooks, making data science and coding more accessible and engaging.
