from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
import os
import uuid
import shutil
from pathlib import Path
from typing import Dict, List, Optional
import time

router = APIRouter(
    prefix="/video",
    tags=["video"],
    responses={404: {"description": "Not found"}},
)

UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "/data/uploads")
GALLERY_FOLDER = os.environ.get("GALLERY_FOLDER", "/data/gallery")


@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    """
    Upload a video file for processing
    """
    # Verify file is a video
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")

    # Generate a unique filename
    file_id = str(uuid.uuid4())
    file_extension = Path(file.filename).suffix
    new_filename = f"{file_id}{file_extension}"
    file_path = os.path.join(UPLOAD_FOLDER, new_filename)

    # Save the uploaded file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "filename": new_filename,
        "original_filename": file.filename,
        "path": file_path,
        "content_type": file.content_type,
    }


VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".flv", ".wmv", ".webm"}

@router.get("/uploads")
async def list_uploads():
    """
    List all video files in the upload folder
    """
    try:
        files = []
        for filename in os.listdir(UPLOAD_FOLDER):
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.isfile(file_path):
                ext = os.path.splitext(filename)[1].lower()
                if ext in VIDEO_EXTENSIONS:  # Filter only video files
                    files.append(
                        {
                            "filename": filename,
                            "path": file_path,
                            "size": os.path.getsize(file_path),
                            "created": os.path.getctime(file_path),
                        }
                    )
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing uploads: {str(e)}")



@router.get("/gallery")
async def list_gallery():
    """
    List all files in the gallery folder
    """
    try:
        files = []
        for filename in os.listdir(GALLERY_FOLDER):
            file_path = os.path.join(GALLERY_FOLDER, filename)
            if os.path.isfile(file_path):
                ext = os.path.splitext(filename)[1].lower()
                if ext in VIDEO_EXTENSIONS:  # Filter only video files
                    files.append(
                        {
                            "filename": filename,
                            "path": file_path,
                            "size": os.path.getsize(file_path),
                            "created": os.path.getctime(file_path),
                        }
                    )
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing gallery: {str(e)}")


@router.post("/session/start")
async def start_session(video_path: str):
    """
    Initialize a new session for video processing
    """
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")

    session_id = str(uuid.uuid4())

    # Store session information
    from app import sessions

    sessions[session_id] = {
        "id": session_id,
        "video_path": video_path,
        "creation_time": time.time(),
        "masks": {},
        "poses": {},
        "game_states": [],
    }

    return {"session_id": session_id}


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """
    Get session information
    """
    from app import sessions

    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    return sessions[session_id]


@router.delete("/session/{session_id}")
async def close_session(session_id: str):
    """
    Close and cleanup a session
    """
    from app import sessions

    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    # Here you would add any cleanup code

    # Remove session
    del sessions[session_id]

    return {"success": True, "message": "Session closed"}
