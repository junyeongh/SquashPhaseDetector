import json
import logging
import os
from typing import Any, Dict, List

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from models.segmentation_sam2 import run_sam2_segmentation
from utils.segmentation import SegmentationRequest

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/segmentation",
    tags=["segmentation"],
    responses={404: {"description": "Not found"}},
)

UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "/data/uploads")

processing_videos = {}


@router.get("/models")
async def get_models():
    """
    Get the list of all models available
    """
    return {"models": ["sam2"]}


@router.post("/sam2/{video_uuid}")
async def run_sam2_model(video_uuid: str, request: SegmentationRequest, background_tasks: BackgroundTasks):
    """
    Run SAM2 segmentation on the video by UUID
    """
    video_dir = os.path.join(UPLOAD_FOLDER, video_uuid)
    if not os.path.exists(video_dir) or not os.path.isdir(video_dir):
        raise HTTPException(status_code=404, detail="Video not found")

    if not os.path.exists(os.path.join(video_dir, "frames")):
        raise HTTPException(status_code=404, detail="Video frames not found")

    if video_uuid in processing_videos:
        return {"status": "Processing already in progress", "video_uuid": video_uuid}

    processing_videos[video_uuid] = "starting"

    async def process_with_status_updates():
        try:
            processing_videos[video_uuid] = "processing"

            await run_sam2_segmentation(video_dir, request.marker_input["marker_input"])

            if video_uuid in processing_videos:
                del processing_videos[video_uuid]

        except Exception as e:
            if video_uuid in processing_videos:
                processing_videos[video_uuid] = f"error: {str(e)}"
            print(f"Error processing video {video_uuid}: {str(e)}")

    background_tasks.add_task(process_with_status_updates)

    return {"status": "started", "video_uuid": video_uuid}


@router.get("/sam2/{video_uuid}")
async def get_sam2_model_result(video_uuid: str):
    """
    Get the segmentation result for the video by UUID
    """
    video_dir = os.path.join(UPLOAD_FOLDER, video_uuid)

    if not os.path.exists(video_dir) or not os.path.isdir(video_dir):
        raise HTTPException(status_code=404, detail="Video not found")

    segmentation_file_path = os.path.join(video_dir, "segmentation.json")
    if not os.path.exists(segmentation_file_path):
        raise HTTPException(status_code=404, detail="Segmentation not found")

    with open(segmentation_file_path, "r") as f:
        data = json.load(f)

    return data


@router.get("/sam2/{video_uuid}/status")
async def get_sam2_model_status(video_uuid: str):
    """
    Get the status of SAM2 segmentation for the video by UUID
    """
    video_dir = os.path.join(UPLOAD_FOLDER, video_uuid)

    if not os.path.exists(video_dir) or not os.path.isdir(video_dir):
        raise HTTPException(status_code=404, detail="Video not found")

    is_processing = video_uuid in processing_videos
    segmentation_file_path = os.path.join(video_dir, "segmentation.json")
    has_segmentation = os.path.exists(segmentation_file_path)

    status = "idle"
    if is_processing:
        status = processing_videos[video_uuid]
    elif has_segmentation:
        status = "completed"

    return {
        "video_uuid": video_uuid,
        "is_processing": is_processing,
        "has_segmentation": has_segmentation,
        "status": status,
    }
