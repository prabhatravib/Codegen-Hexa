# Marimo Notebook Creation for Cloudflare Containers

This project now creates a fresh Marimo notebook on each session, ensuring each user gets a clean workspace.

## 🚀 Features

- **Fresh Notebooks**: Each container session creates a new notebook
- **Timestamped Names**: Notebooks are named with timestamps (e.g., `notebook_20241201_143022.py`)
- **Direct Access**: No landing page - users go straight to the notebook editor
- **Starter Template**: Each notebook includes helpful starter code and examples

## 📁 File Structure

```
twilight-cell-b373/
├── src/
│   ├── start_marimo.py      # Main startup script with notebook creation
│   └── index.ts             # Cloudflare Worker entry point
├── Dockerfile               # Updated to use custom startup script
├── requirements.txt         # Python dependencies
└── test_notebook_creation.py # Local testing script
```

## 🔧 How It Works

### 1. Notebook Creation
The `create_new_notebook()` function:
- Generates unique notebook names using timestamps
- Creates a starter template with helpful code examples
- Places notebooks in the `/app/notebooks` directory

### 2. Marimo Server Startup
The `start_marimo_server()` function:
- Starts Marimo with the specific notebook file (not directory)
- Uses `--headless` mode for container deployment
- Configures proper networking for Cloudflare Containers

### 3. Session Management
- Each container restart creates a new notebook
- Notebooks are timestamped for uniqueness
- Users get a fresh workspace every time

## 🚀 Deployment

### Deploy to Cloudflare
```bash
cd twilight-cell-b373
wrangler deploy
```

### Local Testing
```bash
# Test notebook creation locally
python test_notebook_creation.py

# Build and test Docker container
docker build -t marimo-test .
docker run -p 8080:8080 marimo-test
```

## ⚙️ Configuration Options

### Timestamped vs Fixed Names
In `src/start_marimo.py`, you can control notebook naming:

```python
# For unique notebooks per session (default)
notebook_file = create_new_notebook(notebooks_dir, use_timestamp=True)

# For fixed name (overwrites on each restart)
notebook_file = create_new_notebook(notebooks_dir, use_timestamp=False)
```

### Custom Starter Templates
Modify the `starter_content` in `create_new_notebook()` to customize the initial notebook content.

## 🎯 Benefits

1. **Fresh Start**: Each session is clean and ready for new work
2. **No Landing Page**: Users go directly to coding
3. **Unique Notebooks**: Timestamped names prevent conflicts
4. **Starter Code**: Helpful examples get users started quickly
5. **Container Ready**: Optimized for Cloudflare Containers deployment

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**: Ensure port 8080 is available
2. **Permission Errors**: Check Docker container permissions
3. **Notebook Not Loading**: Verify the startup script is running correctly

### Debug Mode
The startup script includes detailed logging. Check container logs for troubleshooting information.

## 📝 Customization

### Adding More Dependencies
Update `requirements.txt` to include additional Python packages.

### Custom Notebook Templates
Modify the `starter_content` variable in `create_new_notebook()` to include your preferred starter code.

### Multiple Template Options
You can extend the system to choose from multiple templates based on user preferences or URL parameters.

## 🚀 Next Steps

Consider these enhancements:
- URL-based template selection
- Notebook persistence between sessions
- Multiple pre-configured templates
- User preference storage
- Collaborative notebook sharing

---

**Note**: This implementation ensures each Cloudflare Container session provides a fresh, ready-to-use Marimo notebook environment.
