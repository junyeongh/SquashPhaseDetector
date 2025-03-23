from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
import shutil
from pathlib import Path
from typing import Dict, List, Optional

# Import routers
from routers import video, segmentation, pose, analysis

# Create FastAPI app
app = FastAPI(
    title="Squash Game Phase Detection API",
    description="API for analyzing squash videos and detecting game phases",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload and data directories if they don't exist
os.makedirs(os.environ.get("UPLOAD_FOLDER", "./uploads"), exist_ok=True)
os.makedirs(os.environ.get("EXPORT_FOLDER", "./data/exports"), exist_ok=True)

# Session storage - this would be replaced with a database in production
sessions: Dict[str, Dict] = {}

# Include routers
app.include_router(video.router)
app.include_router(segmentation.router)
app.include_router(pose.router)
app.include_router(analysis.router)

@app.get("/")
async def root():
    return {"message": "Squash Game Phase Detection API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
