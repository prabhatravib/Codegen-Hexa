# Marimo Container

This container runs a **real Marimo Python server** that can execute Python code interactively, just like `pitext_codegen` does.

## 🚀 How It Works

1. **Container Server (Port 8000)**: A Python HTTP server that handles API requests and creates notebook files
2. **Marimo Server (Port 2718)**: The actual Marimo server that serves interactive notebooks
3. **Cloudflare Worker**: Stores notebooks in KV and proxies requests to the container

## 📁 Architecture

```
Cloudflare Worker (KV Storage)
           ↓
    Container Server (Port 8000)
           ↓
    Marimo Server (Port 2718)
           ↓
    Interactive Python Notebooks
```

## 🔧 Setup

### 1. Build and Run Container

```bash
# Build the container
docker build -t marimo-container .

# Run the container
docker run -p 8000:8000 -p 2718:2718 marimo-container
```

### 2. Test the Container

```bash
# Test endpoints
python test_container.py

# Or manually test:
curl http://localhost:8000/health
curl http://localhost:8000/
curl "http://localhost:8000/edit?file=print('Hello World')"
```

## 🌐 Endpoints

- `GET /health` - Health check
- `GET /` - Container interface
- `GET /edit?file=content` - Create and serve notebook with content

## 🔄 Workflow

1. **Frontend** generates Marimo notebook content
2. **Cloudflare Worker** saves content to KV storage
3. **Container** receives request with notebook content
4. **Container** creates temporary `.py` file
5. **Marimo server** serves interactive notebook from that file
6. **User** gets real Python execution environment!

## 🎯 Key Benefits

- ✅ **Real Python execution** (not fake HTML)
- ✅ **Interactive notebooks** (like `pitext_codegen`)
- ✅ **Persistent storage** (Cloudflare KV)
- ✅ **Scalable** (container-based)
- ✅ **No CDN dependencies** (everything runs locally)

## 🚨 Important Notes

- This container **cannot run in Cloudflare Workers** (Workers can't run Python servers)
- You need to deploy this container **separately** (e.g., Docker, VPS, etc.)
- The Cloudflare Worker acts as a **proxy** to the container
- The container provides the **actual Marimo functionality**

## 🔗 Integration

The frontend will:
1. Save notebooks to Cloudflare KV via the Worker
2. Get redirected to the container
3. Receive real interactive Marimo notebooks

This gives you the **exact same experience** as `pitext_codegen` - real Python execution in interactive notebooks!
