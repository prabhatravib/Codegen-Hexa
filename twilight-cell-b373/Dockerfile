# syntax=docker/dockerfile:1.4
FROM python:3.11-slim

# Fast, reproducible installs with uv (optional but good)
# COPY --from=ghcr.io/astral-sh/uv:0.4.20 /uv /bin/uv
# ENV UV_SYSTEM_PYTHON=1
WORKDIR /app

# System deps - keep minimal
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential && rm -rf /var/lib/apt/lists/*

# App files
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Your notebooks and code
COPY . /app

# Expose Marimo default
EXPOSE 2718

# Start Marimo edit server with no authentication
CMD ["python", "-m", "marimo", "edit", "--host", "0.0.0.0", "--port", "2718", "--no-token"]
