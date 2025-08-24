# syntax=docker/dockerfile:1.4
FROM python:3.11-slim

WORKDIR /app

# System deps - keep minimal
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential && rm -rf /var/lib/apt/lists/*

# Create requirements.txt inline to avoid copy issues
RUN echo "marimo==0.12.0" > requirements.txt && \
    echo "numpy>=1.24.0" >> requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create notebooks directory
RUN mkdir -p /app/notebooks

# Create the source directory and files inline
RUN mkdir -p /app/src

# Create create_uuid_notebook.py inline
RUN echo '#!/usr/bin/env python3\n\
import uuid\n\
import os\n\
from pathlib import Path\n\
\n\
def create_uuid_notebook():\n\
    """Create a notebook with UUID-based name"""\n\
    notebook_id = str(uuid.uuid4())[:8]\n\
    notebook_name = f"{notebook_id}_marimo_notebook.py"\n\
    \n\
    notebooks_dir = Path("/app/notebooks")\n\
    notebooks_dir.mkdir(exist_ok=True)\n\
    \n\
    notebook_path = notebooks_dir / notebook_name\n\
    \n\
    content = f"""import marimo as mo\n\
\n\
app = mo.App()\n\
\n\
@app.cell\ndef __():\n\
    """Welcome to Marimo Notebook {notebook_id}! 🚀"""\n\
    import marimo as mo\n\
    mo.md(f"""\n\
    # Marimo Notebook {notebook_id} 🚀\n\
    \n\
    This notebook is running on Cloudflare Containers.\n\
    Each session gets a unique notebook ID for isolation.\n\
    \n\
    **Notebook ID:** {notebook_id}\n\
    """)\n\
    return f"Notebook {notebook_id} is ready!"\n\
\n\
@app.cell\ndef __():\n\
    """Sample data generation"""\n\
    import numpy as np\n\
    data = np.random.randn(100)\n\
    return data\n\
\n\
@app.cell\ndef __():\n\
    """Interactive elements"""\n\
    slider = mo.ui.slider(0, 100, value=50, label="Value")\n\
    return slider\n\
\n\
@app.cell\ndef __():\n\
    """Display the slider value"""\n\
    slider_value = slider.value\n\
    mo.md(f"**Slider value:** {{slider_value}}")\n\
    return slider_value\n\
"""\n\
    \n\
    notebook_path.write_text(content)\n\
    print(f"✅ Created notebook: {notebook_name}")\n\
    return notebook_name\n\
\n\
if __name__ == "__main__":\n\
    create_uuid_notebook()\n\
' > /app/src/create_uuid_notebook.py

# Set Marimo environment variables for stability
ENV MARIMO_SKIP_UPDATE_CHECK=1
ENV MARIMO_LOG_LEVEL=INFO
ENV MARIMO_FULL_WIDTH=1
ENV MARIMO_USE_FULL_VIEWPORT=1
ENV MARIMO_EDITOR_WIDTH=100vw
ENV MARIMO_VIEWPORT_WIDTH=100vw

# Expose Marimo default port
EXPOSE 2718

# Create a startup script that generates a unique notebook
RUN echo '#!/bin/bash\n\
echo "Starting Marimo server with unique notebook..."\n\
cd /app\n\
python src/create_uuid_notebook.py\n\
cd /app/notebooks\n\
notebook_file=$(ls *_marimo_notebook.py | head -1)\n\
if [ -z "$notebook_file" ]; then\n\
    echo "ERROR: No notebook file found!"\n\
    exit 1\n\
fi\n\
echo "Starting Marimo with notebook: $notebook_file"\n\
python -m marimo edit --host 0.0.0.0 --port 2718 --headless --no-token "$notebook_file"\n\
' > /app/start.sh && chmod +x /app/start.sh

# Use the startup script
CMD ["/app/start.sh"]
