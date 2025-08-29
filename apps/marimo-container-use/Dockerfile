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

# Set Marimo environment variables for stability
ENV MARIMO_SKIP_UPDATE_CHECK=1
ENV MARIMO_LOG_LEVEL=INFO
ENV MARIMO_HOST=0.0.0.0
ENV MARIMO_PORT=2718
ENV MARIMO_HEADLESS=true
ENV MARIMO_NO_TOKEN=true
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Expose Marimo default port
EXPOSE 2718

# Create a startup script that generates a unique notebook
RUN echo '#!/bin/bash\n\
echo "Starting Marimo server with minimal notebook..."\n\
cd /app\n\
# For testing, use the minimal notebook first\n\
if [ -f "minimal_notebook.py" ]; then\n\
    echo "Using minimal notebook for testing"\n\
    python -m marimo edit --host $MARIMO_HOST --port $MARIMO_PORT --headless --no-token "minimal_notebook.py"\n\
else\n\
    echo "Creating and using UUID notebook..."\n\
    python src/create_uuid_notebook.py\n\
    cd /app/notebooks\n\
    # Get the notebook name that was created\n\
    notebook_file=$(ls *_marimo_notebook.py | head -1)\n\
    if [ -z "$notebook_file" ]; then\n\
        echo "ERROR: No notebook file found!"\n\
        exit 1\n\
    fi\n\
    echo "Starting Marimo with notebook: $notebook_file"\n\
    python -m marimo edit --host $MARIMO_HOST --port $MARIMO_PORT --headless --no-token "$notebook_file"\n\
fi\n\
' > /app/start.sh && chmod +x /app/start.sh

# Use the startup script instead of direct command
CMD ["/app/start.sh"]
