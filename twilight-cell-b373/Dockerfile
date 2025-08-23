# syntax=docker/dockerfile:1.4
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all source files
COPY . .

# Create notebooks directory
RUN mkdir -p /app/notebooks

# Make startup script executable
RUN chmod +x start_marimo.py

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Expose Marimo port
EXPOSE 2718

# Use ENTRYPOINT to ensure startup script runs
ENTRYPOINT ["python", "test_simple.py"]
