"""
FastAPI main application for contract processing.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from api.routers import contracts, search, health, upload, rag

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    from pathlib import Path
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    yield
    # Shutdown cleanup if needed

app = FastAPI(
    title="Contract Processing API",
    description="API for processing legal contracts with OCR, embeddings, and RAG",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS based on environment
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(upload.router, prefix="/upload", tags=["upload"])
app.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
app.include_router(search.router, prefix="/search", tags=["search"])
app.include_router(rag.router, prefix="/rag", tags=["rag"])


@app.get("/")
async def root():
    return {"message": "Contract Processing API", "version": "1.0.0"}




