FROM public.ecr.aws/docker/library/python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies first for better caching
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Verify Marimo installation
RUN python -m marimo --version

# Copy application files
COPY src/ /app/src/
COPY start.sh /app/start.sh

# Create notebooks directory and make start script executable
RUN mkdir -p /app/notebooks && chmod +x /app/start.sh

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    MARIMO_SKIP_UPDATE_CHECK=1 \
    PORT=8080

EXPOSE 8080

CMD ["/app/start.sh"]

