import json
import logging
import os
from typing import Any, Dict, List

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from utils.segmentation import run_sam2_segmentation

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


# Define the request body model
class SegmentationRequest(BaseModel):
    video_uuid: str
    marker_input: List[Dict[str, Any]]


@router.post("/segmentation")
async def run_segmentation(background_tasks: BackgroundTasks, request: SegmentationRequest):
    """
    Run segmentation on a video with specified marker inputs
    """
    video_uuid = request.video_uuid
    marker_input = request.marker_input

    # Find the video in the uploads folder
    video_dir = os.path.join(UPLOAD_FOLDER, video_uuid)

    if not os.path.exists(video_dir) or not os.path.isdir(video_dir):
        raise HTTPException(status_code=404, detail="Video not found")

    # Check if already processing this video
    if video_uuid in processing_videos:
        return {"status": "Processing already in progress", "video_uuid": video_uuid}

    # Check if mainview timestamps exist (required for segmentation)
    mainview_file_path = os.path.join(video_dir, "mainview_timestamp.json")
    if not os.path.exists(mainview_file_path):
        raise HTTPException(status_code=400, detail="Main view timestamps not found. Run main view detection first.")

    # Mark as processing
    processing_videos[video_uuid] = "starting"

    # Define a wrapper function to update status and handle exceptions
    async def process_with_status_updates():
        try:
            # Update status
            processing_videos[video_uuid] = "processing"

            logger.info(f"Starting segmentation for video {video_uuid}")

            # Run the segmentation
            run_sam2_segmentation(video_dir, marker_input)

            # Processing complete, update status
            processing_videos[video_uuid] = "completed"
            logger.info(f"Completed segmentation for video {video_uuid}")

        except Exception as e:
            # On error, update status and log error
            error_message = str(e)
            processing_videos[video_uuid] = f"error: {error_message}"
            logger.error(f"Error processing segmentation for video {video_uuid}: {error_message}")

    # Add the wrapped task to background tasks
    background_tasks.add_task(process_with_status_updates)

    return {"status": "Processing started", "video_uuid": video_uuid}


# @router.get("/segmentation/{video_uuid}/")
# async def get_segmentation_results(video_uuid: str):
#     """
#     Get the segmentation masks for a video
#     """
#     video_dir = os.path.join(UPLOAD_FOLDER, video_uuid)
#     segmentation_dir = os.path.join(video_dir, "segmentation")


@router.get("/segmentation/{video_uuid}/status")
async def get_segmentation_status(video_uuid: str):
    """
    Get the processing status of segmentation for a video
    """
    if video_uuid not in processing_videos:
        # Check if segmentation data exists
        video_dir = os.path.join(UPLOAD_FOLDER, video_uuid)
        segmentation_dir = os.path.join(video_dir, "segmentation")
        if os.path.exists(segmentation_dir) and os.listdir(segmentation_dir):
            return {"status": "completed", "video_uuid": video_uuid}
        return {"status": "not_started", "video_uuid": video_uuid}

    return {"status": processing_videos[video_uuid], "video_uuid": video_uuid}
