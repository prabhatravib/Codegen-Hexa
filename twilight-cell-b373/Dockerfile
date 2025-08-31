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

# Copy the app.py file
COPY app.py .

# Set environment variables
ENV MARIMO_SKIP_UPDATE_CHECK=1
ENV MARIMO_LOG_LEVEL=INFO
ENV PYTHONUNBUFFERED=1

# Expose ports
EXPOSE 2718 8080

# Run the app.py script which handles both HTTP server and Marimo
CMD ["python", "app.py"]
