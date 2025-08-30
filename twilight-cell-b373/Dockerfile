FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential && \
    rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the essential Python files
COPY src/container_startup.py /app/src/
COPY notebooks/ /app/notebooks/

# Create notebooks directory
RUN mkdir -p /app/notebooks

# Set environment variables
ENV MARIMO_SKIP_UPDATE_CHECK=1
ENV MARIMO_LOG_LEVEL=INFO

# Use Python script directly as entrypoint
CMD ["python", "/app/src/container_startup.py"]
