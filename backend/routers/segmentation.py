import json
import logging
import os
from typing import Any, Dict, List

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from models.segmentation_sam2 import run_sam2_segmentation

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


# # Define the request body model
# class SegmentationRequest(BaseModel):
#     video_uuid: str
#     marker_input: List[Dict[str, Any]]


@router.get("/models")
async def get_models():
    """
    Get the list of all models available
    """
    return {"models": ["sam2"]}


@router.post("/sam2/{video_uuid}")
async def run_sam2_model(video_uuid: str):
    """
    Run SAM2 segmentation on the video by UUID
    """
    pass


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
    pass
