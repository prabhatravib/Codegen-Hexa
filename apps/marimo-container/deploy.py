#!/usr/bin/env python3
"""
Production deployment script for Marimo Container
"""

import os
import sys
import subprocess
import requests
import time
from pathlib import Path

def deploy_to_railway():
    """Deploy to Railway (free tier available)"""
    print("🚀 Deploying to Railway...")
    
    # Check if Railway CLI is installed
    try:
        subprocess.run(["railway", "--version"], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Railway CLI not found. Installing...")
        subprocess.run(["npm", "install", "-g", "@railway/cli"], check=True)
    
    # Login to Railway
    print("🔐 Logging into Railway...")
    subprocess.run(["railway", "login"], check=True)
    
    # Initialize Railway project
    print("📁 Initializing Railway project...")
    subprocess.run(["railway", "init"], check=True)
    
    # Deploy
    print("🚀 Deploying container...")
    subprocess.run(["railway", "deploy"], check=True)
    
    # Get deployment URL
    result = subprocess.run(["railway", "status"], capture_output=True, text=True, check=True)
    print("✅ Deployment complete!")
    print(result.stdout)
    
    return True

def deploy_to_render():
    """Deploy to Render (free tier available)"""
    print("🚀 Deploying to Render...")
    
    # Create render.yaml
    render_config = """
services:
  - type: web
    name: marimo-container
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python src/start_marimo.py
    envVars:
      - key: PYTHON_VERSION
        value: 3.11
    healthCheckPath: /health
    """
    
    with open("render.yaml", "w") as f:
        f.write(render_config)
    
    print("📝 Created render.yaml")
    print("🌐 Deploy to Render at: https://render.com")
    print("📁 Upload this directory to your Render repository")
    
    return True

def deploy_to_fly():
    """Deploy to Fly.io (free tier available)"""
    print("🚀 Deploying to Fly.io...")
    
    # Check if Fly CLI is installed
    try:
        subprocess.run(["fly", "version"], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Fly CLI not found. Installing...")
        subprocess.run(["curl", "-L", "https://fly.io/install.sh", "|", "sh"], shell=True, check=True)
    
    # Create fly.toml
    fly_config = """
app = "marimo-container"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8000"

[[services]]
  internal_port = 8000
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

  [[services.tcp_checks]]
    interval = "15s"
    timeout = "2s"
    grace_period = "1s"
    restart_limit = 0
    """
    
    with open("fly.toml", "w") as f:
        f.write(fly_config)
    
    # Deploy
    print("🚀 Deploying to Fly.io...")
    subprocess.run(["fly", "deploy"], check=True)
    
    print("✅ Deployment complete!")
    return True

def main():
    print("🚀 Marimo Container Production Deployment")
    print("=" * 50)
    
    print("\nChoose deployment platform:")
    print("1. Railway (easiest, free tier)")
    print("2. Render (free tier, good for Python)")
    print("3. Fly.io (free tier, global CDN)")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    try:
        if choice == "1":
            deploy_to_railway()
        elif choice == "2":
            deploy_to_render()
        elif choice == "3":
            deploy_to_fly()
        else:
            print("❌ Invalid choice")
            return False
        
        print("\n🎉 Container deployed successfully!")
        print("🔗 Update your Cloudflare Worker to point to the new container URL")
        
    except Exception as e:
        print(f"❌ Deployment failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    main()
