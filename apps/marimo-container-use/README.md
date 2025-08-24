# Marimo Notebook on Cloudflare Containers

This project deploys a Marimo notebook environment on Cloudflare Containers with **unique UUID-based notebooks** for each session.

## 🚀 Features

- **Unique Notebooks**: Each deployment creates a notebook with a unique UUID name (e.g., `a1b2c3d4_marimo_notebook.py`)
- **Fresh Sessions**: Every container restart generates a new notebook with a unique identifier
- **Cloudflare Containers**: Deployed using Cloudflare Workers with container support
- **Interactive Python**: Full Marimo notebook environment with numpy and interactive widgets

## 🔧 How It Works

### 1. UUID Notebook Creation
- On container startup, `src/create_uuid_notebook.py` generates a unique 8-character UUID
- Creates a notebook file named `{uuid}_marimo_notebook.py`
- Each notebook includes starter code with the unique ID displayed

### 2. Container Startup
- Dockerfile runs a startup script that creates the unique notebook
- Marimo server starts with the newly created notebook file
- Users access the notebook directly through the container

### 3. Session Isolation
- Each deployment gets a completely unique notebook
- No conflicts between different sessions
- Clean workspace for every user

## 📁 Project Structure

```
twilight-cell-b373/
├── src/
│   ├── create_uuid_notebook.py  # Creates unique UUID notebooks
│   ├── start_marimo.py          # Startup script for containers
│   └── index.ts                 # Cloudflare Worker entry point
├── Dockerfile                   # Container definition with UUID logic
├── requirements.txt             # Python dependencies
├── wrangler.jsonc              # Cloudflare Workers configuration
└── public/index.html           # Landing page with redirect
```

## 🚀 Deployment

### Deploy to Cloudflare
```bash
cd twilight-cell-b373
wrangler deploy
```

### Local Testing
```bash
# Test UUID notebook creation
python test_uuid_creation.py

# Build and test Docker container
docker build -t marimo-uuid-test .
docker run -p 2718:2718 marimo-uuid-test
```

## 🎯 Notebook Features

Each unique notebook includes:
- **Welcome Message**: Displays the unique notebook ID
- **Sample Data**: NumPy random data generation
- **Interactive Widgets**: Slider controls
- **Real-time Updates**: Dynamic content display

## ⚙️ Configuration

### Customizing Notebook Content
Edit `src/create_uuid_notebook.py` to modify the starter template:
- Change imports and dependencies
- Add more interactive elements
- Customize the welcome message

### UUID Length
Modify the UUID generation in `create_uuid_notebook()`:
```python
# Change from 8 to any length you prefer
notebook_id = str(uuid.uuid4())[:8]  # 8 characters
```

## 🔍 Troubleshooting

### Common Issues
1. **Notebook Not Found**: Check container logs for UUID creation
2. **Import Errors**: Verify all dependencies in `requirements.txt`
3. **Port Conflicts**: Ensure port 2718 is available

### Debug Mode
The startup script includes detailed logging. Check container logs:
```bash
wrangler tail
```

## 📝 Example Output

After deployment, you'll see:
- **Notebook Name**: `a1b2c3d4_marimo_notebook.py`
- **Welcome Message**: "Marimo Notebook a1b2c3d4 🚀"
- **Unique ID Display**: Shows the notebook's unique identifier

## 🚀 Next Steps

Consider these enhancements:
- Notebook persistence between sessions
- Multiple template options
- User preference storage
- Collaborative features
- Custom domain support

---

**Note**: This implementation ensures each Cloudflare Container session provides a fresh, uniquely identified Marimo notebook environment.
