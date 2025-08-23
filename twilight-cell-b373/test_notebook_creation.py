#!/usr/bin/env python3
"""
Test script to verify notebook creation functionality
Run this locally to test: python test_notebook_creation.py
"""

import sys
from pathlib import Path

# Add src to path for testing
sys.path.insert(0, str(Path(__file__).parent / "src"))

from start_marimo import create_new_notebook

def test_notebook_creation():
    """Test notebook creation locally"""
    print("🧪 Testing notebook creation...")
    
    # Create test notebooks directory
    test_dir = Path("./test_notebooks")
    test_dir.mkdir(exist_ok=True)
    
    # Test timestamped notebook creation
    print("\n📝 Testing timestamped notebook creation...")
    notebook1 = create_new_notebook(test_dir, use_timestamp=True)
    print(f"✅ Created: {notebook1.name}")
    
    # Test fixed name notebook creation
    print("\n📝 Testing fixed name notebook creation...")
    notebook2 = create_new_notebook(test_dir, use_timestamp=False)
    print(f"✅ Created: {notebook2.name}")
    
    # Verify files exist
    print(f"\n📁 Files in {test_dir}:")
    for file in test_dir.glob("*.py"):
        print(f"  - {file.name}")
    
    # Clean up test files
    print("\n🧹 Cleaning up test files...")
    for file in test_dir.glob("*.py"):
        file.unlink()
    test_dir.rmdir()
    
    print("✅ Test completed successfully!")

if __name__ == "__main__":
    test_notebook_creation()
