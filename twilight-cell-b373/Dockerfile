# syntax=docker/dockerfile:1.4
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required for popular Python packages used in Marimo notebooks
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application sources
COPY src/ /app/src/
COPY *.py /app/
COPY start.sh /app/start.sh

# Ensure notebooks directory exists for generated content
RUN mkdir -p /app/notebooks

ENV MARIMO_SKIP_UPDATE_CHECK=1     MARIMO_LOG_LEVEL=INFO     PYTHONUNBUFFERED=1

EXPOSE 8080

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
