# syntax=docker/dockerfile:1.4
FROM python:3.11-slim

# Fast, reproducible installs with uv (optional but good)
# COPY --from=ghcr.io/astral-sh/uv:0.4.20 /uv /bin/uv
# ENV UV_SYSTEM_PYTHON=1
WORKDIR /app

# System deps - keep minimal
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential && rm -rf /var/lib/apt/lists/*

# App files
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the startup script and other code
COPY . /app

# Create notebooks directory
RUN mkdir -p /app/notebooks

# Create a simple notebook file using echo (simpler than cat)
RUN echo 'import marimo as mo' > /app/notebooks/d6367d62_notebook.py && \
    echo '' >> /app/notebooks/d6367d62_notebook.py && \
    echo '# Initialize the Marimo app' >> /app/notebooks/d6367d62_notebook.py && \
    echo 'app = mo.App()' >> /app/notebooks/d6367d62_notebook.py && \
    echo '' >> /app/notebooks/d6367d62_notebook.py && \
    echo '@app.cell' >> /app/notebooks/d6367d62_notebook.py && \
    echo 'def __():' >> /app/notebooks/d6367d62_notebook.py && \
    echo '    return "Hello from Marimo!"' >> /app/notebooks/d6367d62_notebook.py && \
    echo '' >> /app/notebooks/d6367d62_notebook.py && \
    echo '@app.cell' >> /app/notebooks/d6367d62_notebook.py && \
    echo 'def __():' >> /app/notebooks/d6367d62_notebook.py && \
    echo '    return 42' >> /app/notebooks/d6367d62_notebook.py

# Expose Marimo default port
EXPOSE 2718

# Start Marimo with the directory to get it stable
# This will show the directory page, but at least the container will run
CMD ["python", "-m", "marimo", "edit", "--host", "0.0.0.0", "--port", "2718", "--headless", "--no-token", "/app/notebooks"]
