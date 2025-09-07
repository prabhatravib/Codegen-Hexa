# Use Python 3.11 slim image
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Create notebooks directory
RUN mkdir -p /app/notebooks

# Copy application files
COPY start.sh /app/
RUN chmod +x /app/start.sh

# Copy source files
COPY src/ /app/src/

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV MARIMO_SKIP_UPDATE_CHECK=1

# Expose port
EXPOSE 2718

# Use the start script as entrypoint
ENTRYPOINT ["/app/start.sh"]
