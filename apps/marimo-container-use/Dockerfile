# syntax=docker/dockerfile:1.4
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . /app/

# Create notebooks directory
RUN mkdir -p /app/notebooks

# Create a default notebook
RUN echo 'import marimo as mo\n\
\n\
app = mo.App()\n\
\n\
@app.cell\n\
def __():\n\
    return "Hello from Marimo!"\n' > /app/notebooks/default.py

# Environment variables
ENV MARIMO_SKIP_UPDATE_CHECK=1
ENV MARIMO_LOG_LEVEL=INFO
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 2718

# Start both the simple server (for API) and Marimo
CMD ["sh", "-c", "python simple_server.py & python -m marimo edit --host 0.0.0.0 --port 2718 --headless --no-token /app/notebooks/"]
