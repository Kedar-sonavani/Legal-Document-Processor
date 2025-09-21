#!/usr/bin/env python3
"""
Script to run the FastAPI backend server.
"""
import os
import sys
import uvicorn
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def main():
    """Run the FastAPI server."""
    # Set environment variables if not already set
    if not os.getenv("PYTHONPATH"):
        os.environ["PYTHONPATH"] = str(project_root)
    
    # Configuration - support both PORT (Render) and API_PORT
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", os.getenv("API_PORT", "8000")))
    reload = False  # Always false for production deployment
    log_level = os.getenv("LOG_LEVEL", "info")
    
    print(f"Starting Contract Processing API...")
    print(f"Host: {host}")
    print(f"Port: {port}")
    print(f"Reload: {reload}")
    print(f"Log Level: {log_level}")
    print(f"Project Root: {project_root}")
    print(f"Environment: {'development' if reload else 'production'}")
    
    # Run the server
    uvicorn.run(
        "api.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level=log_level,
        access_log=True,
        workers=1 if reload else int(os.getenv("WORKERS", "1"))
    )

if __name__ == "__main__":
    main()
