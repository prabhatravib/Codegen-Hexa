FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy startup script
COPY src/start_marimo.py .

# Create notebooks directory
RUN mkdir -p /app/notebooks

# Expose both ports: 8000 for container server, 2718 for Marimo
EXPOSE 8000 2718

# Start the container server
CMD ["python", "start_marimo.py"]
