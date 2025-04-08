import json
import os
import re
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse

from utils.preprocess import generate_mainview_timestamp
from utils.video import extract_frames, get_video_info

router = APIRouter(
    prefix="/video",
    tags=["video"],
    responses={404: {"description": "Not found"}},
)

UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "/data/uploads")
VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".flv", ".wmv", ".webm"}

# in-memory storage (database in production - future improvement)
processing_videos = {}


# MARK: router "/upload"
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
                print(metadata_path)
                with open(metadata_path, "r", encoding="UTF-8") as f:
                    metadata = json.load(f)
                    video_file_path = os.path.join(full_path, metadata["filename"])
                    data = {
                        **metadata,
                        "size": os.path.getsize(video_file_path),
                        "created": os.path.getctime(video_file_path),
                    }
                    files.append(data)
        return {"files": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing uploads: {str(e)}")


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

    video_info = get_video_info(video_file_path)
    # Save the metadata
    video_metadata_path = os.path.join(video_file_dir, "metadata.json")
    metadata = {
        "UUID": video_file_id,
        "original_filename": original_video_filename,
        "filename": video_filename,
        "content_type": file.content_type,
        # video info
        "width": video_info["width"],
        "height": video_info["height"],
        "fps": video_info["fps"],
        "total_frames": video_info["total_frames"],
        "duration_seconds": video_info["duration_seconds"],
        "codec": video_info["codec"],
    }
    with open(video_metadata_path, "w", encoding="UTF-8") as f:
        json.dump(
            metadata,
            f,
            indent=2,
        )

    # Add frame extraction and main view timestamp generation as background tasks
    background_tasks.add_task(extract_frames, video_file_path, video_file_dir)

    return metadata


@router.get("/upload/{video_uuid}")
async def get_upload_metadata(video_uuid: str):
    """
    Get the metadata of a specific uploaded video by UUID
    """
    video_dir = os.path.join(UPLOAD_FOLDER, video_uuid)

    if not os.path.exists(video_dir) or not os.path.isdir(video_dir):
        raise HTTPException(status_code=404, detail="Video not found")

    metadata_path = os.path.join(video_dir, "metadata.json")
    if not os.path.exists(metadata_path):
        raise HTTPException(status_code=404, detail="Video metadata not found")

    with open(metadata_path, "r", encoding="UTF-8") as f:
        metadata = json.load(f)
        video_file_path = os.path.join(video_dir, metadata["filename"])
        data = {
            **metadata,
            "path": video_file_path,
            "size": os.path.getsize(video_file_path),
            "created": os.path.getctime(video_file_path),
        }

    return data


@router.delete("/upload/{video_uuid}")
async def delete_upload(video_uuid: str):
    """
    Delete a video file by UUID
    """
    video_dir = os.path.join(UPLOAD_FOLDER, video_uuid)
    if os.path.exists(video_dir):
        shutil.rmtree(video_dir)


# MARK: router "/stream"
@router.get("/stream/{video_uuid}")
async def stream_video(request: Request, video_uuid: str):
    """
    Stream a video file by UUID with support for range requests
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

        # Get file size
        file_size = os.path.getsize(video_path)

        # Parse range header
        range_header = request.headers.get("range")

        # If no range header, return entire file
        if range_header is None:

            def iterfile():
                with open(video_path, "rb") as f:
                    yield from f

            return StreamingResponse(
                iterfile(),
                media_type=content_type,
                headers={
                    "Content-Disposition": f"inline; filename={video_filename}",
                    "Accept-Ranges": "bytes",
                    "Content-Length": str(file_size),
                },
            )

        # Parse range
        range_match = re.search(r"bytes=(\d+)-(\d*)", range_header)
        if not range_match:
            raise HTTPException(status_code=416, detail="Range Not Satisfiable")

        start_byte = int(range_match.group(1))
        end_byte_str = range_match.group(2)
        end_byte = int(end_byte_str) if end_byte_str else file_size - 1

        # Validate range
        if start_byte > end_byte or start_byte >= file_size or end_byte >= file_size:
            raise HTTPException(status_code=416, detail="Range Not Satisfiable")

        content_length = end_byte - start_byte + 1

        # Create a generator to stream the requested range
        def iterfile_range():
            with open(video_path, "rb") as f:
                f.seek(start_byte)
                remaining = content_length
                while remaining > 0:
                    chunk_size = min(8192, remaining)  # Read in 8kb chunks
                    data = f.read(chunk_size)
                    if not data:
                        break
                    remaining -= len(data)
                    yield data

        return StreamingResponse(
            content=iterfile_range(),
            status_code=206,
            media_type=content_type,
            headers={
                "Content-Range": f"bytes {start_byte}-{end_byte}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(content_length),
                "Content-Disposition": f"inline; filename={video_filename}",
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error streaming video: {str(e)}")


# MARK: router "/mainview"
@router.post("/mainview/{video_uuid}")
async def generate_main_view(video_uuid: str, background_tasks: BackgroundTasks):
    """
    Generate main view timestamps for a video
    """
    # Find the video in the uploads folder
    video_dir = os.path.join(UPLOAD_FOLDER, video_uuid)

    if not os.path.exists(video_dir) or not os.path.isdir(video_dir):
        raise HTTPException(status_code=404, detail="Video not found")

    # Check if already processing this video
    if video_uuid in processing_videos:
        return {"status": "Processing already in progress", "video_uuid": video_uuid}

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

    # Mark as processing
    processing_videos[video_uuid] = "starting"

    # Define a wrapper function to update status and clean up after processing
    async def process_with_status_updates():
        try:
            # Update status
            processing_videos[video_uuid] = "processing"

            # Add main view timestamp generation as a background task
            await generate_mainview_timestamp(video_path, video_dir)

            # Processing complete, remove from processing dict
            if video_uuid in processing_videos:
                del processing_videos[video_uuid]

        except Exception as e:
            # On error, update status and log error
            if video_uuid in processing_videos:
                processing_videos[video_uuid] = f"error: {str(e)}"
            print(f"Error processing video {video_uuid}: {str(e)}")

    # Add the wrapped task to background tasks
    background_tasks.add_task(process_with_status_updates)

    return {"status": "started", "video_uuid": video_uuid}


@router.get("/mainview/{video_uuid}")
async def get_main_view_timestamps(video_uuid: str):
    """
    Get main view timestamps for a video
    """
    video_dir = os.path.join(UPLOAD_FOLDER, video_uuid)

    if not os.path.exists(video_dir) or not os.path.isdir(video_dir):
        raise HTTPException(status_code=404, detail="Video not found")

    mainview_file_path = os.path.join(video_dir, "mainview_timestamp.json")
    if not os.path.exists(mainview_file_path):
        raise HTTPException(status_code=404, detail="Main view timestamps not found")

    # Read and parse the JSON file
    with open(mainview_file_path, "r") as f:
        data = json.load(f)

    return data


@router.get("/mainview/{video_uuid}/status")
async def get_mainview_processing_status(video_uuid: str):
    """
    Get the processing status of main view detection for a video
    """
    video_dir = os.path.join(UPLOAD_FOLDER, video_uuid)

    if not os.path.exists(video_dir) or not os.path.isdir(video_dir):
        raise HTTPException(status_code=404, detail="Video not found")

    # Check if the video is currently being processed
    is_processing = video_uuid in processing_videos

    # Check if mainview timestamps exist
    mainview_file_path = os.path.join(video_dir, "mainview_timestamp.json")
    has_mainview = os.path.exists(mainview_file_path)

    status = "idle"
    if is_processing:
        status = processing_videos[video_uuid]
    elif has_mainview:
        status = "completed"

    return {
        "video_uuid": video_uuid,
        "is_processing": is_processing,
        "has_mainview": has_mainview,
        "status": status,
    }
