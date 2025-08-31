FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create notebooks directory
RUN mkdir -p /app/notebooks

# Create a simple notebook directly in the Dockerfile
RUN echo 'import marimo as mo\n\napp = mo.App()\n\n@app.cell\ndef __():\n    return "Hello from Marimo!"\n\n@app.cell\ndef __():\n    return 42' > /app/notebooks/notebook.py

# Set environment variables
ENV MARIMO_SKIP_UPDATE_CHECK=1
ENV MARIMO_LOG_LEVEL=INFO
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 2718

# Simple startup command
CMD ["python", "-m", "marimo", "edit", "--host", "0.0.0.0", "--port", "2718", "--headless", "--no-token", "--allow-origins", "*", "/app/notebooks/notebook.py"]
