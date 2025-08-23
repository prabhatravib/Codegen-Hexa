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

# Copy the main notebook file (workspace.py has numpy imports)
COPY workspace.py /app/notebooks/workspace.py

# Verify the notebook file was copied
RUN ls -la /app/notebooks/ && \
    cat /app/notebooks/workspace.py

# Set Marimo environment variables for stability
ENV MARIMO_SKIP_UPDATE_CHECK=1
ENV MARIMO_LOG_LEVEL=DEBUG

# Expose Marimo default port
EXPOSE 2718

# Create a startup script to handle Marimo startup more robustly
RUN echo '#!/bin/bash\n\
echo "Starting Marimo server..."\n\
echo "Python version: $(python --version)"\n\
echo "Marimo version: $(python -c \"import marimo; print(marimo.__version__)\")"\n\
echo "Current directory: $(pwd)"\n\
echo "Files in notebooks: $(ls -la)"\n\
cd /app/notebooks\n\
echo "Changed to notebooks directory: $(pwd)"\n\
echo "Attempting to start Marimo..."\n\
python -m marimo run --host 0.0.0.0 --port 2718 --no-token workspace.py 2>&1\n\
' > /app/start.sh && chmod +x /app/start.sh

# Use the startup script instead of direct command
CMD ["/app/start.sh"]
