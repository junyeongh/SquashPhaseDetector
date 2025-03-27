from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
import os
import uuid
import shutil
from pathlib import Path
import time
import json

from utils.video import extract_frames

router = APIRouter(
    prefix="/video",
    tags=["video"],
    responses={404: {"description": "Not found"}},
)

UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "/data/uploads")
GALLERY_FOLDER = os.environ.get("GALLERY_FOLDER", "/data/gallery")


@router.post("/upload")
async def upload_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Upload a video file for processing
    """
    # Verify file is a video
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")

    original_video_filename = file.filename
    video_file_id = str(uuid.uuid4())
    video_file_extension = Path(file.filename).suffix

    # Create subdirectory for this upload
    video_file_dir = os.path.join(UPLOAD_FOLDER, video_file_id)
    os.makedirs(video_file_dir, exist_ok=True)

    video_filename = f"{video_file_id}{video_file_extension}"
    video_file_path = os.path.join(video_file_dir, video_filename)

    # Save the uploaded file
    with open(video_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Save the metadata
    video_metadata_path = os.path.join(video_file_dir, "metadata.json")
    with open(video_metadata_path, "w", encoding="UTF-8") as f:
        json.dump(
            {
                "UUID": video_file_id,
                "original_filename": original_video_filename,
                "filename": video_filename,
                "content_type": file.content_type,
            },  # TODO information needed
            f,
            indent=2,
        )

    # Create subdirectory for each frames for future use
    frame_dir = os.path.join(video_file_dir, "frames/")
    os.makedirs(frame_dir, exist_ok=True)

    # Add frame extraction as a background task
    background_tasks.add_task(extract_frames, video_file_path, frame_dir)

    return {
        "UUID": video_file_id,
        "original_filename": original_video_filename,
        "filename": video_filename,
        "content_type": file.content_type,
    }


VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".flv", ".wmv", ".webm"}


@router.get("/upload")
async def list_uploads():
    """
    List all video files in the upload folder
    """
    files = []
    try:
        for filename in os.listdir(UPLOAD_FOLDER):
            full_path = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.isdir(full_path):
                metadata_path = os.path.join(full_path, "metadata.json")
                if os.path.exists(metadata_path):
                    with open(metadata_path, "r", encoding="UTF-8") as f:
                        metadata = json.load(f)
                        video_file_path = os.path.join(full_path, metadata["filename"])
                        data = {
                            "uuid": metadata["UUID"],
                            "filename": metadata["filename"],
                            "path": video_file_path,
                            "size": os.path.getsize(video_file_path),
                            "created": os.path.getctime(video_file_path),
                        }
                        files.append(data)
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


@router.get("/stream/{video_uuid}")
async def stream_video(video_uuid: str):
    """
    Stream a video file by UUID
    """
    try:
        # Find the video in the uploads folder
        video_dir = os.path.join(UPLOAD_FOLDER, video_uuid)

        if not os.path.exists(video_dir) or not os.path.isdir(video_dir):
            raise HTTPException(status_code=404, detail="Video not found")

        # Read metadata to get the filename
        metadata_path = os.path.join(video_dir, "metadata.json")
        if not os.path.exists(metadata_path):
            raise HTTPException(status_code=404, detail="Video metadata not found")

        with open(metadata_path, "r", encoding="UTF-8") as f:
            metadata = json.load(f)
            video_filename = metadata["filename"]

        video_path = os.path.join(video_dir, video_filename)
        if not os.path.exists(video_path):
            raise HTTPException(status_code=404, detail="Video file not found")

        # Determine content type based on file extension
        content_type = "video/mp4"  # Default
        ext = os.path.splitext(video_filename)[1].lower()
        if ext == ".avi":
            content_type = "video/x-msvideo"
        elif ext == ".mov":
            content_type = "video/quicktime"
        elif ext == ".webm":
            content_type = "video/webm"
        elif ext == ".mkv":
            content_type = "video/x-matroska"
        elif ext == ".flv":
            content_type = "video/x-flv"
        elif ext == ".wmv":
            content_type = "video/x-ms-wmv"

        # Create a generator to stream the file
        def iterfile():
            with open(video_path, "rb") as f:
                yield from f

        return StreamingResponse(
            iterfile(),
            media_type=content_type,
            headers={"Content-Disposition": f"inline; filename={video_filename}"},
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error streaming video: {str(e)}")


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
