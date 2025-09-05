# syntax=docker/dockerfile:1.4
FROM python:3.11-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy app files
COPY src/ /app/src/
COPY *.py /app/
COPY start.sh /app/

# Create notebooks directory
RUN mkdir -p /app/notebooks

# Set environment variables
ENV MARIMO_SKIP_UPDATE_CHECK=1
ENV MARIMO_LOG_LEVEL=INFO

# Expose port
EXPOSE 2718

# Make executable the start script
RUN chmod +x /app/start.sh

# Use the start script
CMD ["/app/start.sh"]