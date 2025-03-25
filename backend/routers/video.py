from fastapi import APIRouter, File, UploadFile, HTTPException
import os
import uuid
import shutil
from pathlib import Path
import time
import json

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

    original_video_filename = file.filename
    # Generate a unique filename
    video_file_id = str(uuid.uuid4())
    # while True: # UUID collision check
    #     video_file_id = str(uuid.uuid4())

    #     # Check if a file with this UUID already exists
    #     if not os.path.exists(os.path.join(UPLOAD_FOLDER, f"{video_file_id}.json")):
    #         break
    video_file_extension = Path(file.filename).suffix
    video_filename = f"{video_file_id}{video_file_extension}"
    video_file_path = os.path.join(UPLOAD_FOLDER, video_filename)
    data = {
        "UUID": video_file_id,
        "original_filename": original_video_filename,
        "filename": video_filename,
        "content_type": file.content_type,
    }

    # Save the uploaded file
    with open(video_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Save the metadata
    video_metadata_path = os.path.join(UPLOAD_FOLDER, f"{video_file_id}.json")
    with open(video_metadata_path, "w", encoding="UTF-8") as f:
        json.dump(data, f, indent=4)

    return data


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
