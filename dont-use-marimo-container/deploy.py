#!/usr/bin/env python3
"""
Deployment script for Marimo Container on Cloudflare
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(cmd, description):
    """Run a command and handle errors"""
    print(f"🚀 {description}...")
    print(f"📝 Command: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        if result.stdout:
            print(f"📤 Output: {result.stdout}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed:")
        print(f"   Exit code: {e.returncode}")
        if e.stdout:
            print(f"   STDOUT: {e.stdout}")
        if e.stderr:
            print(f"   STDERR: {e.stderr}")
        return False

def main():
    """Main deployment function"""
    print("🚀 Deploying Marimo Container to Cloudflare...")
    
    # Check if we're in the right directory
    if not Path("wrangler.toml").exists():
        print("❌ Error: wrangler.toml not found. Please run this from the marimo-container directory.")
        sys.exit(1)
    
    # Check if wrangler is installed
    try:
        subprocess.run(["wrangler", "--version"], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Error: wrangler not found. Please install it first:")
        print("   npm install -g wrangler")
        sys.exit(1)
    
    # Build the project
    if not run_command(["npm", "run", "build"], "Building project"):
        print("❌ Build failed. Please fix the errors and try again.")
        sys.exit(1)
    
    # Deploy to Cloudflare
    if not run_command(["wrangler", "deploy"], "Deploying to Cloudflare"):
        print("❌ Deployment failed. Please check the errors and try again.")
        sys.exit(1)
    
    print("\n🎉 Deployment completed successfully!")
    print("🌐 Your Marimo container should now be available at:")
    print("   https://codegen-marimo.prabhatravib.workers.dev")
    print("\n📝 Next steps:")
    print("   1. Test the container endpoints")
    print("   2. Verify notebook creation works")
    print("   3. Test LLM integration from the backend")

if __name__ == "__main__":
    main()
