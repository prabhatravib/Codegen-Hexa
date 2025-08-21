#!/usr/bin/env python3
"""
Test script for the Marimo container
"""

import requests
import time
import sys

def test_container():
    """Test the container endpoints"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Marimo Container...")
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check passed")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    # Test main interface
    try:
        response = requests.get(base_url, timeout=5)
        if response.status_code == 200:
            print("✅ Main interface accessible")
        else:
            print(f"❌ Main interface failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Main interface error: {e}")
        return False
    
    # Test notebook creation
    test_content = "print('Hello from test!')"
    try:
        response = requests.get(f"{base_url}/edit?file={test_content}", timeout=5)
        if response.status_code == 302:  # Redirect expected
            print("✅ Notebook creation endpoint working")
        else:
            print(f"❌ Notebook creation failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Notebook creation error: {e}")
        return False
    
    print("🎉 All tests passed! Container is working correctly.")
    return True

if __name__ == "__main__":
    print("Waiting for container to start...")
    time.sleep(3)  # Give container time to start
    
    if test_container():
        print("\n🚀 Container is ready to serve Marimo notebooks!")
        print("You can now deploy this to your Cloudflare Worker.")
    else:
        print("\n❌ Container tests failed. Check the logs.")
        sys.exit(1)
